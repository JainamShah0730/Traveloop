import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from 'lucide-react';
import { getDestinationImage } from '../utils/cityImages';

const baseDestinations = [
  { id: 'kashmir', name: 'Kashmir', country: 'India', region: 'india', vibes: ['nature', 'adventure'] },
  { id: 'goa', name: 'Goa', country: 'India', region: 'india', vibes: ['beach', 'adventure'] },
  { id: 'rajasthan', name: 'Rajasthan', country: 'India', region: 'india', vibes: ['royal', 'culture', 'historic'] },
  { id: 'himachal', name: 'Himachal Pradesh', country: 'India', region: 'india', vibes: ['nature', 'adventure'] },
  { id: 'kerala', name: 'Kerala', country: 'India', region: 'india', vibes: ['nature', 'beach'] },
  { id: 'japan', name: 'Kyoto', country: 'Japan', region: 'asia', vibes: ['zen', 'culture', 'historic'] },
  { id: 'italy', name: 'Rome', country: 'Italy', region: 'europe', vibes: ['historic', 'culture'] },
  { id: 'bali', name: 'Bali', country: 'Indonesia', region: 'asia', vibes: ['tropical', 'beach', 'nature'] },
  { id: 'new-york', name: 'New York', country: 'USA', region: 'americas', vibes: ['urban', 'culture'] },
  { id: 'paris', name: 'Paris', country: 'France', region: 'europe', vibes: ['luxury', 'culture', 'romantic'] },
  { id: 'thailand', name: 'Thailand', country: 'Thailand', region: 'asia', vibes: ['beach', 'tropical', 'adventure'] },
  { id: 'dubai', name: 'Dubai', country: 'UAE', region: 'middle-east', vibes: ['luxury', 'urban'] },
  { id: 'turkey', name: 'Istanbul', country: 'Turkey', region: 'middle-east', vibes: ['culture', 'historic'] },
  { id: 'greece', name: 'Santorini', country: 'Greece', region: 'europe', vibes: ['beach', 'luxury', 'historic'] },
  { id: 'london', name: 'London', country: 'UK', region: 'europe', vibes: ['culture', 'urban', 'historic'] },
];

const destinations = baseDestinations.map(dest => ({
  ...dest,
  image: getDestinationImage(dest.id)
}));

