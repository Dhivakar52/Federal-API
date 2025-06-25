const User = require("../models/Employee");

exports.loginUser = async (req, res) => {
  const { loginId, password } = req.body;
  console.log(loginId, password);

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
    if (isMatch) {
      user.lastLogin = new Date();
      await user.save();

      return res.status(200).json({
        message: "Login successful",
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
      });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error during login",
      error: err.message,
    });
  }
};
