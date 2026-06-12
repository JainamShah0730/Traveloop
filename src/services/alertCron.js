const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

// In a real app this would call an email service (e.g. SendGrid, Resend)
const sendAlertEmail = async (alert, currentPrice) => {
  console.log(`[ALERT] Sending email to ${alert.notify_email}: Price dropped to ₹${currentPrice} for ${alert.destination || alert.hotel_id}!`);
};

// In a real app this would fetch real pricing via Amadeus / Skyscanner
const fetchCurrentPrice = async (alert) => {
  // Mock simulation: returns a price randomly lower or higher than target
  const diff = (Math.random() - 0.2) * 5000; // tends to drop
  return Math.max(1000, Math.round(alert.current_price + diff));
};

cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Running price alert checker...');
  try {
    const alerts = await db.priceAlert.findMany({
      where: { status: 'active' }
    });

    for (const alert of alerts) {
      const current = await fetchCurrentPrice(alert);
      if (current !== null && current <= alert.target_price) {
        await sendAlertEmail(alert, current);
        await db.priceAlert.update({
          where: { id: alert.id },
          data: { status: 'triggered', triggered_at: new Date() }
        });
      }
    }
  } catch (err) {
    console.error('[CRON] Error running alerts:', err);
  }
});

module.exports = {};
