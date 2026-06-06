import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Bed, Utensils, Car, Calendar, X } from 'lucide-react';
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

const MARQUEE_CHIPS = [
  "🌸 Japan · Zen", "🏖️ Goa · Beach", "🏛️ Rome · Historic", "🌴 Bali · Tropical", "🏔️ Kashmir · Nature",
  "🗼 Paris · Luxury", "🌆 New York · Urban", "🐘 Kerala · Nature", "🏜️ Rajasthan · Royal", "🌊 Thailand · Beach",
  "🕌 Dubai · Luxury", "🏛️ Greece · Historic", "☕ London · Culture", "🗻 Himachal · Adventure", "🍕 Turkey · Culture"
];

const ID_MAP = {
  "Japan": "japan", "Goa": "goa", "Rome": "italy", "Bali": "bali", "Kashmir": "kashmir",
  "Paris": "paris", "New York": "new-york", "Kerala": "kerala", "Rajasthan": "rajasthan", "Thailand": "thailand",
  "Dubai": "dubai", "Greece": "greece", "London": "london", "Himachal": "himachal", "Turkey": "turkey"
};

// FIX 4: Wrap destination cards in React.memo
const DestinationCard = React.memo(({ dest, isVisible, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-full ${isVisible ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}
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
          <div className="text-sm font-medium mt-1 text-white/90 group-hover:text-white flex items-center gap-1">
            See Packages <ArrowRight size={14} />
          </div>
        </div>
        <div className="absolute top-4 right-4 flex flex-wrap gap-1">
          {dest.vibes.map(v => (
            <span key={v} className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default function DiscoverPage() {
  const navigate = useNavigate();
  
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('All');

  const handleVibeClick = (vibe) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibe));
    } else if (selectedVibes.length < 3) {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const clearFilters = () => {
    setSelectedDuration('All');
    setSelectedVibes([]);
    setSelectedRegion('All');
  };

  // FIX 3: Debounce the filter chips (using useMemo)
  const filteredDestinations = useMemo(() => {
    return destinations.filter(dest => {
      const matchDuration = selectedDuration === 'All' || true; // Placeholder logic as in original
      const matchVibes = selectedVibes.length === 0 || selectedVibes.every(v => dest.vibes.includes(v.toLowerCase()));
      const matchRegion = selectedRegion === 'All' || dest.region === selectedRegion.toLowerCase().replace(' ', '-');
      
      return matchDuration && matchVibes && matchRegion;
    });
  }, [selectedDuration, selectedVibes, selectedRegion]);

  const handleCardClick = (id) => {
    const daysParam = selectedDuration !== 'All' ? `days=${selectedDuration.split(' ')[0]}` : '';
    const vibeParam = selectedVibes.length > 0 ? `vibe=${selectedVibes.join(',')}` : '';
    const regionParam = selectedRegion !== 'All' ? `region=${selectedRegion.toLowerCase()}` : '';
    
    const params = [daysParam, vibeParam, regionParam].filter(Boolean).join('&');
    navigate(`/destinations/${id}?${params}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Title */}
      <div className="text-center mb-6 pt-8">
        <h2 className="text-4xl font-serif font-bold text-slate-800 mb-2">Explore Destinations</h2>
        <p className="text-slate-500 text-lg">Set your filters — then explore matching packages.</p>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm p-4 space-y-4">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Row 1 — Duration */}
          {/* FIX 5: Improve filter chip visual design */}
          <div className="flex items-center gap-3 py-2">
            <span className="text-sm font-semibold text-gray-500 w-16 md:w-20 flex-shrink-0">Duration:</span>
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {['All', '5 Days', '7 Days', '10 Days', '12 Days', '15 Days'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={selectedDuration === d 
                    ? "px-4 py-2 rounded-full bg-blue-600 text-white font-medium text-sm cursor-pointer transition-all duration-150 shadow-sm"
                    : "px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 font-medium text-sm cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all duration-150 shadow-sm"}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 — Vibe */}
          <div className="flex items-center gap-3 py-2">
            <span className="text-sm font-semibold text-gray-500 w-16 md:w-20 flex-shrink-0">Vibe:</span>
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {['Beach', 'Culture', 'Adventure', 'Luxury', 'Nature', 'Royal', 'Zen', 'Tropical', 'Urban', 'Historic'].map(v => (
                <button
                  key={v}
                  onClick={() => handleVibeClick(v)}
                  className={selectedVibes.includes(v)
                    ? "px-4 py-2 rounded-full bg-blue-600 text-white font-medium text-sm cursor-pointer transition-all duration-150 shadow-sm"
                    : "px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 font-medium text-sm cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all duration-150 shadow-sm"}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3 — Region */}
          <div className="flex items-center gap-3 py-2">
            <span className="text-sm font-semibold text-gray-500 w-16 md:w-20 flex-shrink-0">Region:</span>
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {['All', 'India', 'Asia', 'Europe', 'Middle East', 'Americas'].map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={selectedRegion === r
                    ? "px-4 py-2 rounded-full bg-blue-600 text-white font-medium text-sm cursor-pointer transition-all duration-150 shadow-sm"
                    : "px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 font-medium text-sm cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all duration-150 shadow-sm"}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Info & Clear */}
          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Showing {filteredDestinations.length} of {destinations.length} destinations</span>
            {(selectedDuration !== 'All' || selectedVibes.length > 0 || selectedRegion !== 'All') && (
              <button onClick={clearFilters} className="text-primary hover:underline font-medium">Clear filters</button>
            )}
          </div>
        </div>
      </div>

      {/* Marquee Strip */}
      <div className="relative overflow-hidden bg-white py-4 border-b border-slate-100">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
        
        <div className="animate-marquee gap-4">
          {[...MARQUEE_CHIPS, ...MARQUEE_CHIPS].map((chip, index) => {
            const parts = chip.split(' · ');
            const name = parts[0].replace(/[^a-zA-Z]/g, '').trim();
            const id = ID_MAP[name];
            
            return (
              <div
                key={index}
                onClick={() => id && navigate(`/destinations/${id}`)}
                className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100 flex items-center gap-2 cursor-pointer hover:shadow-md transition-shadow whitespace-nowrap"
              >
                <span>{chip}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map(dest => {
            const isVisible = filteredDestinations.some(d => d.id === dest.id);
            
            return (
              <DestinationCard 
                key={dest.id}
                dest={dest}
                isVisible={isVisible}
                onClick={() => handleCardClick(dest.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
