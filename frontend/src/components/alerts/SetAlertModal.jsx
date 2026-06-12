import React, { useState } from 'react';

export default function SetAlertModal({ 
  onClose, onSuccess, alertType, currentPrice, 
  origin, destination, hotelId, travelDate, checkinDate, checkoutDate 
}) {
  // Pre-fill target price at current price - 10%
  const defaultTarget = currentPrice != null ? Math.round(currentPrice * 0.9) : 0;
  
  const [targetPrice, setTargetPrice] = useState(defaultTarget);
  const [email, setEmail] = useState(''); // Would typically default to logged in user email
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alert_type: alertType,
          current_price: currentPrice,
          target_price: Number(targetPrice),
          notify_email: email,
          origin, destination, hotel_id: hotelId, 
          travel_date: travelDate, checkin_date: checkinDate, checkout_date: checkoutDate
        })
      });

      if (!response.ok) throw new Error('Failed to set alert');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-serif text-xl text-gray-900">Set Price Alert</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
            <div className="text-2xl font-bold text-gray-900">₹{currentPrice != null ? currentPrice.toLocaleString('en-IN') : '—'}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert me when price drops below</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input 
                type="number" 
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                required 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Recommended: 10% drop</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              required 
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Set Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
