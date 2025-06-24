const express = require('express');
const User = require('../models/Employee');

const router = express.Router();


// LogOut Route
router.post('/', async (req, res) => {
    const { loginId } = req.body;
  
    try {
      const user = await User.findOne({ email: { $regex: new RegExp(`^${loginId}$`, 'i') } });
  
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      user.lastLogout = new Date(); // Update last logout time
      await user.save();
  
      console.log("User Logged Out:", user.name);
  
      return res.status(200).json({
        message: 'Logout successful',
        name: user.name,
        lastLogout: user.lastLogout
      });
  
    } catch (err) {
      console.error("Logout Error:", err.message);
      return res.status(500).json({ message: 'Error during logout', error: err.message });
    }
  });

module.exports = router;
