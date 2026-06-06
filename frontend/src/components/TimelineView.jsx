/**
 * TimelineView — Right panel showing day-by-day activities, map, and budget
 * 
 * BUG FIXES APPLIED:
 * BUG 1: Timeline now renders per day using robust "Day X" parsing from activity notes
 * BUG 2: Activities are isolated per day — once assigned, never duplicated to other days
 * BUG 3: City-specific image banner at the top, fetched using getCityImageUrl()
 * BUG 5: Budget is derived reactively from activities (useMemo on activities array)
 * 
 * DATA FLOW:
 * 1. activeStopId selects a stop from trip.stops
 * 2. activeStop.activities are deduplicated by ID
 * 3. Activities are grouped into days using parseDayFromNotes() 
 * 4. Each day accordion shows ONLY its own activities in chronological order
 * 5. Budget breakdown sums activity costs per category
 */
import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  MapPin,
  Coffee,
  Camera,
  Plane,
  Utensils,
  Info,
  Plus,
  Trash2,
  Bed,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getCityImageUrl } from "../utils/cityImages";

function MapController({ activeStop }) {
  const map = useMap();

  useEffect(() => {
    if (
      activeStop &&
      typeof activeStop.lat === "number" &&
      typeof activeStop.lng === "number"
    ) {
      map.flyTo([activeStop.lat, activeStop.lng], 13, {
        duration: 1,
      });
    }
  }, [activeStop, map]);

  return null;
}

const categoryIcons = {
  transport: Plane,
  hotel: Bed,
  food: Utensils,
  sightseeing: Camera,
  shopping: ShoppingBag,
  other: Info,
};

const categoryColors = {
  transport: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500" },
  hotel: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700", bar: "bg-indigo-500" },
  food: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", bar: "bg-orange-500" },
  sightseeing: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  shopping: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", bar: "bg-purple-500" },
  other: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
};

const categoryLabels = {
  transport: "Transport",
  hotel: "Accommodation",
  food: "Food & Dining",
  sightseeing: "Sightseeing",
  shopping: "Shopping",
  other: "Other",
};

/**
 * BUG 1 FIX: Parse time from notes string like "Start: 08:00" or "Check-in: 21:00"
 * This gives each activity its chronological position within a day.
 */
function parseTimeFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/(?:Start|Check-in):\s*(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

/**
 * BUG 1+2 FIX: Parse day number from notes string like "Day 1 breakfast"
 * This is the PRIMARY grouping mechanism — activities with "Day 1" go to Day 1 only.
 * Activities are NEVER shared across days.
 */
function parseDayFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/Day\s+(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export default function TimelineView({
  trip,
  reloadTrip,
  activeStopId,
}) {
  const [activeTab, setActiveTab] = useState("timeline");
  const [expandedDays, setExpandedDays] = useState({});

  const activeStop =
    trip?.stops?.find((s) => s.id === activeStopId) ||
    trip?.stops?.[0] ||
    {};

  // BUG 3 FIX: Get a unique image URL for the active stop's city
  const cityImageUrl = useMemo(() => {
    return getCityImageUrl(activeStop?.city_name, activeStop?.country);
  }, [activeStop?.city_name, activeStop?.country]);

  const numDays = useMemo(() => {
    if (!activeStop?.to_date || !activeStop?.from_date) return 1;
    const diff = Math.ceil(
      (new Date(activeStop.to_date) - new Date(activeStop.from_date)) /
      (1000 * 60 * 60 * 24)
    );
    return Math.max(1, diff);
  }, [activeStop]);

  const rawActivities = activeStop?.activities || [];

  // Deduplicate by id — each activity appears exactly once
  const activities = useMemo(() => {
    const seen = new Set();
    return rawActivities.filter((act) => {
      if (seen.has(act.id)) return false;
      seen.add(act.id);
      return true;
    });
  }, [rawActivities]);

  // ───────────────────────────────────────────────────────────────────────────
  // BUG 1+2 FIX: GROUP ACTIVITIES BY DAY
  // 
  // STRATEGY:
  // 1. PRIMARY: Parse "Day X" from activity notes (e.g. "Day 1 breakfast")
  //    → Activity goes to Day X ONLY, then is removed from the pool
  // 2. FALLBACK: For activities without day info, distribute evenly across days
  //    → Each activity is assigned to exactly ONE day (tracked via Set)
  // 
  // CRITICAL: Once an activity is assigned to a day, it is NEVER reused.
  // This prevents the duplication bug where Day 1's activities appeared in Day 2.
  // ───────────────────────────────────────────────────────────────────────────
  const groupedDays = useMemo(() => {
    // Initialize day buckets
    const dayBuckets = {};
    for (let d = 1; d <= numDays; d++) {
      dayBuckets[d] = [];
    }

    // Track which activities have been assigned — prevents duplication (BUG 2 FIX)
    const assignedIds = new Set();
    const unassigned = [];

    // PASS 1: Assign activities that have "Day X" in their notes
    activities.forEach((act) => {
      const dayNum = parseDayFromNotes(act.notes);
      if (dayNum && dayNum >= 1 && dayNum <= numDays) {
        dayBuckets[dayNum].push(act);
        assignedIds.add(act.id);  // Mark as assigned — will not appear in any other day
      }
    });

    // Collect unassigned activities (no "Day X" in notes)
    activities.forEach((act) => {
      if (!assignedIds.has(act.id)) {
        unassigned.push(act);
      }
    });

    // PASS 2: Distribute unassigned activities evenly across days
    // Each unassigned activity goes to exactly ONE day
    if (unassigned.length > 0) {
      let dayIdx = 0;
      unassigned.forEach((act) => {
        const targetDay = (dayIdx % numDays) + 1;
        dayBuckets[targetDay].push(act);
        assignedIds.add(act.id);
        dayIdx++;
      });
    }

    // PASS 3: Sort each day's activities by time (chronological order)
    const result = [];
    for (let d = 1; d <= numDays; d++) {
      const dayActs = dayBuckets[d];
      dayActs.sort((a, b) => {
        const timeA = parseTimeFromNotes(a.notes) || "99:99";
        const timeB = parseTimeFromNotes(b.notes) || "99:99";
        return timeA.localeCompare(timeB);
      });
      result.push({ dayNumber: d, acts: dayActs });
    }

    return result;
  }, [activities, numDays]);

  // ───────────────────────────────────────────────────────────────────────────
  // BUG 5 FIX: Budget breakdown derived from activities (reactive via useMemo)
  // When activities change (add/delete/regenerate), budget auto-updates.
  // ───────────────────────────────────────────────────────────────────────────
  const budgetBreakdown = useMemo(() => {
    const validTypes = ['hotel', 'transport', 'food', 'sightseeing', 'shopping', 'other'];
    const breakdown = { hotel: 0, transport: 0, food: 0, sightseeing: 0, shopping: 0, other: 0 };

    activities.forEach((act) => {
      const cost = Number(act.cost) || 0;
      const typeKey = validTypes.includes(act.type) ? act.type : 'other';
      breakdown[typeKey] += cost;
    });

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { ...breakdown, total };
  }, [activities]);

  // Full trip budget — sum across ALL stops (BUG 5: reactive to activity changes)
  const tripBudget = useMemo(() => {
    const validTypes = ['hotel', 'transport', 'food', 'sightseeing', 'shopping', 'other'];
    const breakdown = { hotel: 0, transport: 0, food: 0, sightseeing: 0, shopping: 0, other: 0 };

    (trip?.stops || []).forEach((stop) => {
      (stop.activities || []).forEach((act) => {
        const cost = Number(act.cost) || 0;
        const typeKey = validTypes.includes(act.type) ? act.type : 'other';
        breakdown[typeKey] += cost;
      });
    });

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { ...breakdown, total };
  }, [trip]);

  const toggleDay = (dayNumber) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  // Expand first day by default when stop changes
  useEffect(() => {
    if (groupedDays.length > 0) {
      setExpandedDays({ 1: true });
    }
  }, [activeStop?.id]);

  const handleDeleteActivity = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/activities/${activityId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete activity");
      reloadTrip?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const togglePaid = async (activityId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/activities/${activityId}/toggle-paid`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        reloadTrip?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!trip || !trip.stops || trip.stops.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6">
        <p>No stops added yet.</p>
      </div>
    );
  }

  const totalBudget = trip.total_budget || 0;
  const spentPercent = totalBudget > 0 ? Math.min(100, Math.round((tripBudget.total / totalBudget) * 100)) : 0;

  const formatDate = (dateStr, dayOffset = 0) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + dayOffset);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Generate default time slots for old activities that have no time in notes
  const defaultTimeSlots = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "19:30", "21:00"];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 h-full flex flex-col">
      {/* BUG 3 FIX: City-specific image banner — unique per stop */}
      <div className="mb-4 rounded-2xl overflow-hidden shadow-md border border-slate-100 h-40 flex-shrink-0 relative">
        <img
          src={cityImageUrl}
          alt={activeStop.city_name || 'City'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <h2 className="text-2xl font-bold drop-shadow-lg">
            {activeStop.city_name || 'City'} Itinerary
          </h2>
          <p className="text-white/80 text-sm">
            {activeStop.from_date
              ? new Date(activeStop.from_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })
              : "N/A"}{" "}
            —{" "}
            {activeStop.to_date
              ? new Date(activeStop.to_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })
              : "N/A"}
            {" · "}{numDays} day{numDays > 1 ? 's' : ''}
          </p>
        </div>
        {/* BUG 5 FIX: Budget badge derived from activities (reactive) */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-400 block">This Stop</span>
          <span className="text-lg font-bold text-slate-800">
            ₹{budgetBreakdown.total.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="mb-6 rounded-2xl overflow-hidden shadow-md border border-slate-100 h-56 flex-shrink-0">
        <MapContainer
          center={[activeStop?.lat || 20, activeStop?.lng || 77]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {trip?.stops?.map((stop, idx) => (
            <Marker
              key={stop.id}
              position={[stop.lat || 0, stop.lng || 0]}
              icon={L.divIcon({
                className: "",
                html: `<div style="width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:${stop.id === activeStopId ? '#3B82F6' : '#94A3B8'};color:white;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${idx + 1}</div>`,
              })}
            />
          ))}
          <Polyline
            positions={(trip?.stops || []).map((s) => [s.lat || 0, s.lng || 0])}
            color="#3B82F6"
            weight={3}
          />
          <MapController activeStop={activeStop} />
        </MapContainer>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "timeline", label: "📅 Timeline", count: activities.length },
          { key: "budget", label: "💰 Budget", count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2.5 px-5 rounded-xl font-medium text-sm transition-all ${activeTab === tab.key
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-white/80' : 'text-slate-400'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TIMELINE TAB — BUG 1+2 FIX: Per-day rendering */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div className="space-y-4 overflow-y-auto flex-1 pr-1" style={{ maxHeight: '60vh' }}>
          {groupedDays.map((dayGroup) => {
            const isExpanded = expandedDays[dayGroup.dayNumber] !== false;
            const dayDate = formatDate(activeStop.from_date, dayGroup.dayNumber - 1);
            const dayTotal = dayGroup.acts.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

            return (
              <div key={dayGroup.dayNumber} className="border border-slate-100 rounded-2xl overflow-hidden">
                {/* Day Header — shows day number, date, activity count, and day total */}
                <button
                  onClick={() => toggleDay(dayGroup.dayNumber)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {dayGroup.dayNumber}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800">Day {dayGroup.dayNumber}</h3>
                      <p className="text-xs text-slate-500">{dayDate} · {dayGroup.acts.length} activities</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">
                      ₹{dayTotal.toLocaleString("en-IN")}
                    </span>
                    {isExpanded
                      ? <ChevronDown size={18} className="text-slate-400" />
                      : <ChevronRight size={18} className="text-slate-400" />
                    }
                  </div>
                </button>

                {/* Day Activities — BUG 2 FIX: Only THIS day's activities appear here */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {dayGroup.acts.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No activities scheduled</p>
                    ) : (
                      dayGroup.acts.map((activity, actIdx) => {
                        const Icon = categoryIcons[activity.type] || Info;
                        const colors = categoryColors[activity.type] || categoryColors.other;
                        // BUG 1 FIX: Use parsed time from notes for chronological ordering
                        const timeStr = parseTimeFromNotes(activity.notes) || defaultTimeSlots[actIdx % defaultTimeSlots.length];

                        return (
                          <div
                            key={activity.id}
                            className={`flex gap-3 p-3 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:shadow-sm group`}
                          >
                            {/* Time Column */}
                            <div className="flex flex-col items-center gap-1 min-w-[52px]">
                              <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg shadow-sm">
                                {timeStr}
                              </span>
                              <div className="w-px flex-1 bg-slate-200 min-h-[20px]"></div>
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${colors.badge}`}>
                                      <Icon size={12} />
                                      <span className="capitalize">{activity.type}</span>
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {activity.duration_mins} min
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-slate-800 text-sm truncate">
                                    {activity.name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => togglePaid(activity.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                      activity.is_paid 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    {activity.is_paid ? '✅ Paid' : 'Mark as Paid'}
                                  </button>
                                  <span className="text-sm font-bold text-slate-700">
                                    ₹{Number(activity.cost || 0).toLocaleString("en-IN")}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-1 rounded-lg hover:bg-rose-50"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* BUDGET TAB — BUG 5 FIX: Reactive budget from activities */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "budget" && (
        <div className="space-y-6 overflow-y-auto flex-1 pr-1" style={{ maxHeight: '60vh' }}>
          {/* Total Budget Overview Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Trip Budget</p>
                <p className="text-3xl font-bold">
                  ₹{totalBudget.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Allocated</p>
                <p className="text-2xl font-bold text-emerald-400">
                  ₹{tripBudget.total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${spentPercent > 100 ? 'bg-red-500' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{spentPercent}% allocated</span>
              <span>₹{(totalBudget - tripBudget.total).toLocaleString("en-IN")} remaining</span>
            </div>
          </div>

          {/* This Stop's Budget — BUG 5 FIX: Derived from actual activity costs */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {activeStop.city_name} — Budget Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(budgetBreakdown).filter(([key]) => key !== 'total').map(([type, amount]) => {
                const colors = categoryColors[type] || categoryColors.other;
                const Icon = categoryIcons[type] || Info;
                const label = categoryLabels[type] || type;
                const percent = budgetBreakdown.total > 0 ? Math.round((amount / budgetBreakdown.total) * 100) : 0;

                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.badge}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        <span className="text-sm font-bold text-slate-800">₹{amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 w-10 text-right">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Day Cost Summary */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Daily Cost Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {groupedDays.map((dayGroup) => {
                const dayTotal = dayGroup.acts.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
                const dayDate = formatDate(activeStop.from_date, dayGroup.dayNumber - 1);

                return (
                  <div key={dayGroup.dayNumber} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {dayGroup.dayNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Day {dayGroup.dayNumber}</p>
                        <p className="text-xs text-slate-400">{dayDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{dayTotal.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-slate-400">{dayGroup.acts.length} activities</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Trip Summary — BUG 5 FIX: Shows per-stop totals from actual activities */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Full Trip Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {trip?.stops?.map((stop) => {
                const stopTotal = (stop.activities || []).reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
                const isActive = stop.id === activeStopId;

                return (
                  <div key={stop.id} className={`p-3 rounded-xl border ${isActive ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className={isActive ? "text-primary" : "text-slate-400"} />
                      <span className="text-sm font-semibold text-slate-700 truncate">{stop.city_name}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">₹{stopTotal.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-slate-400">{(stop.activities || []).length} activities</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}