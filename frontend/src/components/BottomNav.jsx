import { Home, Compass, Map, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BottomNav({ currentScreen, setCurrentScreen }) {
  const navigate = useNavigate();

  const handleNav = (screenId) => {
    setCurrentScreen(screenId);
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', icon: Home },
    { id: 'discover', icon: Compass },
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
