// routes/userDelete.js
const express = require('express');
const router = express.Router();
const { UserModel } = require('../models/supabaseClient');

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Delete user
    await UserModel.delete(userId);

    res.status(200).json({ 
      success: true,
      message: 'User deleted successfully' 
    });

  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
});

module.exports = router;