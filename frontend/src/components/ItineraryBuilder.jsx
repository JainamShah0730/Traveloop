import { useState } from "react";
import { Plus, Trash2, MapPin, Calendar } from "lucide-react";
import { getCityImageUrl } from "../utils/cityImages";

export default function ItineraryBuilder({
  trip,
  reloadTrip,
  activeStopId,
  setActiveStopId,
  selectedPackage,
  setSelectedPackage,
}) {
  // Use the trip prop from BuilderScreen as the single source of truth for stops.
  // Both the left panel (this component) and right panel (TimelineView) now read
  // from the same trip object, preventing the desync bug.
  const stops = trip?.stops || [];
  const isLoading = !trip; // If trip prop hasn't loaded yet, we're loading
  const [selectedPreferences, setSelectedPreferences] = useState([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const PREFERENCES = [
    "Culture & history", "Beach & relax", "Food & local", 
    "Adventure", "Nightlife", "Budget-friendly"
  ]

  const [isAdding, setIsAdding] = useState(false);

  const [newStop, setNewStop] = useState({
    city_name: "",
    country: "",
    from_date: "",
    to_date: "",
  });

  const [loading, setLoading] = useState(false);

  // SAFE DATE FORMATTER
  const formatDate = (date) => {
    if (!date) return "Invalid Date";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "Invalid Date";
    }

    return parsedDate.toLocaleDateString();
  };

  // ADD STOP
  const handleAddStop = async () => {
    try {
      // VALIDATION
      if (
        !newStop.city_name.trim() ||
        !newStop.country.trim() ||
        !newStop.from_date ||
        !newStop.to_date
      ) {
        alert("Please fill all fields");
        return;
      }

      // DATE VALIDATION
      if (
        new Date(newStop.from_date) >
        new Date(newStop.to_date)
      ) {
        alert("From date cannot be after To date");
        return;
      }

      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        return;
      }

      // DUMMY LAT LNG
      const payload = {
        ...newStop,
        lat: 35.6762,
        lng: 139.6503,
      };

      // SAFE API URL
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/stops/${trip?.id}/stops`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // SAFE ERROR HANDLING
      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to add stop"
        );
      }

      // RESET FORM
      setNewStop({
        city_name: "",
        country: "",
        from_date: "",
        to_date: "",
      });

      setIsAdding(false);

      // RELOAD
      if (reloadTrip) {
        await reloadTrip();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // DELETE STOP
  const handleDeleteStop = async (stopId) => {
    try {
      if (!stopId) return;

      const confirmDelete = window.confirm(
        "Are you sure you want to delete this stop?"
      );

      if (!confirmDelete) return;

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/stops/${stopId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to delete stop"
        );
      }

      // RESET ACTIVE STOP
      if (activeStopId === stopId && setActiveStopId) {
        setActiveStopId(null);
      }

      // RELOAD
      if (reloadTrip) {
        await reloadTrip();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const togglePreference = (pref) => {
    setSelectedPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleGenerateAIItinerary = async () => {
    if (selectedPreferences.length === 0) {
      alert("Please select at least one travel style!");
      return;
    }
    
    setIsGeneratingAI(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/trips/${trip.id}/generate-itinerary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferences: selectedPreferences })
        }
      );

      if (!res.ok) {
        throw new Error("Could not generate itinerary");
      }

      // Refresh the entire trip to load the newly generated stops
      if (reloadTrip) {
        await reloadTrip();
      }
      
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not generate itinerary, try again");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // REGENERATE ITINERARY (fixes old data)
  const handleRegenerateItinerary = async () => {
    try {
      const confirmRegen = window.confirm(
        "This will replace all current activities with a new, optimized AI itinerary. Are you sure?"
      );
      if (!confirmRegen) return;

      setIsRegenerating(true);
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/trips/${trip.id}/regenerate-activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price_per_day_inr: 5000,
            tier_name: "Standard"
          })
        }
      );

      if (!res.ok) {
        throw new Error("Failed to regenerate itinerary");
      }

      if (reloadTrip) {
        await reloadTrip();
      }
      alert("Itinerary regenerated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Regeneration failed");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Show skeleton while loading — NEVER show "No stops" during load
  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading your itinerary...</div>;

  if (stops.length === 0 && !isAdding) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner flex flex-col items-center text-center space-y-6">
          {isGeneratingAI ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-medium text-slate-700">AI is planning your trip...</h3>
              <p className="text-slate-500 mt-2">Crafting the perfect day-by-day itinerary based on your preferences.</p>
            </div>
          ) : (
            <>
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Build your perfect itinerary</h3>
                <p className="text-slate-500 text-sm mb-6">Select your travel styles and let our AI create a complete day-by-day journey for you.</p>
                
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {PREFERENCES.map(pref => (
                    <button
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        selectedPreferences.includes(pref)
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateAIItinerary}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <span>✨</span> Generate itinerary with AI
                </button>
              </div>

              <div className="flex items-center gap-4 w-full max-w-sm mt-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">OR</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <button
                onClick={() => setIsAdding(true)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors text-sm"
              >
                Add stop manually
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">

      {/* HEADER */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">
            Build Your Journey
          </h2>

          <p className="text-slate-500">
            Add stops and set duration for each location.
          </p>
        </div>
        
        {stops.length > 0 && (
          <button
            onClick={handleRegenerateItinerary}
            disabled={isRegenerating}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border ${
              isRegenerating 
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            {isRegenerating ? "Regenerating..." : "✨ Regenerate AI Itinerary"}
          </button>
        )}
      </div>

      <div className="space-y-4 relative mt-6">

        {/* CONNECTING LINE */}
        {stops.length > 0 && (
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200"></div>
        )}

        {/* STOPS */}
        {stops.map((stop, index) => {
          const isActive = stop?.id === activeStopId;
          // BUG 3 FIX: Each stop gets its own unique image based on city name
          const stopImageUrl = getCityImageUrl(stop?.city_name, stop?.country);

          return (
            <div
              key={stop?.id || index}
              onClick={() =>
                setActiveStopId &&
                setActiveStopId(stop.id)
              }
              className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${isActive
                  ? "bg-blue-50 border-blue-300 shadow-sm"
                  : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-slate-100"
                }`}
            >

              {/* NUMBER */}
              <div
                className={`z-10 flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm transition-colors ${isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500 border border-slate-200"
                  }`}
              >
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* BUG 3 FIX: City-specific thumbnail image — unique per stop */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={stopImageUrl}
                  alt={stop?.city_name || 'City'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-hidden">

                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700 truncate">
                  <MapPin
                    size={18}
                    className={
                      isActive
                        ? "text-blue-600"
                        : "text-slate-400"
                    }
                  />

                  <span className="truncate">
                    {stop?.city_name || "Unknown Location"}
                  </span>
                </h3>

                <p className="text-sm text-slate-500 mt-1 truncate">
                  {stop?.country || 'Area'} • {stop?.activities?.[0]?.duration_mins ? `${stop?.activities?.[0]?.duration_mins} mins` : 'Duration'} • {stop?.activities?.[0]?.notes || 'Category'}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                    ₹{stop?.activities?.[0]?.cost || stop?.budget || 0}
                  </span>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(stop?.from_date)}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Optional: individual regenerate logic here
                    handleRegenerateItinerary(); 
                  }}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Regenerate Stop"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStop(stop.id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Stop"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}

        {/* ADD FORM */}
        {isAdding && (
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4">

            <h4 className="font-semibold text-slate-700">
              New Stop Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* CITY */}
              <input
                type="text"
                placeholder="City"
                className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200"
                value={newStop.city_name}
                onChange={(e) =>
                  setNewStop({
                    ...newStop,
                    city_name: e.target.value,
                  })
                }
              />

              {/* COUNTRY */}
              <input
                type="text"
                placeholder="Country"
                className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200"
                value={newStop.country}
                onChange={(e) =>
                  setNewStop({
                    ...newStop,
                    country: e.target.value,
                  })
                }
              />

              {/* FROM */}
              <input
                type="date"
                className="p-3 rounded-xl border border-slate-200 text-slate-500 outline-none focus:ring-2 focus:ring-blue-200"
                value={newStop.from_date}
                onChange={(e) =>
                  setNewStop({
                    ...newStop,
                    from_date: e.target.value,
                  })
                }
              />

              {/* TO */}
              <input
                type="date"
                className="p-3 rounded-xl border border-slate-200 text-slate-500 outline-none focus:ring-2 focus:ring-blue-200"
                value={newStop.to_date}
                onChange={(e) =>
                  setNewStop({
                    ...newStop,
                    to_date: e.target.value,
                  })
                }
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 justify-end">

              <button
                onClick={() => {
                  setIsAdding(false);

                  setNewStop({
                    city_name: "",
                    country: "",
                    from_date: "",
                    to_date: "",
                  });
                }}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>

              <button
                onClick={handleAddStop}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
              >
                {loading ? "Saving..." : "Save Stop"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD BUTTON */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl font-medium hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span>Add Stop</span>
        </button>
      )}
    </div>
  );
}