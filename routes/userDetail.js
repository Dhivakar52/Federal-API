// routes/userDetail.js
const express = require('express');
const router = express.Router();
const { UserModel } = require('../models/supabaseClient');

// GET /userDetails - fetch all users with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await UserModel.findAll(page, limit, search);
    
    // Remove password hashes
    result.data = result.data.map(user => {
      delete user.password_hash;
      return user;
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch users",
      message: err.message 
    });
  }
});

module.exports = router;