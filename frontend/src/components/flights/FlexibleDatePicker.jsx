import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isBefore, startOfDay, isSameDay, isAfter } from 'date-fns';
import FlightOptionsPanel from '../shared/FlightOptionsPanel';
import LeaveByBanner from '../shared/LeaveByBanner';
import BudgetAdjustmentCard from '../shared/BudgetAdjustmentCard';
import { calculateLeaveByTime, recalculateBudget } from '../../utils/flightUtils';

export default function FlexibleDatePicker({ origin, destination, tripType = 'roundtrip', onSelectDates, onConfirm, initialMonth = new Date(), packageData, originalBudget, travelers = 2 }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialMonth));
  const [priceGrid, setPriceGrid] = useState({});
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  
  const [selectedDepart, setSelectedDepart] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // New states for Smart Date Picker
  const [selectedDate, setSelectedDate] = useState(null);
  const [flightOptions, setFlightOptions] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [noFlightsFound, setNoFlightsFound] = useState(false);
  const [leaveByInfo, setLeaveByInfo] = useState(null);
  const [updatedBudget, setUpdatedBudget] = useState(null);

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

  const getDotColor = (price) => {
    if (!price) return null;
    const pct = (price - minPrice) / (maxPrice - minPrice);
    if (pct <= 0.25) return 'bg-emerald-500'; // cheap
    if (pct >= 0.75) return 'bg-amber-500';   // expensive
    return 'bg-gray-400';                      // mid
  };

  const handleFlightSelect = (flight, selDate) => {
    setSelectedFlight(flight);
    const leaveBy = calculateLeaveByTime(flight.departTime);
    setLeaveByInfo(leaveBy);
    if (originalBudget) {
      // Per-person budget model: pass breakdown, budget ceiling, flight, travelers
      const perPersonBreakdown = {
        flights: 0,
        accommodation: originalBudget.accommodation || 0,
        food: originalBudget.food || 0,
        activities: originalBudget.activities || 0,
        localTransport: originalBudget.localTransport || 0,
      };
      const newBudget = recalculateBudget(perPersonBreakdown, originalBudget.perPersonBudget || originalBudget.total, flight, travelers);
      setUpdatedBudget(newBudget);
    }
    // Backward compatibility if needed
    onSelectDates?.(selDate, null, flight);
  };

  // Client-side fallback when API is unavailable
  const generateFallbackFlights = (dateStr, basePrice) => {
    const t = parseInt(travelers, 10) || 1;
    const cheapestPrice = basePrice ? basePrice : 4850;
    
    return [
      {
        id: `f1-${Date.now()}`,
        airline: "IndiGo",
        flightNo: "6E-301",
        departTime: "06:20",
        arriveTime: "07:55",
        duration: "1h 35m",
        stops: 0,
        pricePerPerson: cheapestPrice,
        totalPrice: cheapestPrice * t,
        badge: "Cheapest",
        aircraft: "Airbus A320"
      },
      {
        id: `f2-${Date.now()}`,
        airline: "Air India",
        flightNo: "AI-895",
        departTime: "08:45",
        arriveTime: "10:20",
        duration: "1h 35m",
        stops: 0,
        pricePerPerson: cheapestPrice + 550,
        totalPrice: (cheapestPrice + 550) * t,
        badge: "Best value",
        aircraft: "Boeing 737"
      },
      {
        id: `f3-${Date.now()}`,
        airline: "SpiceJet",
        flightNo: "SG-112",
        departTime: "14:10",
        arriveTime: "15:50",
        duration: "1h 40m",
        stops: 0,
        pricePerPerson: cheapestPrice + 250,
        totalPrice: (cheapestPrice + 250) * t,
        badge: "Fastest",
        aircraft: "Boeing 737 MAX"
      }
    ];
  };

  const fetchFlightsForDate = async (date, calendarPrice) => {
    setLoadingFlights(true);
    setNoFlightsFound(false);
    setFlightOptions([]);
    setSelectedFlight(null);
    setLeaveByInfo(null);
    setUpdatedBudget(null);

    const dateStr = format(date, 'yyyy-MM-dd');
    let flights = [];

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/flights/options?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${dateStr}&travelers=${travelers}&basePrice=${calendarPrice || ''}`);
      if (res.ok) {
        const data = await res.json();
        flights = data.flights || [];
      }
    } catch (err) {
      console.warn('Flight API unavailable, using fallback data:', err.message);
    }

    // Fallback to client-side mock if API returned nothing
    if (flights.length === 0) {
      console.warn('Using client-side fallback flight data');
      flights = generateFallbackFlights(dateStr, calendarPrice);
    }

    setFlightOptions(flights);
    handleFlightSelect(flights[0], date);
    setLoadingFlights(false);
  };

  const handleDateClick = (date, price) => {
    if (isBefore(date, startOfDay(new Date()))) return;

    if (tripType === 'oneway') {
      setSelectedDepart(date);
      setSelectedDate(date);
      onSelectDates?.(date, null);
      fetchFlightsForDate(date, price);
      return;
    }

    // Round trip logic (unchanged)
    if (!selectedDepart || (selectedDepart && selectedReturn)) {
      setSelectedDepart(date);
      setSelectedReturn(null);
    } else {
      if (isBefore(date, selectedDepart)) {
        setSelectedDepart(date);
      } else {
        setSelectedReturn(date);
        onSelectDates?.(selectedDepart, date);
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
            <div className="w-6 h-1.5 bg-gray-200 rounded-full animate-pulse mt-1"></div>
          ) : price && !isPast ? (
            <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : getDotColor(price)}`}></span>
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
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm">
        <div className="flex items-center gap-5 mb-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-gray-600 text-xs">Cheaper dates</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div><span className="text-gray-600 text-xs">Mid-range</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-gray-600 text-xs">Higher prices</span></div>
        </div>
        <p className="text-xs text-gray-400">Select a date to see exact flight prices below</p>
        {tripType === 'roundtrip' && selectedDepart && selectedReturn && (
          <div className="flex justify-end mt-2">
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Confirm Dates
            </button>
          </div>
        )}
      </div>

      {/* Flight Options section for one-way / packages */}
      {tripType === 'oneway' && selectedDate && (
        <div className="px-6 pb-6">
          <FlightOptionsPanel
            flights={flightOptions}
            selectedFlight={selectedFlight}
            onSelect={(f) => handleFlightSelect(f, selectedDate)}
            loading={loadingFlights}
            noFlightsFound={noFlightsFound}
            date={selectedDate}
            onDateChange={(newDate) => {
              setSelectedDepart(newDate);
              setSelectedDate(newDate);
              onSelectDates?.(newDate, null);
              const dateStr = format(newDate, 'yyyy-MM-dd');
              const price = priceGrid[dateStr];
              fetchFlightsForDate(newDate, price);
            }}
          />

          {selectedFlight && leaveByInfo && (
            <LeaveByBanner
              leaveByInfo={leaveByInfo}
              selectedFlight={selectedFlight}
              departDate={selectedDate}
            />
          )}

          {selectedFlight && updatedBudget && (
            <BudgetAdjustmentCard
              budgetResult={updatedBudget}
              selectedFlight={selectedFlight}
              travelers={travelers}
            />
          )}

          {selectedFlight && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onConfirm?.({ date: selectedDate, flight: selectedFlight, budget: updatedBudget })}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm w-full md:w-auto"
              >
                Confirm — {selectedFlight.airline} {leaveByInfo?.departDisplay}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
