// Express backend route (Node.js)
const express = require('express');
const router = express.Router();
const Employee = require("../models/Employee");

// Update user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
         loginId: req.body.email,       
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
