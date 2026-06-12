const mongoose = require('mongoose');
const Cart = require('./models/Cart');
const Product = require('./models/Product');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/agromart');
    const carts = await Cart.find().populate('productId').limit(10).lean();
    console.log('CARTS', JSON.stringify(carts, null, 2));
    const products = await Product.find().limit(20).lean();
    console.log('PRODS', JSON.stringify(products, null, 2));
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
