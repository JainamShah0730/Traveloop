import React, { useState, useEffect } from 'react';
import { Bell, Trash2, ArrowRight } from 'lucide-react';

export default function PriceAlertsTab() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alert', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading alerts...</div>;

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <Bell size={24} />
        </div>
        <h3 className="text-lg font-serif text-gray-900 mb-2">No active price alerts</h3>
        <p className="text-gray-500 max-w-sm">Watch flights or hotels while searching, and we'll notify you when the price drops below your target.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <h2 className="text-xl font-serif text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="text-amber-500" /> My Price Alerts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {alert.status === 'triggered' && (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                Triggered
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                  {alert.alert_type}
                </span>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                  {alert.alert_type === 'flight' ? (
                    <>{alert.origin} <ArrowRight size={16} className="text-gray-400" /> {alert.destination}</>
                  ) : (
                    'Hotel Tracking'
                  )}
                </h4>
                {alert.travel_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(alert.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <button 
                onClick={() => deleteAlert(alert.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Delete alert"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Target</p>
                <p className="font-semibold text-amber-600">₹{alert.target_price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Current</p>
                <p className="font-semibold text-gray-900">₹{alert.current_price.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
