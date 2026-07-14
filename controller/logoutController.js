// controller/logoutController.js - UPDATED

const { UserModel } = require('../models/supabaseClient');

exports.logoutUser = async (req, res) => {
  const { email } = req.body;  // ✅ Changed from loginId to email

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // ✅ Find user by email
    const user = await UserModel.findByEmail(email.toLowerCase().trim());

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    await UserModel.updateLastLogout(user.id);

    console.log("User Logged Out:", user.name, "at", new Date().toISOString());

    delete user.password_hash;

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lastLogout: user.last_logout,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Logout Error:", err.message);
    return res.status(500).json({ 
      success: false,
      message: 'Error during logout', 
      error: err.message 
    });
  }
};