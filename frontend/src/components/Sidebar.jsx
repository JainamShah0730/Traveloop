import {
  Home,
  Compass,
  Map,
  Wallet,
  Briefcase,
  User,
  Settings,
  Shield,
  LogOut,
  Luggage,
  FileText,
  Receipt,
  Users,
  Sparkles,
  Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  currentScreen,
  setCurrentScreen,
  setUser,
}) {
  const navigate = useNavigate();

  // SAFE NAVIGATION ITEMS
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "copilot", label: "AI Copilot", icon: Sparkles },
    { id: "agent", label: "AI Agent", icon: Bot },
    { id: "packages", label: "Packages", icon: Luggage },
    { id: "myTrips", label: "My Trips", icon: Map },
    { id: "builder", label: "Itinerary", icon: Briefcase },
    { id: "community", label: "Community", icon: Users },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "invoice", label: "Invoice", icon: Receipt },
    { id: "packing", label: "Packing List", icon: Luggage },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "profile", label: "Profile", icon: User },

    // OPTIONAL ADMIN
    { id: "admin", label: "Admin", icon: Shield },
  ];

  // SAFE SCREEN CHANGE — also resets URL so React Router falls back to the wildcard route
  const handleScreenChange = (screenId) => {
    try {
      if (!setCurrentScreen) return;

      setCurrentScreen(screenId);

      // "packages" and "agent" have their own routes
      if (screenId === "packages") {
        navigate("/packages");
      } else if (screenId === "agent") {
        navigate("/agent");
      } else {
        // Reset URL to root so the wildcard <Route path="*"> renders via currentScreen
        navigate("/");
      }
    } catch (err) {
      console.error("Navigation Error:", err);
    }
  };

  // SAFE LOGOUT
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (setUser) {
        setUser(null);
      }

      // OPTIONAL RELOAD
      window.location.reload();

    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto">

      {/* LOGO */}
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-serif font-bold text-blue-600 italic">
          Traveloop
        </h1>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-4 space-y-2">

        {navItems.map((item) => {

          const Icon = item.icon;

          const isActive =
            currentScreen === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                handleScreenChange(item.id)
              }
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] ${isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
            >

              {/* ICON */}
              <Icon
                size={20}
                className={
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400"
                }
              />

              {/* LABEL */}
              <span className="truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-100 space-y-2">

        {/* SETTINGS */}
        <button
          type="button"
          onClick={() =>
            handleScreenChange("settings")
          }
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all min-h-[48px] ${currentScreen === "settings"
              ? "bg-blue-50 text-blue-600 font-semibold"
              : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Settings
            size={20}
            className={
              currentScreen === "settings"
                ? "text-blue-600"
                : "text-slate-400"
            }
          />

          <span>Settings</span>
        </button>

        {/* LOGOUT */}
        {typeof setUser === "function" && (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all min-h-[48px]"
          >
            <LogOut
              size={20}
              className="text-red-400"
            />

            <span>Log Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}