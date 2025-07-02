const jwt = require("jsonwebtoken");
const User = require("../models/Employee"); // Must match the model export
const dotenv = require("dotenv");
dotenv.config();

exports.loginUser = async (req, res) => {
  const { loginId, password } = req.body;

  try {
    console.log("Login Attempt:", loginId);

    if (!loginId || !password) {
      console.log("Missing credentials");
      return res.status(400).json({ message: "Login ID and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: new RegExp(`^${loginId}$`, "i") },
        { loginId: new RegExp(`^${loginId}$`, "i") },
      ],
    });

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "User not found" });
    }

    console.log("User found:", user.email);
    console.log("Checking password...");

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log("Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password matched");

    user.lastLogin = new Date();
    await user.save();

    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    });

    console.log("JWT created");

    return res.status(200).json({
      message: "Login successful",
      token,
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin,
    });

  } catch (err) {
    console.error("🔥 Login Error:", err.stack);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
};

