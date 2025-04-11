const express = require('express');
const User = require('../models/Employee');

const router = express.Router();




// Login Route
router.post('/login', async (req, res) => {
  const { loginId, password } = req.body;
  console.log(loginId, password);
  
  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${loginId}$`, 'i') } });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      user.lastLogin = new Date();  
      await user.save(); 

      return res.status(200).json({
        message: 'Login successful',
        lastLogin: user.lastLogin,
      });
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Error during login', error: err.message });
  }
});




// Register route (Signup)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(name, email, password);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    const newUser = new User({
      name,
      email,
      loginId: email,  
      password,
      passwordHash: password  
    });
    console.log(newUser);

    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    return res.status(500).json({ message: 'Error during registration', error: err.message });
  }
});



module.exports = router;
