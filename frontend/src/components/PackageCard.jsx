import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import FlexibleDatePicker from './shared/FlexibleDatePicker';
import PriceAlertButton from './shared/PriceAlertButton';
import ShareTripCard from './shared/ShareTripCard';

export default function PackageCard({ pkg, variant = 'grid' }) {
  const navigate = useNavigate();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCustomizeWithAI = async () => {
    // If we don't have copilotSeed, we need to fetch it (GET /api/packages/v2/:id)
    let seed = pkg.copilotSeed;
    if (!seed) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/v2/${pkg.id}`);
        if (res.ok) {
          const data = await res.json();
          seed = data.copilotSeed;
        }
      } catch (err) {
        console.error("Failed to fetch full package for AI customization", err);
      }
    }
    
    // Fallback if still no seed
    if (!seed) {
      seed = {
        destination: pkg.destination,
        duration: pkg.duration,
        budget: pkg.pricePerPerson * 2 // Default assumption
      };
    }

    navigate('/copilot', { state: { prefill: seed } });
  };

  const handleBookNow = () => {
    navigate(`/destinations/${pkg.destinationId || pkg.destination}/book?package_id=${pkg.id}`);
  };

  const isFeatured = variant === 'featured';

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full group ${isFeatured ? 'w-[320px] sm:w-[400px] shrink-0' : 'w-full'}`}>
      
      {/* Top Image Section */}
      <div className="relative">
        <div className={`w-full ${isFeatured ? 'h-64' : 'h-48'} overflow-hidden relative`}>
          <img 
            src={pkg.coverPhoto || `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80`} 
            alt={pkg.destination} 
            onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80"; }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* AI Badge */}
        {pkg.source === 'ai_promoted' && (
          <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles size={12} /> AI
          </div>
        )}

        {/* Bottom Left Info Overlaid */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur text-slate-800 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
            <MapPin size={12} /> {pkg.country}
          </div>
          <div className="bg-black/40 backdrop-blur text-white text-xs font-medium px-2 py-1 rounded-md">
            {pkg.duration} days
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1">
        
        <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1">{pkg.title || pkg.destination}</h3>
        <p className="text-sm text-slate-500 mb-4">{pkg.country}</p>

        {/* Highlights Pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {pkg.highlights?.slice(0, 3).map((h, i) => (
            <span key={i} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full border border-slate-100">
              {h}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          {/* Price & Icons Row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs text-slate-500 font-medium mb-0.5">Starting from</div>
              <div className="text-lg font-bold text-slate-900">
                ₹{pkg.pricePerPerson?.toLocaleString('en-IN') || '0'} <span className="text-sm font-normal text-slate-500">/ person</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 relative">
              <div ref={datePickerRef} className="relative">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`p-2 rounded-full transition-colors shadow-sm ${showDatePicker ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  title="Check prices by date"
                >
                  <Calendar size={18} />
                </button>
                {showDatePicker && (
                  <div className="absolute bottom-full right-0 mb-2 w-[340px] sm:w-[380px]">
                    <FlexibleDatePicker 
                      origin="DEL" // Default, could be dynamic
                      destination={pkg.destination}
                      tripType="roundtrip"
                      onSelectDates={() => {}} // Could dispatch to booking flow
                      onClose={() => setShowDatePicker(false)}
                    />
                  </div>
                )}
              </div>
              
              <PriceAlertButton 
                context="package"
                contextId={pkg.id}
                destination={pkg.destination}
                origin="DEL"
                currentPrice={pkg.pricePerPerson}
              />

              <ShareTripCard 
                destination={pkg.destination}
                country={pkg.country}
                departDate=""
                durationNights={pkg.duration}
                totalBudget={pkg.pricePerPerson}
                coverPhotoUrl={pkg.coverPhoto}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCustomizeWithAI}
              className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl transition-colors text-sm"
            >
              <Sparkles size={16} /> Customize
            </button>
            <button 
              onClick={handleBookNow}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Book now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
