const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  address: {
    street: String,
    landmark: String,
    city: String,
    pincode: String
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);
