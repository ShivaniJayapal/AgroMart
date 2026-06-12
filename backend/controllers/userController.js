const User = require('../models/User');

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update Profile (name + optional extra fields)
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { fullName, name, address } = req.body;

    if (fullName) user.name = fullName;
    else if (name) user.name = name;
    
    if (address) {
      user.address = address;
    }

    await user.save();
    res.json({ message: "Profile updated successfully", name: user.name, address: user.address });
  } catch (error) {
    console.error("Profile update error", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.address = req.body; // Expects { street, landmark, city, pincode }
    await user.save();
    res.json({ message: "Address updated successfully", address: user.address });
  } catch (error) {
    console.error("Address update error", error);
    res.status(500).json({ message: "Update failed" });
  }
};