// controller/loginController.js - UPDATED (Email only)

const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/supabaseClient");

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;  // ✅ Changed from loginId to email

  try {
    console.log('📥 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // ✅ Find user by email only
    const user = await UserModel.findByEmail(email.trim());
    console.log('  Search by email:', user ? '✅ Found' : '❌ Not found');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      hasPassword: !!user.password_hash
    });

    if (!user.password_hash) {
      console.error('❌ No password_hash for user:', user.email);
      return res.status(500).json({
        success: false,
        message: "User data incomplete"
      });
    }

    const isMatch = await UserModel.comparePassword(password, user.password_hash);
    console.log('  Password match:', isMatch ? '✅ Yes' : '❌ No');

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    await UserModel.updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      designation: user.designation
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    delete user.password_hash;

    console.log('✅ Login successful:', user.email);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        lastLogin: user.last_login
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({
      success: false,
      message: "Error during login",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};