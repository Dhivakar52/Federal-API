const express = require('express');
const router = express.Router();
const Employee = require("../models/Employee");

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await Employee.findByIdAndDelete(userId);
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;