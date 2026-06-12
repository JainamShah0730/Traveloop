import React, { useState } from 'react';

export default function FlightHotelSelector({ 
  itineraryId, destination, origin, budget, departDate, returnDate, travelers, onComplete 
}) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ flights: [], hotels: [] });
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [error, setError] = useState(null);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/copilot/suggest-options`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          itineraryId, destination, origin, budget, departDate, returnDate, travelers, hotel_pref: 'budget'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOptions(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `HTTP Error ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto fetch when component mounts
  React.useEffect(() => {
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 text-center animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-6"></div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 animate-fade-in">
      <h3 className="text-2xl font-serif text-gray-900 mb-6 text-center">Select Flight & Hotel</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-center border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Flights */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">✈️ Flight Options</h4>
          <div className="space-y-4">
            {options.flights.map(f => (
              <div 
                key={f.id} 
                onClick={() => setSelectedFlight(f)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors relative ${selectedFlight?.id === f.id ? 'border-indigo-600 bg-indigo-50' : 'hover:border-indigo-300 bg-white'}`}
              >
                {f.badge && <span className="absolute -top-3 right-4 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">{f.badge}</span>}
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-900">{f.airline}</div>
                  <div className="font-bold text-gray-900">₹{f.price.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                  <span>{f.flightNo}</span>
                  <span>{f.depart} &rarr; {f.arrive} ({f.duration})</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">₹{f.pricePerPerson.toLocaleString('en-IN')} / person</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">🏨 Hotel Options</h4>
          <div className="space-y-4">
            {options.hotels.map(h => (
              <div 
                key={h.id} 
                onClick={() => setSelectedHotel(h)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors relative ${selectedHotel?.id === h.id ? 'border-indigo-600 bg-indigo-50' : 'hover:border-indigo-300 bg-white'}`}
              >
                {h.badge && <span className="absolute -top-3 right-4 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">{h.badge}</span>}
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-gray-900 w-2/3 truncate" title={h.name}>{h.name}</div>
                  <div className="font-bold text-gray-900">₹{h.totalCost.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-yellow-500 text-xs mb-2">{'★'.repeat(h.rating)}</div>
                <div className="flex gap-2 text-sm text-gray-600 mb-2">
                  {h.amenities.map(a => <span key={a} className="bg-white/50 px-2 rounded-md capitalize">{a}</span>)}
                </div>
                <div className="text-xs text-gray-500">₹{h.pricePerNight.toLocaleString('en-IN')} / night</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center border-t border-gray-100 pt-6">
        <button 
          disabled={!selectedFlight || !selectedHotel}
          onClick={() => onComplete(selectedFlight, selectedHotel)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
}
