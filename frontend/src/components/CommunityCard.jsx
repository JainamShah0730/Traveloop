import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CommunityCard({ itinerary }) {
  const navigate = useNavigate();
  const [using, setUsing] = useState(false);
  const [used, setUsed] = useState(false);

  const handleUsePlan = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { returnTo: '/packages' } });
      return;
    }

    setUsing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/community/use/${itinerary.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUsed(true);
        // Toast logic could go here, or redirect
        setTimeout(() => {
          navigate('/my-trips');
        }, 1500);
      } else {
        alert('Failed to copy plan.');
      }
    } catch (err) {
      console.error(err);
      alert('Error copying plan.');
    } finally {
      setUsing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-4">
        {itinerary.user?.avatar_url ? (
          <img src={itinerary.user.avatar_url} alt={itinerary.user.name} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <User size={18} />
          </div>
        )}
        <div>
          <div className="text-sm font-bold text-slate-900">{itinerary.user?.name || 'Traveler'}</div>
          <div className="text-xs text-slate-500">Shared recently</div>
        </div>
      </div>

      {/* Destination & Budget */}
      <div className="mb-4">
        <h4 className="text-lg font-bold text-slate-900 mb-1">{itinerary.destination}</h4>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{itinerary.duration} days</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>₹{itinerary.budget?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Days Preview */}
      <div className="space-y-3 mb-6 flex-1">
        {itinerary.dayPreviews?.map((title, index) => (
          <div key={index} className="flex gap-2">
            <div className="text-xs font-bold text-slate-400 mt-0.5 w-10 shrink-0">Day {index + 1}</div>
            <div className="text-sm text-slate-700 font-medium line-clamp-2 leading-snug">{title}</div>
          </div>
        ))}
        {(!itinerary.dayPreviews || itinerary.dayPreviews.length === 0) && (
          <div className="text-sm text-slate-500 italic">No preview available</div>
        )}
      </div>

      {/* Action */}
      <button 
        onClick={handleUsePlan}
        disabled={using || used}
        className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${used ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
      >
        {used ? (
          <><CheckCircle2 size={16} /> Copied to My Trips</>
        ) : using ? (
          <span className="animate-pulse">Copying...</span>
        ) : (
          <>Use this plan <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  );
}
