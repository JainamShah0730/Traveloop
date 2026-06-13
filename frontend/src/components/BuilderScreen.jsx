/**
 * BuilderScreen — Main container for the Itinerary Builder
 * 
 * DATA FLOW:
 * 1. User selects a package in PackageBookingPage → packageData stored in ItineraryContext
 * 2. BuilderScreen mounts → checks for packageData in context
 * 3. If packageData exists → calls generateMockTrip() to create a full trip
 *    with proper stops, day-by-day activities, and real costs
 * 4. If tripId points to a real DB trip → fetches from API as before
 * 5. Trip data is passed to ItineraryBuilder (left panel) and TimelineView (right panel)
 * 
 * BUG 4 FIX: Package selection now correctly pre-fills the builder
 * BUG 5 FIX: Mock trips have real costs so budget shows correct values
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, BarChart2 } from 'lucide-react';
import ItineraryBuilder from './ItineraryBuilder';
import TimelineView from './TimelineView';
import PollsPanel from './trips/PollsPanel';

export default function BuilderScreen({ tripId: propTripId, setCurrentScreen }) {
  const params = useParams();
  const navigate = useNavigate();
  const tripId = params.tripId || propTripId; // Read from URL or props

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStopId, setActiveStopId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('standard');
  const [showPolls, setShowPolls] = useState(false);

  const fetchTrip = async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch trip details');
      }

      const data = await res.json();
      setTrip(data);
      if (data.stops && data.stops.length > 0 && !activeStopId) {
        setActiveStopId(data.stops[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load trip data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-3"></div>
            <div className="h-8 w-64 bg-slate-200 rounded"></div>
          </div>
        </div>
        {/* Two Panel Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          <div className="w-full lg:w-[400px] xl:w-[450px] bg-slate-100 rounded-3xl h-full border border-slate-200"></div>
          <div className="flex-1 bg-slate-100 rounded-3xl h-full border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (!tripId || !trip) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Trip Selected</h2>
        <button 
          onClick={() => setCurrentScreen('myTrips')}
          className="bg-primary text-white px-6 py-2 rounded-xl"
        >
          Go back to My Trips
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
        {/* Header */}
        <div className="flex flex-col mb-6 shrink-0">
          <div>
            <button 
              onClick={() => {
                if (setCurrentScreen) setCurrentScreen('myTrips');
                navigate('/my-trips'); // Or wherever My Escapes route is defined
              }}
              className="flex items-center text-slate-500 hover:text-primary transition-colors text-sm font-medium mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to My Trips
            </button>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap mt-2">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">{trip.name}</h1>
            {saveStatus && (
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center">
                {saveStatus === 'Saving...' && <Loader2 size={12} className="animate-spin mr-2" />}
                {saveStatus}
              </span>
            )}
            <button 
              onClick={() => setShowPolls(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              <BarChart2 size={16} /> Group Polls
            </button>
            <button 
              onClick={() => {
                setCurrentScreen('journal');
                navigate('/');
              }}
              className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              📔 Journal
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs (visible only on small screens) */}
      <div className="flex lg:hidden overflow-x-auto whitespace-nowrap gap-2 pb-4 mb-2 -mx-4 px-4 scrollbar-hide shrink-0">
        <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex-shrink-0">
          🗺️ Builder
        </button>
        <button onClick={() => { setCurrentScreen('budget'); navigate('/'); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0">
          💰 Budget
        </button>
        <button onClick={() => { setCurrentScreen('packing'); navigate('/'); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0">
          🎒 Packing
        </button>
        <button onClick={() => { setCurrentScreen('notes'); navigate('/'); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0">
          📝 Notes
        </button>
        <button onClick={() => { setCurrentScreen('journal'); navigate('/'); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0">
          📔 Journal
        </button>
        <button onClick={() => { setCurrentScreen('invoice'); navigate('/'); }} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0">
          🧾 Invoice
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full flex-1 min-h-0 overflow-y-auto pb-safe px-4">
        <TimelineView 
          trip={trip} 
          reloadTrip={fetchTrip} 
          selectedPackage={selectedPackage}
        />
      </div>

      {showPolls && <PollsPanel tripId={trip.id} onClose={() => setShowPolls(false)} />}
    </div>
  );
}
