import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareTripCard from '../shared/ShareTripCard';
import PriceAlertButton from '../shared/PriceAlertButton';
import TravelersManager from '../shared/TravelersManager';

export default function CopilotSavePanel({ 
  itineraryId, destination, totalBudget, duration, travelers, departDate, returnDate
}) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [shareCommunity, setShareCommunity] = useState(false);
  const [tripName, setTripName] = useState(`${destination} Trip`);
  const [managedTravelersCount, setManagedTravelersCount] = useState(travelers || 1);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please log in to save trips");
        setSaving(false);
        return;
      }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      // 1. Save trip
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/copilot/save/${itineraryId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: tripName, startDate: departDate || new Date().toISOString().split('T')[0] })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // 2. Share to community if toggled
      if (shareCommunity) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/copilot/share/${itineraryId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ isShared: true })
        });
      }

      navigate(`/builder/${data.slug || data.id}`);
    } catch (err) {
      alert("Error saving trip: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 animate-fade-in flex flex-col items-center text-center">
      <h3 className="text-2xl font-serif text-gray-900 mb-2">Ready to book this trip?</h3>
      <p className="text-gray-500 mb-8 max-w-lg">Save this itinerary to your trips to finalize details, invite collaborators, and start booking.</p>

      <div className="flex items-center gap-4 mb-8">
        <PriceAlertButton 
          context="copilot"
          contextId={itineraryId}
          destination={destination}
          currentPrice={totalBudget}
          travelDate={departDate}
        />
        <ShareTripCard 
          context="copilot"
          destination={destination}
          destinationCountry={''} 
          departDate={departDate ? new Date(departDate).toLocaleDateString() : 'Flexible'}
          returnDate={returnDate ? new Date(returnDate).toLocaleDateString() : 'Flexible'}
          durationNights={duration}
          totalBudget={totalBudget}
          travelers={managedTravelersCount}
        />
      </div>

      <div className="w-full max-w-md space-y-6 mb-6">
        <TravelersManager 
          contextId={itineraryId} 
          contextType="itinerary" 
          onTravelersChange={setManagedTravelersCount} 
        />
        <div className="text-xs text-slate-500 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
          Group Cost: {managedTravelersCount} travelers × ₹{Math.round(totalBudget).toLocaleString()} = ₹{Math.round(totalBudget * managedTravelersCount).toLocaleString()}
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div>
          <input 
            type="text" 
            value={tripName} 
            onChange={e => setTripName(e.target.value)} 
            className="w-full p-4 border rounded-xl text-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center"
            placeholder="Name your trip"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="pt-1">
              <input 
                type="checkbox" 
                checked={shareCommunity} 
                onChange={e => setShareCommunity(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </div>
            <div>
              <div className="font-medium text-gray-900">Share this plan with the Travelloop community?</div>
              <div className="text-sm text-gray-500 mt-1">Other travelers can see your destination, budget, and trip overview. Your name will be shown. Your exact itinerary details stay private unless they click Use this plan.</div>
            </div>
          </label>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-black shadow-md transition-colors text-lg"
        >
          {saving ? 'Saving...' : 'Save to My Trips'}
        </button>
      </div>
    </div>
  );
}
