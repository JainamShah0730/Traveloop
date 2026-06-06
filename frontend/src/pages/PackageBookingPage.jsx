import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Bed, Utensils, Car, Calendar } from 'lucide-react';
import { useItinerary } from '../context/ItineraryContext';
import { generateMockTrip } from '../utils/mockPackageData';
import { getCityImageUrl } from '../utils/cityImages';

// ─── Complete mock data with ALL fields the JSX expects ───────────────────────
const MOCK_BUDGET_TIERS = {
  backpacker: {
    id: 'tier-backpacker',
    tier_name: 'Backpacker',
    price_per_day_inr: 2500,
    accommodation: 'Hostels & guesthouses',
    food: 'Street food & local dhabas',
    transport: 'Public transport & shared cabs',
    includes: ['Free walking tours', 'Dorm-style stays', 'Local SIM card'],
  },
  standard: {
    id: 'tier-standard',
    tier_name: 'Standard',
    price_per_day_inr: 7000,
    accommodation: '3-star hotels',
    food: 'Restaurant meals',
    transport: 'Mixed transport + guided tours',
    includes: ['Guided day tours', 'Breakfast included', 'Airport transfer'],
  },
  premium: {
    id: 'tier-premium',
    tier_name: 'Premium',
    price_per_day_inr: 20000,
    accommodation: '5-star hotels & villas',
    food: 'Fine dining experiences',
    transport: 'Private transfers throughout',
    includes: ['Private guided tours', 'All meals included', 'Luxury airport transfer', 'Concierge service'],
  },
};

const makeTiers = () => [
  MOCK_BUDGET_TIERS.backpacker,
  MOCK_BUDGET_TIERS.standard,
  MOCK_BUDGET_TIERS.premium,
];

