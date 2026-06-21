import { useState, useEffect } from 'react';
import { Bell, Search, Clock, CheckCheck, Menu, X, Home, Map, Wallet, Briefcase, Users, Receipt, Luggage, FileText, User, Shield, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ currentScreen, setCurrentScreen }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userName, setUserName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "packages", label: "Packages", icon: Luggage },
    { id: "myTrips", label: "My Trips", icon: Map },
    { id: "builder", label: "Itinerary", icon: Briefcase },
    { id: "community", label: "Community", icon: Users },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "invoice", label: "Invoice", icon: Receipt },
    { id: "packing", label: "Packing List", icon: Luggage },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
    { id: "admin", label: "Admin", icon: Shield },
  ];

  const handleScreenChange = (screenId) => {
    setIsMobileMenuOpen(false);
    if (!setCurrentScreen) return;
    setCurrentScreen(screenId);
    if (screenId === "packages") {
      navigate("/packages");
    } else {
      navigate("/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // Load user avatar from localStorage
  const loadUserData = () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setAvatarUrl(u.avatar_url || null);
        setUserName(u.name || '');
      }
    } catch {}
  };

  useEffect(() => {
    loadUserData();
    // Listen for avatar changes from UserProfile
    window.addEventListener('userUpdated', loadUserData);
    return () => window.removeEventListener('userUpdated', loadUserData);
  }, []);
  const screenTitles = {
    dashboard: 'Welcome back, Traveler',
    citySearch: 'Discover Destinations',
    myTrips: 'Your Adventures',
    builder: 'Itinerary Builder',
    itineraryView: 'Trip Timeline',
    budget: 'Financial Overview',
    packing: 'Packing List',
    notes: 'Travel Notes',
    profile: 'Your Profile',
    admin: 'System Dashboard',
    createTrip: 'Plan a New Trip'
  };

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/notes/user/reminders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch reminders', err);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    const handleRemindersUpdated = () => {
      fetchReminders();
    };
    
    window.addEventListener('remindersUpdated', handleRemindersUpdated);
    return () => window.removeEventListener('remindersUpdated', handleRemindersUpdated);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/notes/user/reminders/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowNotifications(false);
      fetchReminders();
      window.dispatchEvent(new Event('remindersUpdated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_read: true })
      });
      fetchReminders();
      window.dispatchEvent(new Event('remindersUpdated'));
    } catch (err) {
      console.error(err);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (setCurrentScreen) setCurrentScreen('packages');
      navigate(`/packages?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 line-clamp-1">
          {screenTitles[currentScreen] || 'Traveloop'}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 min-h-[44px]"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-slate-100 relative min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Bell size={20} className={reminders.length > 0 ? "text-slate-800" : "text-slate-600"} />
            {reminders.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-puffy border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                {reminders.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {reminders.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">No active reminders.</div>
                ) : (
                  reminders.map(rem => (
                    <div key={rem.id} onClick={() => handleMarkRead(rem.id)} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer">
                      <div className="mt-0.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm text-slate-800">{rem.title || 'Untitled Note'}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Trip: {rem.tripName}</p>
                        {rem.reminder_time && (
                          <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                            <Clock size={12} /> {new Date(rem.reminder_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {avatarUrl && avatarUrl.length > 10 ? (
          <img 
            src={avatarUrl} 
            alt={userName || 'User Profile'} 
            onClick={() => { setCurrentScreen && setCurrentScreen('profile'); navigate('/'); }}
            className="w-10 h-10 rounded-full border-2 border-primary/20 cursor-pointer object-cover hover:border-primary transition-colors"
          />
        ) : (
          <div
            onClick={() => { setCurrentScreen && setCurrentScreen('profile'); navigate('/'); }}
            className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors"
          >
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>

      {/* Mobile Full Screen Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col h-screen overflow-y-auto animate-in fade-in slide-in-from-left-4">
          <div className="p-4 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-10">
            <h1 className="text-2xl font-serif font-bold text-blue-600 italic">Traveloop</h1>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleScreenChange(item.id)}
                  className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <Icon size={22} className={isActive ? "text-blue-600" : "text-slate-400"} />
                  <span className="text-lg">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 pb-safe">
            <button
              onClick={() => handleScreenChange("settings")}
              className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-all"
            >
              <Settings size={22} className="text-slate-400" />
              <span className="text-lg">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-all mt-2"
            >
              <LogOut size={22} className="text-red-400" />
              <span className="text-lg">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
