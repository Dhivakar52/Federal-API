const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");

exports.resetPassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    const user = await Employee.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.passwordHash = newPassword; 
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
