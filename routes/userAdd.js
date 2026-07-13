// routes/userAdd.js
const express = require('express');
const router = express.Router();
const { UserModel } = require('../models/supabaseClient');

router.post('/', async (req, res) => {
  try {
    const { name, email, password, role = 'user', designation = null } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Create new user
    const newUser = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      loginId: email.toLowerCase().trim(),
      password: password,
      role: role || 'user',
      designation: designation || null
    });

    // Remove password hash
    delete newUser.password_hash;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});

module.exports = router;