const MOCK_DESTINATIONS = {
  kashmir: {
    destination: { name: 'Kashmir', country: 'India', description: 'Dal Lake · Gulmarg · Pahalgam', type: 'Nature' },
    packages: [
      { id: 'k1', name: 'Kashmir Highlights', duration_days: 5, cities: ['Srinagar', 'Gulmarg'], highlights: ['Dal Lake Shikara', 'Meadows of Gulmarg', 'Pahalgam Valley'], budgetTiers: makeTiers() },
      { id: 'k2', name: 'Kashmir Explorer', duration_days: 7, cities: ['Srinagar', 'Gulmarg', 'Pahalgam'], highlights: ['Dal Lake Shikara', 'Meadows of Gulmarg', 'Pahalgam Valley', 'Betaab Valley'], budgetTiers: makeTiers() },
      { id: 'k3', name: 'Kashmir Complete', duration_days: 10, cities: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg'], highlights: ['Dal Lake Shikara', 'Meadows of Gulmarg', 'Pahalgam Valley', 'Betaab Valley', 'Thajiwas Glacier'], budgetTiers: makeTiers() },
    ],
  },
  goa: {
    destination: { name: 'Goa', country: 'India', description: 'Baga Beach · Old Goa · Dudhsagar', type: 'Beach' },
    packages: [
      { id: 'g1', name: 'Goa Quickie', duration_days: 5, cities: ['North Goa'], highlights: ['Baga Beach', 'Nightlife', 'Water Sports'], budgetTiers: makeTiers() },
      { id: 'g2', name: 'Goa Explorer', duration_days: 7, cities: ['North Goa', 'South Goa'], highlights: ['Baga Beach', 'Old Goa Churches', 'Dudhsagar Falls', 'Palolem Beach'], budgetTiers: makeTiers() },
    ],
  },
  rajasthan: {
    destination: { name: 'Rajasthan', country: 'India', description: 'Jaipur · Jodhpur · Udaipur', type: 'Royal' },
    packages: [
      { id: 'r1', name: 'Royal Triangle', duration_days: 7, cities: ['Jaipur', 'Jodhpur', 'Udaipur'], highlights: ['Amber Fort', 'Mehrangarh Fort', 'City Palace', 'Lake Pichola'], budgetTiers: makeTiers() },
      { id: 'r2', name: 'Rajasthan Odyssey', duration_days: 12, cities: ['Jaipur', 'Pushkar', 'Jodhpur', 'Jaisalmer', 'Udaipur'], highlights: ['Amber Fort', 'Desert Safari', 'Mehrangarh Fort', 'Jaisalmer Fort', 'Lake Pichola'], budgetTiers: makeTiers() },
    ],
  },
  himachal: {
    destination: { name: 'Himachal Pradesh', country: 'India', description: 'Manali · Shimla · Spiti', type: 'Adventure' },
    packages: [
      { id: 'h1', name: 'Hill Station Escape', duration_days: 5, cities: ['Shimla', 'Manali'], highlights: ['Mall Road', 'Rohtang Pass', 'Solang Valley'], budgetTiers: makeTiers() },
      { id: 'h2', name: 'Himachal Explorer', duration_days: 10, cities: ['Shimla', 'Manali', 'Kasol', 'Kufri'], highlights: ['Mall Road', 'Rohtang Pass', 'Solang Valley', 'Kasol Trek', 'Kufri Snow Point'], budgetTiers: makeTiers() },
    ],
  },
  kerala: {
    destination: { name: 'Kerala', country: 'India', description: 'Alleppey · Munnar · Kovalam', type: 'Nature' },
    packages: [
      { id: 'ke1', name: 'Kerala Backwaters', duration_days: 5, cities: ['Kochi', 'Alleppey'], highlights: ['Houseboat Stay', 'Backwaters', 'Fort Kochi'], budgetTiers: makeTiers() },
      { id: 'ke2', name: 'God\'s Own Country', duration_days: 10, cities: ['Kochi', 'Munnar', 'Alleppey', 'Kovalam'], highlights: ['Houseboat Stay', 'Tea Plantations', 'Backwaters', 'Beach Relaxation'], budgetTiers: makeTiers() },
    ],
  },
  japan: {
    destination: { name: 'Kyoto', country: 'Japan', description: 'Fushimi Inari · Arashiyama · Gion', type: 'Culture' },
    packages: [
      { id: 'j1', name: 'Kyoto Heritage', duration_days: 7, cities: ['Tokyo', 'Kyoto'], highlights: ['Fushimi Inari', 'Arashiyama Bamboo', 'Gion District', 'Shinjuku'], budgetTiers: makeTiers() },
      { id: 'j2', name: 'Japan Golden Route', duration_days: 10, cities: ['Tokyo', 'Hakone', 'Kyoto', 'Osaka'], highlights: ['Mt Fuji Views', 'Fushimi Inari', 'Dotonbori', 'Nara Deer Park'], budgetTiers: makeTiers() },
      { id: 'j3', name: 'Japan Deep Dive', duration_days: 15, cities: ['Tokyo', 'Takayama', 'Kanazawa', 'Kyoto', 'Hiroshima'], highlights: ['Old Town Takayama', 'Kenroku-en Garden', 'Arashiyama', 'Atomic Bomb Dome'], budgetTiers: makeTiers() },
    ],
  },
  italy: {
    destination: { name: 'Rome', country: 'Italy', description: 'Colosseum · Vatican · Trevi Fountain', type: 'Historic' },
    packages: [
      { id: 'it1', name: 'Rome City Break', duration_days: 5, cities: ['Rome'], highlights: ['Colosseum', 'Vatican Museums', 'Trevi Fountain', 'Spanish Steps'], budgetTiers: makeTiers() },
      { id: 'it2', name: 'Italy Highlights', duration_days: 10, cities: ['Rome', 'Florence', 'Venice'], highlights: ['Colosseum', 'Uffizi Gallery', 'Grand Canal', 'Vatican'], budgetTiers: makeTiers() },
    ],
  },
  bali: {
    destination: { name: 'Bali', country: 'Indonesia', description: 'Ubud · Seminyak · Uluwatu', type: 'Tropical' },
    packages: [
      { id: 'b1', name: 'Bali Escape', duration_days: 7, cities: ['Ubud', 'Seminyak'], highlights: ['Rice Terraces', 'Monkey Forest', 'Beach Clubs', 'Temple Visits'], budgetTiers: makeTiers() },
      { id: 'b2', name: 'Bali Explorer', duration_days: 10, cities: ['Ubud', 'Seminyak', 'Uluwatu', 'Nusa Penida'], highlights: ['Rice Terraces', 'Monkey Forest', 'Kelingking Beach', 'Uluwatu Temple', 'Beach Clubs'], budgetTiers: makeTiers() },
    ],
  },
  'new-york': {
    destination: { name: 'New York', country: 'USA', description: 'Manhattan · Brooklyn · Times Square', type: 'Urban' },
    packages: [
      { id: 'ny1', name: 'NYC Express', duration_days: 5, cities: ['Manhattan'], highlights: ['Times Square', 'Central Park', 'Brooklyn Bridge', 'MoMA'], budgetTiers: makeTiers() },
      { id: 'ny2', name: 'NYC Deep Dive', duration_days: 10, cities: ['Manhattan', 'Brooklyn', 'Queens'], highlights: ['Times Square', 'Central Park', 'Brooklyn Bridge', 'MoMA', 'Statue of Liberty', 'High Line'], budgetTiers: makeTiers() },
    ],
  },
  paris: {
    destination: { name: 'Paris', country: 'France', description: 'Eiffel Tower · Louvre · Montmartre', type: 'Luxury' },
    packages: [
      { id: 'p1', name: 'Paris Romance', duration_days: 5, cities: ['Paris'], highlights: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise'], budgetTiers: makeTiers() },
      { id: 'p2', name: 'Paris & Beyond', duration_days: 10, cities: ['Paris', 'Versailles', 'Loire Valley'], highlights: ['Eiffel Tower', 'Palace of Versailles', 'Louvre Museum', 'Loire Châteaux', 'Seine Cruise'], budgetTiers: makeTiers() },
    ],
  },
  thailand: {
    destination: { name: 'Bangkok', country: 'Thailand', description: 'Bangkok · Chiang Mai · Phuket', type: 'Beach' },
    packages: [
      { id: 'th1', name: 'Thailand Intro', duration_days: 7, cities: ['Bangkok', 'Phuket'], highlights: ['Grand Palace', 'Floating Markets', 'Phi Phi Islands', 'Street Food'], budgetTiers: makeTiers() },
      { id: 'th2', name: 'Thailand Explorer', duration_days: 12, cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui'], highlights: ['Grand Palace', 'Doi Inthanon', 'Phi Phi Islands', 'Ang Thong Marine Park'], budgetTiers: makeTiers() },
    ],
  },
  dubai: {
    destination: { name: 'Dubai', country: 'UAE', description: 'Burj Khalifa · Desert Safari · Marina', type: 'Luxury' },
    packages: [
      { id: 'd1', name: 'Dubai Highlights', duration_days: 5, cities: ['Dubai'], highlights: ['Burj Khalifa', 'Desert Safari', 'Dubai Mall', 'Palm Jumeirah'], budgetTiers: makeTiers() },
      { id: 'd2', name: 'Dubai & Abu Dhabi', duration_days: 7, cities: ['Dubai', 'Abu Dhabi'], highlights: ['Burj Khalifa', 'Desert Safari', 'Sheikh Zayed Mosque', 'Louvre Abu Dhabi'], budgetTiers: makeTiers() },
    ],
  },
  turkey: {
    destination: { name: 'Istanbul', country: 'Turkey', description: 'Hagia Sophia · Cappadocia · Bosphorus', type: 'Culture' },
    packages: [
      { id: 'tu1', name: 'Istanbul City Break', duration_days: 5, cities: ['Istanbul'], highlights: ['Hagia Sophia', 'Grand Bazaar', 'Bosphorus Cruise', 'Topkapi Palace'], budgetTiers: makeTiers() },
      { id: 'tu2', name: 'Turkey Explorer', duration_days: 10, cities: ['Istanbul', 'Cappadocia', 'Ephesus'], highlights: ['Hagia Sophia', 'Hot Air Balloon', 'Cave Hotels', 'Ancient Ephesus Ruins'], budgetTiers: makeTiers() },
    ],
  },
  greece: {
    destination: { name: 'Santorini', country: 'Greece', description: 'Santorini · Athens · Mykonos', type: 'Beach' },
    packages: [
      { id: 'gr1', name: 'Greek Islands', duration_days: 7, cities: ['Athens', 'Santorini'], highlights: ['Acropolis', 'Oia Sunset', 'Caldera Views', 'Black Sand Beach'], budgetTiers: makeTiers() },
      { id: 'gr2', name: 'Greece Complete', duration_days: 12, cities: ['Athens', 'Santorini', 'Mykonos', 'Crete'], highlights: ['Acropolis', 'Oia Sunset', 'Little Venice Mykonos', 'Samaria Gorge'], budgetTiers: makeTiers() },
    ],
  },
  london: {
    destination: { name: 'London', country: 'UK', description: 'Big Ben · Tower Bridge · Buckingham Palace', type: 'Culture' },
    packages: [
      { id: 'lo1', name: 'London Classic', duration_days: 5, cities: ['London'], highlights: ['Big Ben', 'Tower Bridge', 'British Museum', 'Buckingham Palace'], budgetTiers: makeTiers() },
      { id: 'lo2', name: 'Britain Explorer', duration_days: 10, cities: ['London', 'Oxford', 'Edinburgh', 'Bath'], highlights: ['Big Ben', 'Oxford University', 'Edinburgh Castle', 'Roman Baths'], budgetTiers: makeTiers() },
    ],
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export default function PackageBookingPage({ setCurrentScreen, setSelectedTripId }) {
  const { id: destId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // BUG 4 FIX: Access itinerary context to store package data for builder pre-fill
  const { dispatch, actions } = useItinerary();

  const packageId = searchParams.get('package_id');
  const startParam = searchParams.get('start');

  const [destination, setDestination] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [startDate, setStartDate] = useState(startParam || '');
  const [loading, setLoading] = useState(true);
  
  // FIX 1: Select Package button — loading state + prevent freeze
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState(null);
  
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        try {
          const res = await fetch(`${API_BASE}/api/destinations/${destId}/packages`);
          if (res.ok) {
            data = await res.json();
          }
        } catch (_) {
          // network error — fall through to mock
        }

        // Fall back to mock if API failed or returned nothing useful
        if (!data || !data.packages) {
          console.warn('API unavailable — using mock data');
          const mockKey = Object.keys(MOCK_DESTINATIONS).find(k => k === destId) || 'japan';
          data = JSON.parse(JSON.stringify(MOCK_DESTINATIONS[mockKey]));
          data.packages = data.packages.map(p => ({ ...p, is_mock: true }));
        }

        setDestination(data.destination);

        // Find the package by ID, or just pick the first one
        const pkg = packageId
          ? (data.packages.find(p => p.id === packageId) || data.packages[0])
          : data.packages[0];

        if (!pkg) throw new Error('No packages found for this destination');
        setSelectedPackage(pkg);

        // Pre-select Standard tier
        const tiers = pkg.budgetTiers || [];
        const standard = tiers.find(t => t.tier_name === 'Standard');
        setSelectedTier(standard || tiers[0] || null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [destId, packageId]);

  const handleCreateTrip = async () => {
    if (!selectedTier || !startDate) return;
    if (isCreating) return;
    
    setIsCreating(true);
    setCreationError(null);
    try {
      // Generate full mock trip data
      const mockTrip = generateMockTrip({
          destId,
          selectedPackage,
          selectedTier,
          startDate,
          destination,
      });

      const tripPayload = {
        // User's requested keys
        title: selectedPackage.name,
        destination: destination?.name || selectedPackage.destination,
        coverImageUrl: getCityImageUrl(selectedPackage.cities?.[0] || destination?.name, destination?.country) || selectedPackage.imageUrl,
        startDate: startDate,
        endDate: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + selectedPackage.duration_days)).toISOString(),
        status: "upcoming",
        stops: mockTrip.stops,
        totalBudgetINR: selectedTier.total_inr || selectedPackage.defaultBudget || 0,
        
        // Backend required keys (to avoid needing a server restart)
        name: selectedPackage.name,
        cover_photo: getCityImageUrl(selectedPackage.cities?.[0] || destination?.name, destination?.country) || selectedPackage.imageUrl,
        start_date: startDate,
        end_date: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + selectedPackage.duration_days)).toISOString(),
        total_budget: selectedPackage.price || selectedTier.total_inr || selectedPackage.defaultBudget || 0
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripPayload)
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create trip: ${errData.error || response.statusText}`);
      }

      const newTrip = await response.json();
      const tripId = newTrip.tripId ?? newTrip._id ?? newTrip.id;

      // Ensure stops are saved individually for backwards compatibility with older backend instances
      if (mockTrip.stops && mockTrip.stops.length > 0) {
        for (const stop of mockTrip.stops) {
          const stopRes = await fetch(`${API_BASE}/api/trips/${tripId}/stops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              city_name: stop.city_name,
              country: stop.country,
              lat: stop.lat || 0,
              lng: stop.lng || 0,
              from_date: stop.from_date,
              to_date: stop.to_date
            })
          });
          
          if (stopRes.ok) {
            const newStop = await stopRes.json();
            if (stop.activities && stop.activities.length > 0) {
              for (const act of stop.activities) {
                await fetch(`${API_BASE}/api/stops/${newStop.id}/activities`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                    name: act.name,
                    type: act.type || 'other',
                    cost: act.cost || 0,
                    duration_mins: act.duration_mins || 60,
                    notes: act.notes || ''
                  })
                });
              }
            }
          }
        }
      }

      // Update the parent App's selected trip so budget/invoice/notes/packing
      // all point to this newly created trip instead of the old one
      if (setSelectedTripId) setSelectedTripId(tripId);
      if (setCurrentScreen) setCurrentScreen('builder');

      navigate(`/itinerary/${tripId}`);
    } catch (err) {
      console.error(err);
      setCreationError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  // ── Hard error (no data at all) ──────────────────────────────────────────
  if (error || !selectedPackage || !destination) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Error loading data</h3>
        <p className="text-slate-500 mb-6">{error || 'Package not found'}</p>
        <Link to={`/destinations/${destId}`} className="text-primary hover:underline">
          ← Back to packages
        </Link>
      </div>
    );
  }

  const tiers = selectedPackage.budgetTiers || [];
  const totalCost = selectedTier
    ? (selectedTier.total_inr || (selectedTier.price_per_day_inr * selectedPackage.duration_days))
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Full-page loading overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm text-center">
            <div className="relative w-16 h-16 mb-4">
              <Loader2 size={64} className="text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">Trip</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Building your trip...</h3>
            <p className="text-slate-500 text-sm">We're mapping out your route and scheduling activities. This takes a few seconds.</p>
          </div>
        </div>
      )}

      {/* Booking error banner (non-blocking) */}
      {creationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm text-red-700">
          <span>⚠️ {creationError}</span>
          <button onClick={() => setCreationError(null)} className="ml-4 text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* SECTION 1 — Selected package summary bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/destinations/${destId}`}
            className="text-slate-500 hover:text-primary transition-colors flex items-center text-sm font-medium"
          >
            <ArrowLeft size={16} className="mr-1" /> Change Package
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{destination.name}</span>
            <span className="mx-2">→</span>
            <span>{selectedPackage.name}</span>
            <span className="mx-2">→</span>
            <span className="font-medium text-primary">{selectedPackage.duration_days} Days</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Start Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* SECTION 2 — 3 tier cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-slate-800">Choose your budget</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const isSelected = selectedTier?.id === tier.id;
            const isStandard = tier.tier_name === 'Standard';
            const isPremium = tier.tier_name === 'Premium';

            let borderClass = isSelected ? 'border-slate-800 ring-4 ring-slate-100' : 'border-slate-100';
            let badge = null;

            if (isStandard) {
              borderClass = isSelected ? 'border-primary ring-4 ring-primary/5' : 'border-blue-200';
              badge = <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">Most Popular</span>;
            } else if (isPremium) {
              borderClass = isSelected ? 'border-amber-500 ring-4 ring-amber-50' : 'border-amber-200';
              badge = <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">Best Experience</span>;
            }

            const tierTotal = tier.total_inr || ((tier.price_per_day_inr || 0) * selectedPackage.duration_days);
            const includes = Array.isArray(tier.includes) ? tier.includes : [];

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl border-2 ${borderClass} p-6 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all ${isSelected ? 'bg-slate-50/50' : ''}`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">{tier.tier_name}</h3>
                    {badge}
                  </div>

                  <div>
                    <p className="text-3xl font-bold text-slate-800">₹{(tier.price_per_day_inr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">per person / day</p>
                  </div>

                  <p className="text-sm font-semibold text-primary">
                    Total for {selectedPackage.duration_days} days: ₹{tierTotal.toLocaleString()}
                  </p>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-sm text-slate-600">
                    {tier.accommodation && (
                      <div className="flex items-center gap-2">
                        <Bed size={16} className="text-slate-400 flex-shrink-0" />
                        <span>{tier.accommodation}</span>
                      </div>
                    )}
                    {tier.food && (
                      <div className="flex items-center gap-2">
                        <Utensils size={16} className="text-slate-400 flex-shrink-0" />
                        <span>{tier.food}</span>
                      </div>
                    )}
                    {tier.transport && (
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-slate-400 flex-shrink-0" />
                        <span>{tier.transport}</span>
                      </div>
                    )}
                  </div>

                  {includes.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Includes</p>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {includes.map((inc, idx) => (
                          <li key={idx} className="flex items-center">
                            <Check size={14} className="text-emerald-500 mr-2 flex-shrink-0" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full mt-6 py-2.5 rounded-xl font-medium text-sm transition-colors ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Choose {tier.tier_name}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 — Confirm and create */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-800">Your Trip Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400 mb-1">Destination</p>
            <p className="font-semibold text-slate-700">{destination.name}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Package</p>
            <p className="font-semibold text-slate-700">{selectedPackage.name}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Duration</p>
            <p className="font-semibold text-slate-700">{selectedPackage.duration_days} Days</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Budget Tier</p>
            <p className="font-semibold text-slate-700">{selectedTier?.tier_name || '—'}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-6 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Cost</p>
            <p className="text-3xl font-bold text-slate-800">₹{totalCost.toLocaleString()}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-500 mb-1">Confirm Start Date</label>
              <div className="flex items-center px-3 py-2 border border-slate-200 rounded-lg">
                <Calendar size={16} className="text-slate-400 mr-2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="outline-none text-sm text-slate-700 w-full"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!selectedTier) {
                  alert("Please select a budget tier first.");
                  return;
                }
                if (!startDate) {
                  alert("Please select a start date for your trip.");
                  return;
                }
                handleCreateTrip();
              }}
              disabled={isCreating}
              className={`w-full md:w-auto px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isCreating ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-blue-700 shadow-primary/20'}`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Creating your trip...
                </>
              ) : (
                <>Select Package →</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
