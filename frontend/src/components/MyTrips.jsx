import { useState, useEffect } from 'react';
import { Calendar, MapPin, Plus, Loader2, Compass, Trash2, IndianRupee, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyTrips({ setCurrentScreen, setSelectedTripId }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/trips', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch trips');
        }

        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load trips. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip? All its stops and activities will be removed.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete trip');
      }
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter and sort trips
  const upcomingTrips = trips.filter(trip => new Date(trip.end_date) >= today)
                             .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  
  const completedTrips = trips.filter(trip => new Date(trip.end_date) < today)
                              .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

  const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : completedTrips;

  const renderTripCard = (trip) => {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    
    // Determine Status
    let statusBadge = "Upcoming";
    let badgeColor = "bg-blue-100 text-blue-800";
    if (end < today) {
      statusBadge = "Completed";
      badgeColor = "bg-slate-100 text-slate-600";
    } else if (start <= today && end >= today) {
      statusBadge = "Ongoing";
      badgeColor = "bg-emerald-100 text-emerald-800";
    }

    const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const dateRange = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
      <div 
        key={trip.id} 
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-puffy transition-all flex flex-col group" 
      >
        <div className="h-48 bg-slate-200 relative overflow-hidden">
          <img 
            src={trip.cover_photo || `https://picsum.photos/seed/${encodeURIComponent(trip.name)}/400/300`} 
            alt={trip.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Status Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${badgeColor}`}>
            {statusBadge}
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTrip(trip.id);
            }}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-colors opacity-0 group-hover:opacity-100"
            title="Delete Trip"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-serif font-bold text-slate-800 mb-4 line-clamp-1">{trip.name}</h3>
          
          <div className="space-y-3 text-sm text-slate-600 mb-6 flex-1">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <span>{dateRange} ({durationDays} Days)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <span>{trip.stops_count || 0} Stops Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-slate-400" />
              <span>Total Budget: ₹{((trip.total_activities_cost > 0 ? trip.total_activities_cost : trip.total_budget) || 0).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (setSelectedTripId) setSelectedTripId(trip.id);
              if (setCurrentScreen) setCurrentScreen('builder');
              navigate(`/itinerary/${trip.id}`);
            }}
            className="w-full py-2.5 bg-slate-50 text-primary hover:bg-blue-50 hover:text-blue-700 font-semibold rounded-xl flex items-center justify-center transition-colors border border-slate-100"
          >
            View Itinerary <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-800">My Escapes</h1>
          <p className="text-slate-500 mt-1">Manage and view all your planned adventures.</p>
        </div>
        <button 
          onClick={() => {
            navigate('/discover');
            setCurrentScreen('discover');
          }}
          className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap w-fit"
        >
          <Plus size={18} className="mr-2" />
          Plan New Trip
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'upcoming' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Upcoming & Ongoing
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'completed' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Completed
          {activeTab === 'completed' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {displayedTrips.length === 0 && !error ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Compass className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-800 mb-2">
            No {activeTab} trips found
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">
            {activeTab === 'upcoming' 
              ? "Your passport is waiting! Start planning your first adventure by picking a package."
              : "You haven't completed any trips yet."}
          </p>
          {activeTab === 'upcoming' && (
            <button 
              onClick={() => {
                navigate('/discover');
                setCurrentScreen('discover');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Explore Packages
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTrips.map(renderTripCard)}
        </div>
      )}
    </div>
  );
}
