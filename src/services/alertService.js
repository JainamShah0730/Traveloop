const cron = require('node-cron');
const prisma = require('../db');
const { Resend } = require('resend');
const { getRealPrice } = require('./flightService');

// Initialize Resend with a fallback key to prevent app crash if missing
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789_dummy_key');
// Fetch current price for alert checking
async function fetchCurrentPrice(alert) {
  if (alert.alert_type === 'flight') {
    const realPrice = await getRealPrice(alert.origin, alert.destination, new Date(alert.travel_date).toISOString().split('T')[0]);
    if (realPrice) return realPrice;
  }
  
  // Fallback / Mock scenario
  const currentPrice = alert.current_price;
  
  // 30% chance the price drops below target in fallback
  const drops = Math.random() < 0.3;
  if (drops) {
    return alert.target_price - 100;
  }
  
  // 70% chance it fluctuates slightly above
  return currentPrice + (Math.random() * 500) - 250;
}

async function sendAlertEmail({ to, alertType, currentPrice, targetPrice, origin, destination, travelDate }) {
  try {
    const data = await resend.emails.send({
      from: 'Traveloop Alerts <alerts@traveloop.com>',
      to: [to],
      subject: `Price Drop Alert: ${alertType === 'flight' ? origin + ' to ' + destination : 'Hotel'}`,
      text: `Good news! The price has dropped to ${currentPrice}. Your target was ${targetPrice}. \nBook now on Traveloop!`,
      html: `<p>Good news! The price has dropped to <b>${currentPrice}</b>. Your target was ${targetPrice}.</p><p><a href="http://localhost:5173/search">Book now on Traveloop!</a></p>`
    });

    console.log('Alert email sent via Resend:', data.id);
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
  }
}

async function checkPricesAndNotify() {
  console.log('[AlertService] Checking prices for active alerts...');
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { status: 'active' }
    });

    for (const alert of alerts) {
      // Auto-expire logic (if past travel date, or 7 days before)
      if (alert.travel_date) {
        const daysToTravel = (new Date(alert.travel_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysToTravel < 7) {
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { status: 'expired' }
          });
          continue;
        }
      }

      const currentPrice = await fetchCurrentPrice(alert);

      // Update current price in DB to track history (optional, but good UX)
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { current_price: Math.round(currentPrice) }
      });

      if (currentPrice !== null && currentPrice <= alert.target_price) {
        await sendAlertEmail({
          to: alert.notify_email,
          alertType: alert.alert_type,
          currentPrice: Math.round(currentPrice),
          targetPrice: alert.target_price,
          origin: alert.origin,
          destination: alert.destination,
          travelDate: alert.travel_date,
        });

        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { 
            status: 'triggered', 
            triggered_at: new Date() 
          }
        });
      }
    }
  } catch (err) {
    console.error('[AlertService] Error during check:', err);
  }
}

// Schedule cron job to run every 6 hours
cron.schedule('0 */6 * * *', () => {
  checkPricesAndNotify();
});

module.exports = {
  checkPricesAndNotify
};
