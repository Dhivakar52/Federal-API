const express = require('express');
const router = express.Router();
const {logoutUser}= require('../controller/logoutController')

router.post('/', logoutUser)

module.exports = router;
