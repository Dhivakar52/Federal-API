const { UserModel } = require('../models/supabaseClient');

exports.resetPassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    // Validation
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, old password, and new password are required"
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    // Find user by email
    const user = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify old password
    const isMatch = await UserModel.comparePassword(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // Update password (this will automatically hash it)
    const updatedUser = await UserModel.update(user.id, {
      password: newPassword // ✅ This will be hashed in the update method
    });

    // Remove sensitive data
    delete updatedUser.password_hash;

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        lastLogin: updatedUser.last_login
      }
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};