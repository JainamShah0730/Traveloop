import { useState, useEffect } from 'react';
import { Calendar, Map, IndianRupee, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';

export default function CreateTrip({ setCurrentScreen }) {
  const [formData, setFormData] = useState({
    name: localStorage.getItem('selectedDestination') || '',
    start_date: '',
    end_date: '',
    total_budget: '',
    cover_photo: ''
  });

  useEffect(() => {
    // Clear it after reading so manual creations start fresh
    localStorage.removeItem('selectedDestination');
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          total_budget: formData.total_budget ? parseFloat(formData.total_budget) : 0
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      const tripId = data.id;
      
      const numDays = Math.max(1, Math.ceil((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24)));

      // Extract a plausible country or default
      let countryName = "Unknown";
      const lowerName = formData.name.toLowerCase();
      if (lowerName.includes("japan") || lowerName.includes("tokyo") || lowerName.includes("kyoto")) countryName = "Japan";
      else if (lowerName.includes("usa") || lowerName.includes("new york") || lowerName.includes("america")) countryName = "USA";
      else if (lowerName.includes("italy") || lowerName.includes("rome")) countryName = "Italy";
      else if (lowerName.includes("france") || lowerName.includes("paris")) countryName = "France";
      else if (lowerName.includes("bali") || lowerName.includes("indonesia")) countryName = "Indonesia";
      else if (lowerName.includes("india") || lowerName.includes("rajasthan") || lowerName.includes("delhi") || lowerName.includes("tour")) countryName = "India";

      // Automatically create a stop for the trip
      const stopRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/stops/${tripId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          city_name: formData.name, // Using trip name as city name
          country: countryName,
          lat: 0,
          lng: 0,
          from_date: formData.start_date,
          to_date: formData.end_date
        })
      });

      if (stopRes.ok) {
        const stopData = await stopRes.json();
        const stopId = stopData.id;
        
        // Base suggestions
        const cityName = formData.name.toLowerCase();
        let baseSuggestions = [
          { name: 'City Walking Tour', type: 'sightseeing', cost: 20, duration_mins: 120, notes: 'Explore local highlights.' },
          { name: 'Dinner at Top Rated Restaurant', type: 'food', cost: 45, duration_mins: 90, notes: 'Try famous local dishes.' },
          { name: 'Visit Main Museum', type: 'sightseeing', cost: 15, duration_mins: 120, notes: 'Learn about local history.' },
          { name: 'Shopping at Central Market', type: 'shopping', cost: 30, duration_mins: 90, notes: 'Buy local souvenirs.' }
        ];

        if (cityName.includes('new york')) {
          baseSuggestions = [
            { name: 'Visit Empire State Building', type: 'sightseeing', cost: 45, duration_mins: 120, notes: 'Iconic skyscraper with stunning views.' },
            { name: 'Central Park Walking Tour', type: 'sightseeing', cost: 0, duration_mins: 90, notes: 'Explore the famous park.' },
            { name: 'Dinner at Katz\'s Delicatessen', type: 'food', cost: 30, duration_mins: 60, notes: 'Legendary pastrami sandwiches.' },
            { name: 'MoMA - Museum of Modern Art', type: 'sightseeing', cost: 25, duration_mins: 150, notes: 'World-class modern art.' }
          ];
        } else if (cityName.includes('tokyo') || cityName.includes('japan')) {
          baseSuggestions = [
            { name: 'Shibuya Crossing & Hachiko', type: 'sightseeing', cost: 0, duration_mins: 45, notes: 'World\'s busiest pedestrian crossing.' },
            { name: 'Sushi Dinner in Ginza', type: 'food', cost: 100, duration_mins: 90, notes: 'Premium sushi experience.' },
            { name: 'Senso-ji Temple Visit', type: 'sightseeing', cost: 0, duration_mins: 90, notes: 'Tokyo\'s oldest temple.' }
          ];
        } else if (cityName.includes('kyoto')) {
          baseSuggestions = [
            { name: 'Fushimi Inari Shrine', type: 'sightseeing', cost: 0, duration_mins: 120, notes: 'Famous thousands of torii gates.' },
            { name: 'Kinkaku-ji (Golden Pavilion)', type: 'sightseeing', cost: 5, duration_mins: 60, notes: 'Stunning Zen temple.' },
            { name: 'Traditional Kaiseki Dinner', type: 'food', cost: 80, duration_mins: 120, notes: 'Multi-course Japanese dinner.' }
          ];
        } else if (cityName.includes('bali')) {
          baseSuggestions = [
            { name: 'Uluwatu Temple Sunset', type: 'sightseeing', cost: 10, duration_mins: 90, notes: 'Clifftop temple with stunning views.' },
            { name: 'Scuba Diving at Coral Reef', type: 'sightseeing', cost: 80, duration_mins: 180, notes: 'Explore marine life.' },
            { name: 'Balinese Cooking Class', type: 'food', cost: 35, duration_mins: 120, notes: 'Learn to cook local dishes.' },
            { name: 'Relax at Seminyak Beach', type: 'other', cost: 0, duration_mins: 120, notes: 'Sun and sand.' }
          ];
        }

        // Scale suggestions to fill the entire trip (e.g. 2 activities per day)
        const targetActivityCount = numDays * 2;
        let finalSuggestions = [];
        for (let i = 0; i < targetActivityCount; i++) {
          const baseAct = baseSuggestions[i % baseSuggestions.length];
          // Slightly vary the name for duplicates to make it look realistic
          const suffix = Math.floor(i / baseSuggestions.length) > 0 ? ` (Part ${Math.floor(i / baseSuggestions.length) + 1})` : '';
          finalSuggestions.push({
            ...baseAct,
            name: baseAct.name + suffix
          });
        }

        // Save activities to DB
        for (const act of finalSuggestions) {
          await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/activities/${stopId}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(act)
          });
        }
      }

      // Success, redirect back to trips
      setCurrentScreen('myTrips');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button 
        onClick={() => setCurrentScreen('myTrips')}
        className="flex items-center text-slate-500 hover:text-primary transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to My Trips
      </button>

      <div>
        <h1 className="text-3xl font-serif font-bold text-slate-800">Plan a New Escape</h1>
        <p className="text-slate-500 mt-1">Set the foundation for your next adventure.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Trip Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Map size={18} />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="e.g., Summer in Japan"
              required
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Budget & Photo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Total Budget (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IndianRupee size={18} />
              </div>
              <input
                type="number"
                name="total_budget"
                value={formData.total_budget}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="50000"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cover Photo URL (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ImageIcon size={18} />
              </div>
              <input
                type="url"
                name="cover_photo"
                value={formData.cover_photo}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" /> Creating...
              </>
            ) : (
              'Create Trip'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
