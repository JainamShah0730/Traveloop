import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isPast, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Loader } from 'lucide-react';

export default function FlexibleDatePicker({ origin = 'DEL', destination = 'GOA', tripType = 'oneway', onSelectDates, context = 'package', onClose }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartDate, setSelectedDepartDate] = useState(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const monthStr = format(currentMonth, 'yyyy-MM');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/flights/price-grid?origin=${origin}&destination=${destination}&month=${monthStr}`);
        if (res.ok) {
          const data = await res.json();
          setPriceData(data);
        } else {
          // Fallback if API fails (mock data)
          setPriceData({ prices: {}, min_price: 4000, max_price: 10000 });
        }
      } catch (e) {
        setPriceData({ prices: {}, min_price: 4000, max_price: 10000 });
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [currentMonth, origin, destination]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getCellColor = (price, minPrice, maxPrice) => {
    if (!price) return 'bg-slate-50 text-slate-400 cursor-not-allowed';
    const pct = (price - minPrice) / (maxPrice - minPrice);
    if (pct < 0.25) return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
    if (pct > 0.75) return 'bg-amber-50 text-amber-700 hover:bg-amber-100';
    return 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100';
  };

  const getDotColor = (price, minPrice, maxPrice) => {
    if (!price) return null;
    const pct = (price - minPrice) / (maxPrice - minPrice);
    if (pct < 0.25) return 'bg-emerald-500';
    if (pct > 0.75) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const handleDayClick = (day) => {
    if (isPast(day) && !isToday(day)) return;
    
    const dayStr = format(day, 'yyyy-MM-dd');
    const price = priceData?.prices?.[dayStr];
    if (!price && !priceData) return; // Allow selection even if mock

    if (tripType === 'oneway') {
      setSelectedDepartDate(day);
      onSelectDates(day);
      if (onClose) setTimeout(onClose, 300);
    } else {
      if (!selectedDepartDate || (selectedDepartDate && selectedReturnDate)) {
        setSelectedDepartDate(day);
        setSelectedReturnDate(null);
      } else if (day >= selectedDepartDate) {
        setSelectedReturnDate(day);
        onSelectDates(selectedDepartDate, day);
        if (onClose) setTimeout(onClose, 300);
      } else {
        setSelectedDepartDate(day);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 w-full max-w-md relative z-50">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          disabled={isPast(startOfMonth(currentMonth)) && !isSameMonth(currentMonth, new Date())}
        >
          <ChevronLeft size={20} className={isPast(startOfMonth(currentMonth)) && !isSameMonth(currentMonth, new Date()) ? "text-slate-300" : "text-slate-700"} />
        </button>
        <h3 className="text-lg font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronRight size={20} className="text-slate-700" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}
        
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isPastDay = isPast(day) && !isToday(day);
          const price = priceData?.prices?.[dayStr];
          
          let stateClass = '';
          if (loading) {
            stateClass = 'bg-slate-100 animate-pulse';
          } else if (isPastDay) {
            stateClass = 'bg-transparent text-slate-300 cursor-not-allowed opacity-50';
          } else if (selectedDepartDate && isSameDay(day, selectedDepartDate)) {
            stateClass = 'bg-indigo-600 text-white shadow-md';
          } else if (selectedReturnDate && isSameDay(day, selectedReturnDate)) {
            stateClass = 'bg-indigo-600 text-white shadow-md';
          } else if (selectedDepartDate && selectedReturnDate && day > selectedDepartDate && day < selectedReturnDate) {
            stateClass = 'bg-indigo-50 text-indigo-700';
          } else {
            stateClass = getCellColor(price, priceData?.min_price, priceData?.max_price);
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              disabled={isPastDay || loading}
              className={`h-12 rounded-lg flex flex-col items-center justify-center transition-all ${stateClass}`}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {!loading && !isPastDay && price && (!selectedDepartDate || !isSameDay(day, selectedDepartDate)) && (!selectedReturnDate || !isSameDay(day, selectedReturnDate)) && (
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-0.5 ${getDotColor(price, priceData?.min_price, priceData?.max_price)}`}></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-center gap-4 mb-1">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-500 text-[10px]">Cheaper dates</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div><span className="text-slate-500 text-[10px]">Mid-range</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-slate-500 text-[10px]">Higher prices</span></div>
        </div>
        <p className="text-center text-[10px] text-slate-400">Select a date to see exact flight prices</p>
      </div>
    </div>
  );
}
