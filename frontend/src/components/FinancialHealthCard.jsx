import { TrendingUp, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FinancialHealthCard({ setCurrentScreen }) {
  const [percentage, setPercentage] = useState(0);
  const [tripName, setTripName] = useState('your upcoming trips');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const trips = await res.json();
          const upcoming = trips
            .filter(t => new Date(t.start_date) > new Date())
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];

          if (upcoming) {
            setTripName(upcoming.name);
            if (upcoming.total_budget > 0) {
               let cost = upcoming.total_activities_cost || 0;
               let totalBudget = upcoming.total_budget * (upcoming.travelersCount || 1);
               let pct = Math.round((cost / totalBudget) * 100);
               if (pct > 100) pct = 100;
               setPercentage(pct);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      onClick={() => setCurrentScreen && setCurrentScreen('budget')}
      className="bg-primary rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-puffy relative overflow-hidden cursor-pointer hover:bg-blue-700 transition-colors"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>

      <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
        <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">Financial Health</h3>
        {loading ? (
          <div className="h-4 bg-white/20 rounded w-48 animate-pulse mb-4"></div>
        ) : (
          <p className="text-white/80 max-w-sm mb-4">
            You have allocated {percentage}% of the budget for {tripName}.
          </p>
        )}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
          <Wallet size={16} />
          <span>Keep your expenses tracked!</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center">
        {/* SVG Circular Progress */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            className="text-white/20"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="64"
            cy="64"
          />
          <circle
            className="text-white transition-all duration-1000 ease-out"
            strokeWidth="8"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="64"
            cy="64"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: loading ? circumference : strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{loading ? '-' : percentage}%</span>
          <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Budgeted</span>
        </div>
      </div>
    </div>
  );
}
