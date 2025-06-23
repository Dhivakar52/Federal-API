const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// GET /employees - fetch all users
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

module.exports = router;
