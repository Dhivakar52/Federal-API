const express = require('express');
const { UserModel } = require('../models/supabaseClient');

const router = express.Router();

// Register route (Signup)
router.post('/', async (req, res) => {
  const { name, email, password, role, designation } = req.body;
  console.log('Registration attempt:', { name, email });

  try {
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and password are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email is already registered' 
      });
    }

    // Check if loginId (email as loginId) is taken
    const existingLoginId = await UserModel.findByLoginId(email);
    if (existingLoginId) {
      return res.status(409).json({ 
        success: false,
        message: 'Login ID already exists' 
      });
    }

    // Create new user
    const newUser = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      loginId: email.toLowerCase().trim(), // Using email as loginId
      password: password,
      role: role || 'user',
      designation: designation || null
    });

    // Remove password hash from response
    delete newUser.password_hash;

    console.log('User registered successfully:', newUser.email);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        loginId: newUser.login_id,
        role: newUser.role,
        designation: newUser.designation,
        createdAt: newUser.created_at
      }
    });

  } catch (err) {
    console.error('Error during registration:', err);
    
    // Handle specific Supabase errors
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ 
        success: false,
        message: 'Email or Login ID already exists' 
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Error during registration', 
      error: err.message 
    });
  }
});

module.exports = router;