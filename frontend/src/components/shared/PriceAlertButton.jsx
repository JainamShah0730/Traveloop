import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import SetAlertModal from '../alerts/SetAlertModal';

export default function PriceAlertButton({ context = 'package', contextId, destination, origin, currentPrice, travelDate, notifyEmail = '' }) {
  const [showModal, setShowModal] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guard currentPrice
  const safePrice = currentPrice != null ? currentPrice : 0;

  useEffect(() => {
    const checkAlertStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/alerts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const alerts = await res.json();
          // Check if there is an active alert for this context (using destination/origin/date or ID)
          // Since our alert schema has origin and destination, we can check by destination
          const hasAlert = alerts.some(a => a.status === 'active' && a.destination === destination);
          setIsActive(hasAlert);
        }
      } catch (error) {
        console.error('Failed to check alert status', error);
      } finally {
        setLoading(false);
      }
    };
    checkAlertStatus();
  }, [destination]);

  const handleSuccess = () => {
    setShowModal(false);
    setIsActive(true);
  };

  return (
    <>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        disabled={loading}
        className={`p-2 rounded-full transition-colors flex items-center justify-center ${isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} shadow-sm`}
        title={isActive ? "Price alert active" : "Set price alert"}
      >
        <Bell size={18} className={isActive ? "fill-amber-600" : ""} />
      </button>

      {showModal && (
        <SetAlertModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          alertType={context === 'package' ? 'flight' : 'flight'} // Usually flight alerts for packages
          currentPrice={safePrice}
          origin={origin}
          destination={destination}
          travelDate={travelDate}
        />
      )}
    </>
  );
}
