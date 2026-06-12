const express = require('express');
const router = express.Router();
const flightService = require('../services/flightService');

// GET /api/flights/price-grid
router.get('/price-grid', async (req, res) => {
  try {
    const { origin, destination, month, cabin } = req.query;

    if (!origin || !destination || !month) {
      return res.status(400).json({ error: 'Missing origin, destination, or month query parameters' });
    }

    const grid = await flightService.getPriceGrid(origin, destination, month);
    res.status(200).json(grid);
  } catch (error) {
    console.error('Error fetching price grid:', error);
    res.status(500).json({ error: 'Failed to fetch price grid' });
  }
});

module.exports = router;
