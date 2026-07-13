// controller/logoutController.js
const { supabase, UserModel } = require('../models/supabaseClient');

exports.logoutUser = async (req, res) => {
  const { loginId } = req.body;

  try {
    if (!loginId) {
      return res.status(400).json({ 
        success: false,
        message: 'Login ID is required' 
      });
    }

    // Find user
    let user = await UserModel.findByLoginId(loginId.toLowerCase().trim());
    if (!user) {
      user = await UserModel.findByEmail(loginId.toLowerCase().trim());
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // ✅ Direct Supabase update (if updateLastLogout is missing)
    const { data, error } = await supabase
      .from('users')
      .update({ last_logout: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    console.log("User Logged Out:", user.name, "at", new Date().toISOString());

    delete user.password_hash;

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        loginId: user.login_id,
        lastLogout: data.last_logout,
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