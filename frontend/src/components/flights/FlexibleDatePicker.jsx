import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isBefore, startOfDay, isSameDay, isAfter } from 'date-fns';

export default function FlexibleDatePicker({ origin, destination, tripType = 'roundtrip', onSelectDates, initialMonth = new Date() }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialMonth));
  const [priceGrid, setPriceGrid] = useState({});
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  
  const [selectedDepart, setSelectedDepart] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Cache API responses to avoid refetching
  const [priceCache, setPriceCache] = useState({});

  useEffect(() => {
    fetchPriceGrid(currentMonth);
    // Prefetch next month
    fetchPriceGrid(addMonths(currentMonth, 1), true);
  }, [origin, destination, currentMonth]);

  const fetchPriceGrid = async (monthDate, isPrefetch = false) => {
    const monthStr = format(monthDate, 'yyyy-MM');
    const cacheKey = `${origin}-${destination}-${monthStr}`;
    
    if (priceCache[cacheKey]) {
      if (!isPrefetch) {
        setPriceGrid(priceCache[cacheKey].prices);
        setMinPrice(priceCache[cacheKey].min_price);
        setMaxPrice(priceCache[cacheKey].max_price);
        setLoading(false);
      }
      return;
    }

    if (!isPrefetch) setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/flights/price-grid?origin=${origin}&destination=${destination}&month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setPriceCache(prev => ({ ...prev, [cacheKey]: data }));
        if (!isPrefetch) {
          setPriceGrid(data.prices);
          setMinPrice(data.min_price);
          setMaxPrice(data.max_price);
        }
      }
    } catch (err) {
      console.error('Failed to fetch price grid', err);
    } finally {
      if (!isPrefetch) setLoading(false);
    }
  };

  const getCellColorClass = (price) => {
    if (!price) return 'text-gray-400 bg-gray-50 cursor-not-allowed'; // unavailable
    
    const pct = (price - minPrice) / (maxPrice - minPrice);
    if (pct <= 0.25) return 'bg-[#E1F5EE] text-[#0F6E56] hover:scale-105 hover:shadow-sm border border-transparent hover:border-blue-200 cursor-pointer'; // cheap
    if (pct >= 0.75) return 'bg-[#FAEEDA] text-[#854F0B] hover:scale-105 hover:shadow-sm border border-transparent hover:border-blue-200 cursor-pointer'; // expensive
    return 'bg-white text-gray-700 hover:scale-105 hover:shadow-sm border border-transparent hover:border-blue-200 cursor-pointer'; // mid
  };

  const handleDateClick = (date, price) => {
    if (isBefore(date, startOfDay(new Date()))) return;

    if (tripType === 'oneway') {
      setSelectedDepart(date);
      onSelectDates(date, null);
      return;
    }

    // Round trip logic
    if (!selectedDepart || (selectedDepart && selectedReturn)) {
      setSelectedDepart(date);
      setSelectedReturn(null);
    } else {
      if (isBefore(date, selectedDepart)) {
        setSelectedDepart(date);
      } else {
        setSelectedReturn(date);
        onSelectDates(selectedDepart, date);
      }
    }
  };

  const isDateSelected = (date) => {
    return (selectedDepart && isSameDay(date, selectedDepart)) || (selectedReturn && isSameDay(date, selectedReturn));
  };

  const isDateInRange = (date) => {
    if (!selectedDepart || !selectedReturn) return false;
    return isAfter(date, selectedDepart) && isBefore(date, selectedReturn);
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfWeek = getDay(currentMonth);
    const today = startOfDay(new Date());

    const days = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 border border-gray-100 bg-gray-50/50"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const price = priceGrid[dateStr];
      const isPast = isBefore(date, today);
      const isSelected = isDateSelected(date);
      const inRange = isDateInRange(date);

      let classes = "h-16 flex flex-col items-center justify-center border border-gray-100 transition-all relative ";
      
      if (isPast) {
        classes += "opacity-50 bg-gray-50 cursor-not-allowed";
      } else if (isSelected) {
        classes += "bg-blue-600 text-white shadow-md z-10 scale-105 rounded-lg";
      } else if (inRange) {
        classes += "bg-blue-50 text-blue-800";
      } else if (loading) {
        classes += "bg-white"; // default while loading
      } else {
        classes += getCellColorClass(price);
      }

      days.push(
        <div 
          key={dateStr} 
          onClick={() => !isPast && handleDateClick(date, price)}
          className={classes}
        >
          <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>{i}</span>
          
          {loading ? (
            <div className="w-10 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : price && !isPast ? (
            <span className={`text-[11px] font-semibold mt-1 ${isSelected ? 'text-white' : ''}`}>
              ₹{price >= 1000 ? (price/1000).toFixed(1) + 'K' : price}
            </span>
          ) : null}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 border border-transparent hover:border-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-serif text-xl text-gray-900 font-bold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 border border-transparent hover:border-gray-200"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#E1F5EE] border border-[#0F6E56]/20"></div><span className="text-gray-600 text-xs">Cheapest</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#FAEEDA] border border-[#854F0B]/20"></div><span className="text-gray-600 text-xs">Most Expensive</span></div>
        </div>
        {selectedDepart && selectedReturn && (
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Confirm Dates
          </button>
        )}
      </div>
    </div>
  );
}
