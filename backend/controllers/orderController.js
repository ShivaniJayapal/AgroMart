const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.TEST_API_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.TESTKEYSECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { items, shipping, amount } = req.body;

    console.log('createOrder payload:', { items, shipping, amount, userId: req.user?.id });

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Invalid order payload: items is required and must be non-empty array' });
    }
    if (!shipping || typeof shipping !== 'object') {
      return res.status(400).json({ message: 'Invalid order payload: shipping is required' });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid order payload: amount must be a positive number' });
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({ message: 'Invalid item data: productId, name, price, quantity required' });
      }
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ message: `Invalid productId: ${item.productId}` });
      }
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const order = await Order.create({
      userId: req.user.id,
      items,
      shipping,
      amount: numericAmount,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'created',
      status: 'pending',
      deliveryUpdates: [{ status: 'pending', note: 'Order created, awaiting payment', updatedAt: new Date() }],
    });

    return res.json({
      message: 'Razorpay order created',
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID || process.env.TEST_API_KEY,
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format: ' + error.message });
    }
    return res.status(500).json({ message: 'Could not create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.TESTKEYSECRET;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    if (generated_signature !== razorpay_signature) {
      order.paymentStatus = 'failed';
      order.status = 'payment_failed';
      await order.save();
      return res.status(400).json({ message: 'Signature verification failed' });
    }

    // Verify payment capture status from Razorpay
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment && payment.status === 'captured') {
      order.paymentStatus = 'paid';
      order.status = 'placed';
      order.deliveryUpdates.push({ status: 'placed', note: 'Payment received, order placed', updatedAt: new Date() });
    } else {
      order.paymentStatus = payment?.status || 'failed';
      order.status = 'payment_failed';
      order.deliveryUpdates.push({ status: 'payment_failed', note: 'Payment failed', updatedAt: new Date() });
    }

    await order.save();

    // Clear user cart on successful payment and send notifications
    if (order.paymentStatus === 'paid') {
      await Cart.deleteMany({ userId: req.user.id });

      await order.populate({
        path: 'items.productId',
        populate: { path: 'farmerId', select: 'name email' }
      });

      console.log('Order items after populate:', JSON.stringify(order.items.map(item => ({
        productId: item.productId?._id,
        productName: item.productId?.name,
        farmerEmail: item.productId?.farmerId?.email,
      })), null, 2));

      const customer = await User.findById(req.user.id).select('name email').lean();
      const orderItemsHtml = order.items
        .map(item => `<li>${item.name} x ${item.quantity} @ ₹${item.price}</li>`)
        .join('');
      const totalHtml = `
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total Amount:</strong> ₹${order.amount}</p>
        <p><strong>Shipping Address:</strong> ${order.shipping.fullName}, ${order.shipping.house || ''} ${order.shipping.landmark || ''}, ${order.shipping.city}, ${order.shipping.pincode}</p>
      `;

      if (customer?.email) {
        console.log('Sending customer order email to:', customer.email);
        sendEmail({
          to: customer.email,
          subject: 'Your AgroMart order has been placed',
          html: `
            <h2>Order Placed Successfully</h2>
            <p>Hi ${customer.name || 'Customer'},</p>
            <p>Your order has been placed successfully. Here are the details:</p>
            <ul>${orderItemsHtml}</ul>
            ${totalHtml}
            <p>Thank you for shopping with AgroMart.</p>
          `,
        }).catch((err) => console.error('Customer order email failed:', err));
      }

      const farmerOrders = new Map();
      order.items.forEach((item) => {
        const product = item.productId;
        const farmer = product?.farmerId;
        if (farmer?.email) {
          const farmerKey = farmer._id.toString();
          if (!farmerOrders.has(farmerKey)) {
            farmerOrders.set(farmerKey, { farmer, items: [] });
          }
          farmerOrders.get(farmerKey).items.push(item);
        }
      });

      if (!farmerOrders.size) {
        console.warn('No farmer email targets found for order:', order._id);
      }

      const farmerEmailResults = await Promise.allSettled(Array.from(farmerOrders.values()).map(async ({ farmer, items }) => {
        const farmerItemsHtml = items
          .map(item => `<li>${item.name} x ${item.quantity} @ ₹${item.price}</li>`)
          .join('');

        console.log('Sending farmer email to:', farmer.email);
        return sendEmail({
          to: farmer.email,
          subject: `New AgroMart order received from ${customer?.name || 'a customer'}`,
          html: `
            <h2>New Order Received</h2>
            <p>Hi ${farmer.name || 'Farmer'},</p>
            <p>You have received a new order from ${customer?.name || 'a customer'}.</p>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <ul>${farmerItemsHtml}</ul>
            <p><strong>Shipping Address:</strong> ${order.shipping.fullName}, ${order.shipping.house || ''} ${order.shipping.landmark || ''}, ${order.shipping.city}, ${order.shipping.pincode}</p>
            <p>Please prepare the items for delivery.</p>
          `,
        });
      }));

      farmerEmailResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Farmer email ${index} failed:`, result.reason);
        }
      });
    }

    return res.json({
      message: 'Payment verification done',
      paymentStatus: order.paymentStatus,
      status: order.status,
      orderId: order._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ message: 'Payment verification failed' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, location, note } = req.body;

    const allowed = ['shipped', 'in_transit', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Order payment not completed' });
    }

    order.status = status;
    order.deliveryUpdates.push({ status, note: note || `Order ${status.replace('_', ' ')}`, location: location || '', updatedAt: new Date() });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Could not update order status' });
  }
};

exports.getReceivedOrders = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const orders = await Order.find({ status: { $in: ['placed', 'shipped', 'in_transit', 'delivered'] } })
      .populate({
        path: 'items.productId',
        select: 'farmerId name price',
      })
      .sort({ createdAt: -1 });

    const receivedOrders = orders.filter((order) =>
      order.items.some((item) => item.productId?.farmerId?.toString() === farmerId)
    );

    res.json(receivedOrders);
  } catch (error) {
    console.error('Get received orders error:', error);
    res.status(500).json({ message: 'Could not fetch received orders' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.productId', 'name image unit price averageRating reviewCount')
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({
      user: req.user.id,
      order: { $in: orderIds }
    })
      .select('product order rating comment createdAt updatedAt')
      .lean();

    const reviewLookup = new Map(
      reviews.map((review) => [`${review.order.toString()}-${review.product.toString()}`, review])
    );

    const normalizedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => {
        const productDoc = item.productId && typeof item.productId === 'object' ? item.productId : null;
        const productId = productDoc?._id?.toString() || item.productId?.toString();
        const review = productId
          ? reviewLookup.get(`${order._id.toString()}-${productId}`) || null
          : null;

        return {
          ...item,
          productId: productDoc || item.productId,
          canReview:
            order.paymentStatus === 'paid' &&
            !['cancelled', 'payment_failed'].includes(order.status),
          review,
        };
      }),
    }));

    res.json(normalizedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Could not fetch orders' });
  }
};
