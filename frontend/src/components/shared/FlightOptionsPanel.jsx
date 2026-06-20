import React from 'react';
import { format, addDays, subDays } from 'date-fns';

export default function FlightOptionsPanel({ flights, selectedFlight, onSelect, loading, noFlightsFound, date, onDateChange }) {
  if (loading) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-6">
        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4">
          Finding flights for {format(date, 'MMM d, yyyy')}...
        </h4>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (noFlightsFound || !flights || flights.length === 0) {
    const prevDay = subDays(date, 1);
    const nextDay = addDays(date, 1);
    return (
      <div className="mt-6 border-t border-slate-100 pt-6">
        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4">
          Flights on {format(date, 'MMM d, yyyy')}
        </h4>
        <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
          <p className="text-slate-600 mb-4">No flights available on this date. Try an adjacent date.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => onDateChange?.(prevDay)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
            >
              {format(prevDay, 'MMM d')}
            </button>
            <button
              onClick={() => onDateChange?.(nextDay)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
            >
              {format(nextDay, 'MMM d')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4">
        Flights on {format(date, 'MMM d, yyyy')}
      </h4>
      <div className="space-y-4">
        {flights.map((flight) => {
          const isSelected = selectedFlight?.id === flight.id;
          
          let badgeClass = 'bg-slate-100 text-slate-600';
          if (flight.badge === 'Cheapest') badgeClass = 'bg-[#E1F5EE] text-[#0F6E56]';
          if (flight.badge === 'Fastest') badgeClass = 'bg-[#E8EDFB] text-[#185FA5]';
          if (flight.badge === 'Best value') badgeClass = 'bg-[#FAEEDA] text-[#854F0B]';

          return (
            <div
              key={flight.id}
              onClick={() => onSelect(flight)}
              className={`relative rounded-xl p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-[#1B4FD8] bg-[#E8EDFB]'
                  : 'border border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${badgeClass}`}>
                  {flight.badge}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {flight.airline} {flight.flightNo}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg font-bold text-slate-800">
                    {flight.departTime} &rarr; {flight.arriveTime}
                  </p>
                  <p className="text-sm text-slate-500">
                    {flight.duration}, {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">
                    &#8377;{(flight.totalPrice || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">total</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    &#8377;{(flight.pricePerPerson || 0).toLocaleString()}/person
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