const MOCK_DESTINATIONS = {
  "kashmir": { destination: { name: "Kashmir", country: "India", description: "Dal Lake · Gulmarg · Pahalgam", type: "Nature" }, packages: [{ id: "k1", name: "Kashmir Explorer", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "goa": { destination: { name: "Goa", country: "India", description: "Baga Beach · Old Goa · Dudhsagar", type: "Beach" }, packages: [{ id: "g1", name: "Goa Beach Party", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "rajasthan": { destination: { name: "Rajasthan", country: "India", description: "Jaipur Forts · Thar Desert · Udaipur", type: "Culture" }, packages: [{ id: "r1", name: "Royal Rajasthan", duration_days: 7, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "japan": { destination: { name: "Kyoto", country: "Japan", description: "Fushimi Inari · Arashiyama · Gion", type: "Culture" }, packages: [{ id: "j1", name: "Kyoto Heritage", duration_days: 7, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "italy": { destination: { name: "Rome", country: "Italy", description: "Colosseum · Vatican · Trevi Fountain", type: "Culture" }, packages: [{ id: "i1", name: "Rome Highlights", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "bali": { destination: { name: "Bali", country: "Indonesia", description: "Ubud Temples · Rice Terraces · Seminyak", type: "Beach" }, packages: [{ id: "b1", name: "Bali Relax", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "new-york": { destination: { name: "New York", country: "USA", description: "Manhattan · Central Park · Brooklyn", type: "Urban" }, packages: [{ id: "n1", name: "NY City Pass", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "paris": { destination: { name: "Paris", country: "France", description: "Eiffel Tower · Louvre · Montmartre", type: "Culture" }, packages: [{ id: "p1", name: "Paris Romance", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "thailand": { destination: { name: "Thailand", country: "Thailand", description: "Phi Phi Islands · Chiang Mai · Bangkok", type: "Beach" }, packages: [{ id: "t1", name: "Thai Island Hopper", duration_days: 7, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "dubai": { destination: { name: "Dubai", country: "UAE", description: "Burj Khalifa · Desert Safari · Gold Souk", type: "Luxury" }, packages: [{ id: "d1", name: "Dubai Luxury", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "turkey": { destination: { name: "Istanbul", country: "Turkey", description: "Grand Bazaar · Bosphorus · Cappadocia", type: "Culture" }, packages: [{ id: "tu1", name: "Istanbul Wonders", duration_days: 7, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "greece": { destination: { name: "Santorini", country: "Greece", description: "Oia Sunsets · Aegean · Athens", type: "Beach" }, packages: [{ id: "gr1", name: "Greece Dream", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "london": { destination: { name: "London", country: "UK", description: "Big Ben · Notting Hill · Tower Bridge", type: "Urban" }, packages: [{ id: "l1", name: "London Calling", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "himachal": { destination: { name: "Himachal", country: "India", description: "Shimla · Manali · Dharamshala", type: "Nature" }, packages: [{ id: "h1", name: "Himachal Escape", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
  "kerala": { destination: { name: "Kerala", country: "India", description: "Backwaters · Munnar · Alleppey", type: "Nature" }, packages: [{ id: "ke1", name: "Kerala Serenity", duration_days: 5, budgetTiers: [{ type: "standard", price_per_day: 7000 }] }] },
};

export default function DestinationPackagesPage() {
  const { id: destId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const days = searchParams.get('days');
  const vibe = searchParams.get('vibe');
  const region = searchParams.get('region');
  const hasFilters = days || vibe || region;

  const [destination, setDestination] = useState(null);
  const [packages, setPackages] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDismissibleBanner, setShowDismissibleBanner] = useState(true);
  const [autoSelectedPackageId, setAutoSelectedPackageId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '';

  useEffect(() => {
    if (!destId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // Check for mock data first
      if (MOCK_DESTINATIONS[destId]) {
        setTimeout(() => {
          setDestination(MOCK_DESTINATIONS[destId].destination);
          setPackages(MOCK_DESTINATIONS[destId].packages);
          setLoading(false);
        }, 500); // simulate network delay
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/destinations/${destId}/packages`);
        if (!res.ok) {
          console.warn('API failed, falling back to mock data');
          const fallbackId = MOCK_DESTINATIONS[destId] ? destId : "japan";
          setDestination(MOCK_DESTINATIONS[fallbackId].destination);
          setPackages(MOCK_DESTINATIONS[fallbackId].packages);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setDestination(data.destination);
        setPackages(data.packages);

        // Fetch suggestion if dates exist
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');
        if (startDate && endDate) {
          const suggestRes = await fetch(`${API_BASE}/api/destinations/${destId}/packages/suggest?start_date=${startDate}&end_date=${endDate}`);
          if (suggestRes.ok) {
            const suggestData = await suggestRes.json();
            if (suggestData.suggestions && suggestData.suggestions.length > 0) {
              setSuggestion(suggestData.suggestions[0]);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [destId, searchParams]);

  useEffect(() => {
    if (days && packages.length > 0) {
      const closest = packages.reduce((prev, curr) => {
        return (Math.abs(curr.duration_days - parseInt(days)) < Math.abs(prev.duration_days - parseInt(days)) ? curr : prev);
      });
      setAutoSelectedPackageId(closest.id);
    }
  }, [days, packages]);

  const handleSelectPackage = (pkgId) => {
    const startDate = searchParams.get('start');
    navigate(`/destinations/${destId}/book?package_id=${pkgId}${startDate ? `&start=${startDate}` : ''}`);
  };

  // FIX 6: Add skeleton loading cards
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full animate-pulse">
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid View if no destId
  if (!destId) {
    const bannerText = [
      days && `${days} days`,
      vibe && `${vibe}`,
      region && `${region}`
    ].filter(Boolean).join(' · ');

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-serif font-bold text-slate-800 mb-2">Pick Your Destination</h2>
          <p className="text-slate-500 text-lg">Explore packages for your selected trip.</p>
        </div>

        {hasFilters && showDismissibleBanner && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <span>🎯 Showing packages filtered by: {bannerText} — click any destination to book</span>
            </div>
            <button onClick={() => setShowDismissibleBanner(false)} className="text-blue-500 hover:text-blue-700">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map(dest => (
            <div 
              key={dest.id}
              onClick={() => navigate(`/destinations/${dest.id}?${searchParams.toString()}`)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-full"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  loading="lazy" // FIX 2: Add lazy loading to ALL images
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-xs font-medium text-slate-200">{dest.country}</span>
                  <h3 className="text-2xl font-serif font-bold">{dest.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Error loading data</h3>
        <p className="text-slate-500 mb-6">{error || 'Destination not found'}</p>
        <Link to="/discover" className="text-primary hover:underline">← Back to destinations</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Hero */}
      <div className="relative h-80 rounded-3xl overflow-hidden">
        <img 
          src={getDestinationImage(destId)} 
          alt={destination.name} 
          loading="lazy" // FIX 2: Add lazy loading to ALL images
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-between p-6 md:p-8">
          <Link to="/discover" className="self-start flex items-center text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium">
            <ArrowLeft size={16} className="mr-2" /> All Destinations
          </Link>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-serif font-bold text-white">{destination.name}</h1>
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                {destination.type}
              </span>
            </div>
            <p className="text-white/80 text-sm max-w-2xl mb-2">{destination.country} — {destination.description}</p>
          </div>
        </div>
      </div>

      {/* Package Cards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-slate-800">Choose your trip duration</h2>
        
        <div className="grid grid-cols-1 gap-6">
          {packages.map(pkg => {
            const isSuggested = suggestion?.package?.id === pkg.id || (suggestion?.id === pkg.id);
            return (
              <div 
                key={pkg.id}
                className={`bg-white rounded-2xl border ${isSuggested || pkg.id === autoSelectedPackageId ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-100'} p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm hover:shadow-md transition-shadow`}
              >
                {/* LEFT */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {pkg.duration_days} Days
                    </span>
                    {isSuggested && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        Best Match
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{pkg.name}</h3>
                    <p className="text-slate-500 text-sm">{pkg.tagline}</p>
                  </div>
                </div>

                {/* MIDDLE */}
                <div className="flex-1 space-y-3 border-l border-r border-slate-50 px-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Cities you'll visit</p>
                    <div className="flex items-center text-sm text-slate-600 gap-2 overflow-x-auto py-1">
                      {(pkg.cities_covered || [destination?.name || 'Destination']).map((city, idx) => (
                        <span key={idx} className="flex items-center">
                          <span className="font-medium text-slate-700">{city}</span>
                          {idx < (pkg.cities_covered?.length || 1) - 1 && <ArrowRight size={14} className="mx-2 text-slate-400 flex-shrink-0" />}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Highlights</p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                      {(pkg.highlights || ['City Tour', 'Local Cuisine', 'Scenic Views']).slice(0, 4).map((h, idx) => (
                        <li key={idx} className="flex items-center">
                          <Check size={14} className="text-emerald-500 mr-2 flex-shrink-0" />
                          <span className="truncate">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col justify-between items-end gap-4 min-w-[180px]">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Starting from</span>
                    <p className="text-3xl font-bold text-slate-800">₹{(pkg.budgetTiers?.[0]?.price_per_day_inr || pkg.budgetTiers?.[0]?.price_per_day || 7000) * pkg.duration_days}</p>
                    <span className="text-xs text-slate-500">Total for {pkg.duration_days} days</span>
                  </div>

                  <button 
                    onClick={() => handleSelectPackage(pkg.id)}
                    className="w-full bg-primary hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                  >
                    Select Package <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
