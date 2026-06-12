import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PackageCard from '../components/PackageCard';
import CommunityCard from '../components/CommunityCard';

export default function PackagesPage() {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [isFeaturedFallback, setIsFeaturedFallback] = useState(false);
  const [aiPackages, setAiPackages] = useState([]);
  const [communityPicks, setCommunityPicks] = useState([]);
  
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingAi, setLoadingAi] = useState(true);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  const [aiCursor, setAiCursor] = useState(null);
  const [communityCursor, setCommunityCursor] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    region: '',
    duration: '',
    maxBudget: '',
    style: ''
  });

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const buildQuery = (baseParams = {}) => {
    const params = new URLSearchParams(baseParams);
    if (filters.region) params.append('region', filters.region);
    if (filters.duration) params.append('duration', filters.duration);
    if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
    if (filters.style) params.append('style', filters.style);
    return params.toString();
  };

  const fetchFeatured = async () => {
    setLoadingFeatured(true);
    setIsFeaturedFallback(false);
    try {
      const qs = buildQuery({ featured: 'true', limit: 12 });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/v2?${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.packages && data.packages.length > 0) {
          setFeaturedPackages(data.packages);
        } else if (hasActiveFilters) {
          // Fallback: Always provide prefeatured packages from our side if filters yield none
          const fallbackRes = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/v2?featured=true&limit=12`, { cache: "no-store" });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            setFeaturedPackages(fallbackData.packages || []);
            setIsFeaturedFallback(true);
          }
        } else {
          setFeaturedPackages([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const fetchAi = async (isLoadMore = false) => {
    if (!isLoadMore) setLoadingAi(true);
    try {
      const params = { limit: 12 };
      if (isLoadMore && aiCursor) params.cursor = aiCursor;
      const qs = buildQuery(params);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/v2?${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const newPkgs = data.packages.filter(p => !p.isFeatured); // Filter out featured from AI section
        setAiPackages(prev => isLoadMore ? [...prev, ...newPkgs] : newPkgs);
        setAiCursor(data.nextCursor);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isLoadMore) setLoadingAi(false);
    }
  };

  const fetchCommunity = async (isLoadMore = false) => {
    if (!isLoadMore) setLoadingCommunity(true);
    try {
      const params = new URLSearchParams({ limit: 12 });
      if (isLoadMore && communityCursor) params.append('cursor', communityCursor);
      if (filters.duration) params.append('duration', filters.duration);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/community/list?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        let itins = data.itineraries || [];
        // Apply JS filtering for region/style since backend doesn't support it for AI plans
        if (filters.region || filters.style) {
           itins = itins.filter(it => {
              let match = true;
              if (filters.region && it.destination) {
                 // Basic text match for region/country hints in destination
                 const destLower = it.destination.toLowerCase();
                 const regionLower = filters.region.toLowerCase();
                 if (regionLower === 'europe' && !['paris', 'rome', 'london', 'europe', 'amsterdam', 'switzerland'].some(x => destLower.includes(x))) match = false;
                 if (regionLower === 'india' && !['goa', 'kashmir', 'rajasthan', 'manali', 'india', 'delhi', 'mumbai'].some(x => destLower.includes(x))) match = false;
                 if (regionLower === 'southeastasia' && !['bali', 'thailand', 'vietnam', 'bangkok', 'phuket'].some(x => destLower.includes(x))) match = false;
                 // Add more basic mappings as needed, but this prevents totally irrelevant results
              }
              return match;
           });
        }
        setCommunityPicks(prev => isLoadMore ? [...prev, ...itins] : itins);
        setCommunityCursor(data.nextCursor);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isLoadMore) setLoadingCommunity(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
    fetchAi();
    // Community picks ignore filters, so we only fetch them on mount or if we want to reset
    if (communityPicks.length === 0) fetchCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const SkeletonCard = ({ variant = 'grid' }) => (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full ${variant === 'featured' ? 'w-[320px] sm:w-[400px] shrink-0' : 'w-full'}`}>
      <div className={`w-full ${variant === 'featured' ? 'h-64' : 'h-48'} bg-slate-200 animate-pulse`} />
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-20 animate-pulse" />
        </div>
        <div className="mt-auto flex justify-between items-end pt-4">
          <div className="h-8 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  const isFeaturedEmpty = !loadingFeatured && featuredPackages.length === 0;
  const isAiEmpty = !loadingAi && aiPackages.length === 0;
  const isCommunityEmpty = !loadingCommunity && communityPicks.length === 0;
  const allEmpty = isFeaturedEmpty && isAiEmpty && isCommunityEmpty;

  return (
    <div className="w-full pb-20 bg-slate-50 min-h-screen relative">
      {/* Hero Section */}
      <section className="relative h-[450px] flex items-center justify-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=80" alt="Travel" className="w-full h-full object-cover opacity-50" />
        </div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-5xl -mt-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Find your perfect trip</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">Handpicked destinations, AI-built itineraries, and plans from fellow travelers</p>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-50 flex justify-center w-full px-4 -mt-10 pb-4">
        <div className="bg-white/30 backdrop-blur-2xl p-2 sm:p-4 rounded-2xl flex flex-wrap gap-3 justify-center items-center border border-white/40 shadow-2xl">
          <select 
            value={filters.region} onChange={e => setFilters({...filters, region: e.target.value})}
            className="bg-white/90 text-slate-800 rounded-xl px-4 py-2.5 outline-none cursor-pointer border-0 ring-2 ring-transparent focus:ring-indigo-500 font-medium shadow-sm"
          >
            <option value="">Any Region</option>
            <option value="India">India</option>
            <option value="SoutheastAsia">Southeast Asia</option>
            <option value="Europe">Europe</option>
            <option value="MiddleEast">Middle East</option>
            <option value="Africa">Africa</option>
            <option value="Americas">Americas</option>
          </select>

          <select 
            value={filters.duration} onChange={e => setFilters({...filters, duration: e.target.value})}
            className="bg-white/90 text-slate-800 rounded-xl px-4 py-2.5 outline-none cursor-pointer border-0 ring-2 ring-transparent focus:ring-indigo-500 font-medium shadow-sm"
          >
            <option value="">Any Duration</option>
            <option value="3">3 Days</option>
            <option value="5">5 Days</option>
            <option value="7">7 Days</option>
            <option value="10">10+ Days</option>
          </select>

          <select 
            value={filters.maxBudget} onChange={e => setFilters({...filters, maxBudget: e.target.value})}
            className="bg-white/90 text-slate-800 rounded-xl px-4 py-2.5 outline-none cursor-pointer border-0 ring-2 ring-transparent focus:ring-indigo-500 font-medium shadow-sm"
          >
            <option value="">Any Budget</option>
            <option value="50000">Under ₹50,000</option>
            <option value="100000">Under ₹1,00,000</option>
            <option value="200000">Under ₹2,00,000</option>
            <option value="500000">Under ₹5,00,000</option>
          </select>

          <select 
            value={filters.style} onChange={e => setFilters({...filters, style: e.target.value})}
            className="bg-white/90 text-slate-800 rounded-xl px-4 py-2.5 outline-none cursor-pointer border-0 ring-2 ring-transparent focus:ring-indigo-500 font-medium shadow-sm"
          >
            <option value="">Any Style</option>
            <option value="relaxation">Beach & Relax</option>
            <option value="adventure">Adventure</option>
            <option value="cultural">Cultural</option>
            <option value="honeymoon">Honeymoon</option>
            <option value="luxury">Luxury</option>
            <option value="family">Family</option>
          </select>

          {hasActiveFilters && (
            <button 
              onClick={() => setFilters({region:'', duration:'', maxBudget:'', style:''})}
              className="text-slate-800 bg-white/70 backdrop-blur rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white shadow-sm transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="px-4 md:px-8 space-y-20 max-w-[1400px] mx-auto mt-12 relative z-20">
        
        {allEmpty ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">No trips found matching your filters.</h2>
            <p className="text-slate-500">Try adjusting them to see more amazing destinations.</p>
            <button 
              onClick={() => setFilters({region:'', duration:'', maxBudget:'', style:''})}
              className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Section 1: Featured Packages */}
            {(!isFeaturedEmpty || loadingFeatured) && (
              <section>
                <div className="mb-6">
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-1">Featured trips</h2>
                  <p className="text-slate-500">
                    {isFeaturedFallback 
                      ? "No exact matches for your filters, but check out our top picks from our travel experts"
                      : "Hand-crafted by our travel experts"}
                  </p>
                </div>
                
                {loadingFeatured ? (
                  <div className="flex overflow-x-auto pb-8 gap-6 snap-x hide-scrollbar">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} variant="featured" />)}
                  </div>
                ) : (
                  <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar">
                    {featuredPackages.map(pkg => (
                      <div key={pkg.id} className="snap-start">
                        <PackageCard pkg={pkg} variant="featured" />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Section 2: AI-Built Packages */}
            {(!isAiEmpty || loadingAi) && (
              <section>
                <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-1">Built by AI, loved by travelers</h2>
                  <p className="text-slate-500">These itineraries were generated by our AI and promoted by the team</p>
                </div>
                
                {loadingAi && aiPackages.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} variant="grid" />)}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {aiPackages.map(pkg => (
                        <PackageCard key={pkg.id} pkg={pkg} variant="grid" />
                      ))}
                    </div>
                    {aiCursor && (
                      <div className="mt-10 flex justify-center">
                        <button 
                          onClick={() => fetchAi(true)}
                          disabled={loadingAi}
                          className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                          {loadingAi ? 'Loading...' : 'Load more trips'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* Section 3: Community Picks */}
            {(!isCommunityEmpty || loadingCommunity) && (
              <section className="pt-10 border-t border-slate-200">
                <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-1">Plans from fellow travelers</h2>
                  <p className="text-slate-500">Real itineraries shared by Travelloop users. Click to preview or use.</p>
                </div>
                
                {loadingCommunity && communityPicks.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 h-64 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {communityPicks.map(itinerary => (
                        <CommunityCard key={itinerary.id} itinerary={itinerary} />
                      ))}
                    </div>
                    {communityCursor && (
                      <div className="mt-10 flex justify-center">
                        <button 
                          onClick={() => fetchCommunity(true)}
                          disabled={loadingCommunity}
                          className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                          {loadingCommunity ? 'Loading...' : 'Load more plans'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
