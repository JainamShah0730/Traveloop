const express = require('express');
const router = express.Router();
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const alertService = require('../services/alertService');

// POST /api/alerts - Create a new price alert
router.post('/', requireAuth, async (req, res) => {
  try {
    const { alert_type, origin, destination, hotel_id, travel_date, checkin_date, checkout_date, target_price, notify_email } = req.body;
    
    // In a real app we'd fetch current price from an API. We'll mock it for now.
    // E.g. target_price is usually 10% less than current, so current is roughly target_price / 0.9.
    const current_price = Math.round(target_price / 0.9);

    const alert = await prisma.priceAlert.create({
      data: {
        user_id: req.user.id,
        alert_type,
        origin,
        destination,
        travel_date: travel_date ? new Date(travel_date) : null,
        hotel_id,
        checkin_date: checkin_date ? new Date(checkin_date) : null,
        checkout_date: checkout_date ? new Date(checkout_date) : null,
        current_price,
        target_price,
        notify_email,
        status: 'active'
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// GET /api/alerts - Get all alerts for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await prisma.priceAlert.findUnique({ where: { id } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    if (alert.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.priceAlert.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// PATCH /api/alerts/:id - Update target_price
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { target_price } = req.body;
    
    const alert = await prisma.priceAlert.findUnique({ where: { id } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    if (alert.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await prisma.priceAlert.update({
      where: { id },
      data: { target_price }
    });
    
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// POST /api/alerts/check - Trigger cron logic manually (for testing)
router.post('/check', requireAuth, requireAdmin, async (req, res) => {
  try {
    await alertService.checkPricesAndNotify();
    res.status(200).json({ success: true, message: 'Price check completed.' });
  } catch (error) {
    console.error('Error running check:', error);
    res.status(500).json({ error: 'Failed to run price check' });
  }
});

module.exports = router;
