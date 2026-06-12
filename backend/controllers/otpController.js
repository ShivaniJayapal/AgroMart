const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REQUEST OTP
exports.requestOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone is required" });
  }

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpVerification.create({
      userId: user._id,
      otpCode: otp,
      expiresAt
    });

    await transporter.sendMail({
      from: `"AgroMart" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your AgroMart OTP",
      html: `
        <h2>AgroMart Login OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      message: "OTP sent to registered email and phone"
    });

  } catch (error) {
  console.error("OTP send error:", error);
  res.status(500).json({ message: "Failed to send OTP" });
}
};

// VERIFY OTP
exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      message: "Phone and OTP are required"
    });
  }

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const otpRecord = await OtpVerification.findOne({
      userId: user._id,
      otpCode: otp,
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP verified successfully",
      token,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({
      message: "OTP verification failed"
    });
  }
};