const express = require("express");
const router = express.Router();
const { resetPassword } = require("../controller/resetPasswordController");

router.post("/", resetPassword);

module.exports = router;
