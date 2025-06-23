const express = require("express");
const { loginUser }= require('../controller/loginController')

const router = express.Router();

// Login Route
router.post("/", loginUser);

module.exports = router;
