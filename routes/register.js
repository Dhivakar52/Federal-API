const express = require('express');
const User = require('../models/Employee');

const router = express.Router();

// Register route (Signup)
router.post('/', async (req, res) => {
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
