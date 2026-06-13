import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHero({ setCurrentScreen }) {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-deep group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80" 
          alt="Tropical Beach" 
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative p-8 md:p-12 lg:p-16 flex flex-col items-start justify-center min-h-[320px] md:min-h-[400px]">
        <span className="text-white/80 uppercase tracking-widest text-sm font-semibold mb-4">Plan Your Escape</span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold italic text-white max-w-2xl leading-tight mb-8">
          Discover your next paradise
        </h1>
        
        <button 
          onClick={() => { setCurrentScreen('packages'); navigate('/packages'); }}
          className="bg-secondary text-white px-8 py-4 rounded-full font-medium flex items-center space-x-3 shadow-puffy hover:bg-rose-600 hover:-translate-y-1 transition-all min-h-[44px]"
        >
          <span>Start Exploring</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
