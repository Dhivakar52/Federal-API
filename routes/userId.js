// routes/userUpdate.js
const express = require('express');
const router = express.Router();
const { UserModel } = require('../models/supabaseClient');
const bcrypt = require('bcryptjs');

router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Prepare update data
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      login_id: req.body.email, // Using email as loginId
      role: req.body.role,
      designation: req.body.designation || user.designation
    };

    // Handle password update
    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(req.body.password, salt);
    }
    // If no password change, don't update password_hash

    // Update user
    const updatedUser = await UserModel.update(userId, updateData);
    
    // Remove password hash from response
    delete updatedUser.password_hash;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal Server Error',
      message: err.message 
    });
  }
});

module.exports = router;