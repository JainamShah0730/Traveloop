import { Home, Compass, Plus, Map, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BottomNav({ currentScreen, setCurrentScreen }) {
  const navigate = useNavigate();

  const handleNav = (screenId) => {
    setCurrentScreen(screenId);
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', icon: Home },
    { id: 'citySearch', icon: Compass },
  ];

  const navItemsRight = [
    { id: 'myTrips', icon: Map },
    { id: 'budget', icon: Wallet },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
      <div className="flex justify-around items-center px-2 py-2 relative">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`}
            >
              <Icon size={24} />
            </button>
          );
        })}

        {/* Center Floating Create Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => handleNav('createTrip')}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-puffy transform transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={28} />
          </button>
        </div>

        {navItemsRight.map(item => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
