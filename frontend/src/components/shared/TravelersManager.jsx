import React, { useState, useEffect } from 'react';
import { Users, UserPlus, X, Phone, Mail, User } from 'lucide-react';
import './TravelersManager.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function TravelersManager({ contextId, contextType, onTravelersChange, onTravelersDataChange, readOnly = false }) {
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [showMealRegenBanner, setShowMealRegenBanner] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    mealPref: '',
    seatPref: ''
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch travelers
  useEffect(() => {
    // If there is no real context ID yet (e.g. mock package viewing), operate in local mode
    if (!contextId || contextId.startsWith('mock-') || contextId.length < 10) {
      setIsLocalMode(true);
      // Try to mock the owner if we can, or just start empty
      const localTravelers = [{
        id: 'local-0',
        isOwner: true,
        name: 'You (Owner)',
        email: 'your@email.com'
      }];
      setTravelers(localTravelers);
      onTravelersChange?.(1);
      onTravelersDataChange?.(localTravelers);
      setLoading(false);
      return;
    }

    const fetchTravelers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const queryParam = contextType === 'itinerary' ? `itineraryId=${contextId}` :
                           contextType === 'package' ? `packageId=${contextId}` :
                           `tripId=${contextId}`;

        const res = await fetch(`${API_BASE}/api/travelers?${queryParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch travelers');
        const data = await res.json();
        setTravelers(data.travelers || []);
        onTravelersChange?.((data.travelers || []).length);
        onTravelersDataChange?.(data.travelers || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelers();
  }, [contextId, contextType]);

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Invalid email address";
    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 120) return "Age must be between 1 and 120";
    }
    return null;
  };

  const handleAddTraveler = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (travelers.length >= 12) {
      setFormError("Maximum 12 travelers allowed");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    if (isLocalMode) {
      // Local mode add
      const newTraveler = {
        id: `local-${Date.now()}`,
        isOwner: false,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age
      };
      const updated = [...travelers, newTraveler];
      setTravelers(updated);
      onTravelersChange?.(updated.length);
      onTravelersDataChange?.(updated);
      setShowAddForm(false);
      setFormData({ name: '', email: '', phone: '', age: '', mealPref: '', seatPref: '' });
      setIsSubmitting(false);
      return;
    }

    // API add
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        [contextType === 'itinerary' ? 'itineraryId' : contextType === 'package' ? 'packageId' : 'tripId']: contextId
      };

      const res = await fetch(`${API_BASE}/api/travelers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add traveler');

      const updated = [...travelers, data.traveler];
      setTravelers(updated);
      onTravelersChange?.(updated.length);
      onTravelersDataChange?.(updated);
      setShowAddForm(false);
      setFormData({ name: '', email: '', phone: '', age: '', mealPref: '', seatPref: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTraveler = async (id) => {
    if (isLocalMode) {
      const updated = travelers.filter(t => t.id !== id);
      setTravelers(updated);
      onTravelersChange?.(updated.length);
      onTravelersDataChange?.(updated);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/travelers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to remove traveler');

      const updated = travelers.filter(t => t.id !== id);
      setTravelers(updated);
      onTravelersChange?.(updated.length);
      onTravelersDataChange?.(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMealPrefChange = async (travelerId, newPref) => {
    if (isLocalMode) {
      const updated = travelers.map(t => t.id === travelerId ? { ...t, mealPref: newPref } : t);
      setTravelers(updated);
      onTravelersChange?.(updated.length);
      onTravelersDataChange?.(updated);
      setShowMealRegenBanner(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/travelers/${travelerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mealPref: newPref })
      });

      if (!res.ok) throw new Error('Failed to update meal preference');
      
      const updated = travelers.map(t => t.id === travelerId ? { ...t, mealPref: newPref } : t);
      setTravelers(updated);
      onTravelersDataChange?.(updated);
      
      if (contextType === 'itinerary') {
        setShowMealRegenBanner(true);
      }
    } catch (err) {
      console.error(err);
      alert('Could not update meal preference');
    }
  };

  const handleRegenerateMeals = async () => {
    setRegenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/copilot/${contextId}/regenerate-meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ travelers })
      });

      if (!res.ok) throw new Error('Failed to regenerate meals');
      const data = await res.json();
      
      // Update day cards in parent with new meals
      // Assuming onTravelersDataChange or a specific prop handles this.
      // We will need to pass this up or rely on the parent fetching again.
      // Actually, we'll dispatch an event or use a window callback if there's no prop for onMealsUpdated
      // Or we can add an onMealsUpdated prop
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('meals-updated', { detail: data.updatedData }));
      }
      
      setShowMealRegenBanner(false);
      alert('Meal suggestions updated for your group preferences.');
    } catch (err) {
      console.error(err);
      alert('Could not update meals. Try again.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm py-4">Loading travelers...</div>;

  return (
    <div className="travelers-manager bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Travelers</h3>
        </div>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
          {travelers.length} / 12
        </span>
      </div>

      {showMealRegenBanner && (
        <div className="bg-orange-50 border-b border-orange-100 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <span className="text-sm text-orange-800 font-medium">
            Meal preference updated. Regenerate meal suggestions to match?
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerateMeals}
              disabled={regenerating}
              className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {regenerating ? 'Updating meals...' : 'Update meals in itinerary'}
            </button>
            <button 
              onClick={() => setShowMealRegenBanner(false)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {travelers.map(traveler => (
          <div key={traveler.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 shrink-0">
                {getInitials(traveler.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{traveler.name}</span>
                  {traveler.isOwner && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">You</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Mail size={10} /> {traveler.email}</span>
                  {traveler.phone && <span className="flex items-center gap-1"><Phone size={10} /> {traveler.phone}</span>}
                  {readOnly ? (
                    traveler.mealPref && traveler.mealPref !== 'any' && (
                      <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize">{traveler.mealPref} meal</span>
                    )
                  ) : (
                    <select 
                      value={traveler.mealPref || 'any'} 
                      onChange={(e) => handleMealPrefChange(traveler.id, e.target.value)}
                      className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded text-[10px] font-semibold capitalize border border-orange-200 outline-none cursor-pointer"
                    >
                      <option value="any">Any meal</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-veg</option>
                      <option value="jain">Jain</option>
                      <option value="vegan">Vegan</option>
                    </select>
                  )}
                  {traveler.seatPref && traveler.seatPref !== 'any' && (
                    <span className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize">{traveler.seatPref} seat</span>
                  )}
                </div>
              </div>
            </div>
            
            {!readOnly && !traveler.isOwner && (
              <button 
                onClick={() => handleRemoveTraveler(traveler.id)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                title="Remove traveler"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        {!readOnly && travelers.length < 12 && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl flex justify-center items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm bg-slate-50/50 hover:bg-indigo-50/30"
          >
            <UserPlus size={16} /> Add Traveler
          </button>
        )}

        {showAddForm && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-slate-700 text-sm">Add New Traveler</h4>
              <button onClick={() => { setShowAddForm(false); setFormError(null); }} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
            </div>
            
            {formError && <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{formError}</div>}
            
            <form onSubmit={handleAddTraveler} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                  <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="25" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Meal Preference</label>
                  <select value={formData.mealPref} onChange={e => setFormData({...formData, mealPref: e.target.value})} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">No preference</option>
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-vegetarian</option>
                    <option value="jain">Jain</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Seat Preference</label>
                  <select value={formData.seatPref} onChange={e => setFormData({...formData, seatPref: e.target.value})} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">No preference</option>
                    <option value="window">Window</option>
                    <option value="aisle">Aisle</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Adding...' : 'Add Traveler'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
