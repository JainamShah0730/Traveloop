import { TrendingUp } from 'lucide-react';

export default function FinancialHealthCard({ setCurrentScreen }) {
  const percentage = 85;
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
        <p className="text-white/80 max-w-sm mb-4">You are on track with your saving goals for your upcoming trip.</p>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
          <TrendingUp size={16} />
          <span>+12% vs last month</span>
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
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{percentage}%</span>
          <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Funded</span>
        </div>
      </div>
    </div>
  );
}
