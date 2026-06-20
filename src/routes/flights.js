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

// GET /api/flights/options
router.get('/options', async (req, res) => {
  try {
    const { origin, destination, date, travelers, basePrice } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ error: 'Missing origin, destination, or date query parameters' });
    }

    const options = await flightService.getFlightOptions(origin, destination, date, travelers, basePrice);
    
    if (!options.flights || options.flights.length === 0) {
      return res.status(200).json({ flights: [], message: "No flights on this date" });
    }

    res.status(200).json(options);
  } catch (error) {
    console.error('Error fetching flight options:', error);
    res.status(500).json({ error: 'Failed to fetch flight options' });
  }
});

module.exports = router;
