const express = require('express');
const router = express.Router();

const Employee = require("../models/Employee");

router.post('/', async (req, res) => {
  try {
   const { name, email, password, role = 'user' } = req.body;


    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }



    const newUser = new Employee({
      name,
      email,
      loginId: email,
      passwordHash: password,
      role,
      createdAt: new Date()
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
