const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: String,
      price: Number,
      quantity: Number,
    }
  ],
  shipping: {
    fullName: String,
    phone: String,
    house: String,
    landmark: String,
    state: String,
    city: String,
    pincode: String,
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: { type: String, enum: ['created', 'paid', 'failed', 'cancelled'], default: 'created' },
  status: { type: String, enum: ['pending', 'placed', 'shipped', 'in_transit', 'delivered', 'completed', 'cancelled', 'payment_failed'], default: 'pending' },
  deliveryUpdates: [
    {
      status: { type: String, enum: ['pending', 'placed', 'shipped', 'in_transit', 'delivered'] },
      note: String,
      location: String,
      updatedAt: { type: Date, default: Date.now },
    }
  ],
  deliveredAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
