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

  // GENERATE AI STOP
  const handleGenerateAIStop = async () => {
    try {
      if (!newStop.city_name.trim() || !newStop.country.trim() || !newStop.from_date || !newStop.to_date) {
        alert("Please fill all fields");
        return;
      }
      if (new Date(newStop.from_date) > new Date(newStop.to_date)) {
        alert("From date cannot be after To date");
        return;
      }

      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again");
        return;
      }

      const payload = {
        ...newStop,
        lat: 35.6762,
        lng: 139.6503,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stops/${trip?.id}/stops/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) throw new Error(data.error || "Failed to generate AI stop");

      setNewStop({ city_name: "", country: "", from_date: "", to_date: "" });
      setIsAdding(false);
      if (reloadTrip) await reloadTrip();
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/trips/${trip.id}/generate-itinerary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferences: ["Top attractions", "Local culture", "Food"]
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
      <div className="bg-white rounded-3xl p-4 md:p-8 shadow-sm border border-slate-100">
        <div className="bg-slate-50 p-4 md:p-8 rounded-3xl border border-slate-200 shadow-inner flex flex-col items-center text-center space-y-6">
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
    <div className="mt-8">



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
            <div className="flex gap-2 justify-end flex-wrap mt-4">

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
                onClick={handleGenerateAIStop}
                disabled={loading}
                className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg disabled:opacity-50 transition font-medium whitespace-nowrap"
              >
                {loading ? "Working..." : "✨ Generate AI"}
              </button>

              <button
                onClick={handleAddStop}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition whitespace-nowrap"
              >
                {loading ? "Saving..." : "Save Manually"}
              </button>
            </div>
          </div>
        )}

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