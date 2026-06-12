const User = require("../models/User");

exports.signup = async (req, res) => {
  const { name, email, phone, role } = req.body;

  if (!name || !email || !phone || !role) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    await User.create({
      name,
      email,
      phone,
      role
    });

    res.status(201).json({
      message: "Signup successful. Please login using OTP.",
    });

  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
};