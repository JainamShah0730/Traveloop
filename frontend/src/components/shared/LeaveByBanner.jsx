import React from 'react';
import { format, subDays } from 'date-fns';

export default function LeaveByBanner({ leaveByInfo, selectedFlight, departDate }) {
  if (!leaveByInfo || !selectedFlight) return null;

  const { leaveByDisplay, isEarlyMorning, departDisplay } = leaveByInfo;

  // Determine if it's the "night before" based on if the leave by time hour is early AM or late PM
  const dateStr = isEarlyMorning 
    ? '— this is the night before your flight' 
    : `on ${format(departDate, 'MMM d')}`;

  if (isEarlyMorning) {
    return (
      <div className="mt-4 bg-[#FAEEDA] border-l-4 border-[#854F0B] p-4 rounded-r-lg flex gap-3">
        <span className="text-xl leading-none pt-1">⚠️</span>
        <div>
          <p className="font-bold text-[#854F0B]">
            Leave home by {leaveByDisplay} {dateStr}
          </p>
          <p className="text-sm text-[#854F0B]/80 mt-1">
            Your flight departs at {departDisplay}. Consider staying near the airport.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-[#E8EDFB] border-l-4 border-[#1B4FD8] p-4 rounded-r-lg flex gap-3">
      <span className="text-xl leading-none pt-1">🕐</span>
      <div>
        <p className="font-bold text-[#185FA5]">
          Leave home by {leaveByDisplay} {dateStr}
        </p>
        <p className="text-sm text-[#185FA5]/80 mt-1">
          Your flight departs at {departDisplay} &middot; Allow 3.5 hrs for airport check-in
        </p>
      </div>
    </div>
  );
}
