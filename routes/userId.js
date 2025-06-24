const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Employee = require("../models/Employee");

router.put('/:id', async (req, res) => {
  try {
    const user = await Employee.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updatedData = {
      name: req.body.name,
      email: req.body.email,
      loginId: req.body.email,
      role: req.body.role,
    };

    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updatedData.passwordHash = await bcrypt.hash(req.body.password, salt);
    } else {
      updatedData.passwordHash = user.passwordHash; // retain old password
    }

    const updatedUser = await Employee.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
