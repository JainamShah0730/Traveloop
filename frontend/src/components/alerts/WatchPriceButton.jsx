import React, { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import SetAlertModal from './SetAlertModal';

export default function WatchPriceButton({ alertType, currentPrice, origin, destination, hotelId, travelDate, checkinDate, checkoutDate, isActiveAlert }) {
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState(isActiveAlert);

  const handleAlertCreated = () => {
    setActive(true);
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => !active && setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
        title={active ? "You are watching this price" : "Watch this price"}
      >
        {active ? <BellRing size={16} className="text-amber-600" /> : <Bell size={16} />}
        <span>{active ? 'Watching' : 'Watch Price'}</span>
      </button>

      {showModal && (
        <SetAlertModal
          onClose={() => setShowModal(false)}
          onSuccess={handleAlertCreated}
          alertType={alertType}
          currentPrice={currentPrice}
          origin={origin}
          destination={destination}
          hotelId={hotelId}
          travelDate={travelDate}
          checkinDate={checkinDate}
          checkoutDate={checkoutDate}
        />
      )}
    </>
  );
}
