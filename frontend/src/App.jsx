import { useState, useEffect } from 'react';
import { ItineraryProvider } from './context/ItineraryContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import DashboardHero from './components/DashboardHero';
import ItineraryBuilder from './components/ItineraryBuilder';
import TimelineView from './components/TimelineView';
import BudgetGauges from './components/BudgetGauges';
import FinancialHealthCard from './components/FinancialHealthCard';
import AdminDashboard from './components/AdminDashboard';
import AuthScreen from './components/AuthScreen';
import MyTrips from './components/MyTrips';
import CreateTrip from './components/CreateTrip';
import BuilderScreen from './components/BuilderScreen';
import Community from './components/Community';
import InvoiceScreen from './components/InvoiceScreen';
import PackingList from './components/PackingList';
import TravelNotes from './components/TravelNotes';
import UserProfile from './components/UserProfile';

import DestinationPackagesPage from './pages/DestinationPackagesPage';
import PackageBookingPage from './pages/PackageBookingPage';
import TravelCopilotPage from './pages/TravelCopilotPage';
import TravelAgentPage from './pages/TravelAgentPage';
import PackagesPage from './pages/PackagesPage';
import TravelJournalView from './components/trips/TravelJournalView';
import { Routes, Route } from 'react-router-dom';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setIsAuthChecking(false);
  }, []);

  // 14 screens: dashboard, createTrip, myTrips, builder, itineraryView, citySearch, budget, packing, notes, profile, admin
  
  const renderScreen = () => {
    switch(currentScreen) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <DashboardHero setCurrentScreen={setCurrentScreen} />
            <FinancialHealthCard setCurrentScreen={setCurrentScreen} />
          </div>
        );
      case 'builder':
        return <BuilderScreen tripId={selectedTripId} setCurrentScreen={setCurrentScreen} />;
      case 'community':
        return <Community />;
      case 'budget':
        return <BudgetGauges tripId={selectedTripId} setCurrentScreen={setCurrentScreen} />;
      case 'invoice':
        return <InvoiceScreen tripId={selectedTripId} setCurrentScreen={setCurrentScreen} />;
      case 'packing':
        return <PackingList tripId={selectedTripId} setCurrentScreen={setCurrentScreen} />;
      case 'notes':
        return <TravelNotes tripId={selectedTripId} setCurrentScreen={setCurrentScreen} />;
      case 'journal':
        return <TravelJournalView tripId={selectedTripId} setCurrentScreen={setCurrentScreen} />;
      case 'profile':
      case 'settings':
        return <UserProfile setUser={setUser} setCurrentScreen={setCurrentScreen} />;
      case 'admin':
        return <AdminDashboard />;
      case 'myTrips':
        return <MyTrips setCurrentScreen={setCurrentScreen} setSelectedTripId={setSelectedTripId} />;
      case 'createTrip':
        return <CreateTrip setCurrentScreen={setCurrentScreen} />;
      case 'copilot':
        return <TravelCopilotPage />;
      case 'agent':
        return <TravelAgentPage />;

      default:
        return <div className="p-8 text-center text-slate-500 font-sans">Screen "{currentScreen}" is under construction.</div>;
    }
  };

  if (isAuthChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <ItineraryProvider>
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} setUser={setUser} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/discover" element={<PackagesPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/destinations/:id" element={<DestinationPackagesPage />} />
              <Route path="/destinations/:id/book" element={<PackageBookingPage setCurrentScreen={setCurrentScreen} setSelectedTripId={setSelectedTripId} />} />
              <Route path="/itinerary/:tripId" element={<BuilderScreen setCurrentScreen={setCurrentScreen} />} />
              <Route path="/copilot" element={<TravelCopilotPage />} />
              <Route path="/agent" element={<TravelAgentPage />} />
              <Route path="*" element={renderScreen()} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    </div>
    </ItineraryProvider>
  );
}
