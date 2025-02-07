const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const regionCode = req.query.region;

    if (!regionCode) {
      return res.status(400).send('Region code is required');
    }

    const response = await axios.get(`https://trends.google.com/trending/rss?geo=${regionCode}`);
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

module.exports = router;
