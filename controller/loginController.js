const jwt = require("jsonwebtoken");
const User = require("../models/Employee");

exports.loginUser = async (req, res) => {
  const { loginId, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${loginId}$`, "i") } },
        { loginId: { $regex: new RegExp(`^${loginId}$`, "i") } },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    // ✅ Create JWT token
    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    });

    // ✅ Send token and user info to frontend
    return res.status(200).json({
      message: "Login successful",
      token,
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error during login",
      error: err.message,
    });
  }
};
