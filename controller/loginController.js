// controller/loginController.js
const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/supabaseClient");

exports.loginUser = async (req, res) => {
  const { loginId, password } = req.body;

  try {
    console.log('📥 Login attempt:', { loginId });

    // Validation
    if (!loginId || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Login ID and password are required" 
      });
    }

    // Find user by loginId
    let user = await UserModel.findByLoginId(loginId.trim());
    console.log('  Search by login_id:', user ? '✅ Found' : '❌ Not found');
    
    // If not found, try email
    if (!user) {
      user = await UserModel.findByEmail(loginId.trim());
      console.log('  Search by email:', user ? '✅ Found' : '❌ Not found');
    }

    if (!user) {
      console.log('❌ User not found:', loginId);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      login_id: user.login_id,
      hasPassword: !!user.password_hash
    });

    // Check if password_hash exists
    if (!user.password_hash) {
      console.error('❌ No password_hash for user:', user.email);
      return res.status(500).json({
        success: false,
        message: "User data incomplete"
      });
    }

    // Compare password
    console.log('🔐 Comparing password...');
    const isMatch = await UserModel.comparePassword(password, user.password_hash);
    console.log('  Password match:', isMatch ? '✅ Yes' : '❌ No');

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Create JWT
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      loginId: user.login_id,
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
        loginId: user.login_id,
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