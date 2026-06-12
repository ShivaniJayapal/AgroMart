const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  otpCode: String,
  expiresAt: Date,
  verified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);