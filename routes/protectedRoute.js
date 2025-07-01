const { verifyToken } = require('../middleware/auth');
const express = require('express');
const router = express.Router();


router.get('/admin-dashboard', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ message: `Welcome ${req.user.name}` });
});


module.exports = router;