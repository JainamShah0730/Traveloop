import { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, LogOut, Camera, MapPin, Check, Loader2, X } from 'lucide-react';

export default function UserProfile({ setUser, setCurrentScreen }) {
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/trips', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
        }
      } catch (err) {
        console.error('Failed to fetch trips for profile', err);
      }
    };

    fetchTrips();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setUser) setUser(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 2MB.');
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Resize image to max 256x256 for storage efficiency
      const resized = await resizeImage(base64, 256);

      // Upload to backend
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/auth/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: resized })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      
      // Update local state + localStorage
      const updatedUser = { ...userData, avatar_url: resized };
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Notify other components (like Header) that avatar changed
      window.dispatchEvent(new Event('userUpdated'));

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload photo: ' + err.message);
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/auth/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: '' })
      });

      const updatedUser = { ...userData, avatar_url: null };
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (err) {
      console.error('Failed to remove avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  if (!userData) return null;

  const hasAvatar = userData.avatar_url && userData.avatar_url.length > 10;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">My Profile</h2>
        <p className="text-slate-500">Manage your personal information and account settings.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10 items-start">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4 w-full md:w-auto">
          <div className="relative group">
            {/* Avatar circle */}
            <div 
              className="w-32 h-32 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md overflow-hidden cursor-pointer"
              onClick={handleAvatarClick}
            >
              {hasAvatar ? (
                <img 
                  src={userData.avatar_url} 
                  alt={userData.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                userData.name ? userData.name.charAt(0).toUpperCase() : 'U'
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {uploading ? (
                  <Loader2 size={28} className="text-white animate-spin" />
                ) : (
                  <Camera size={28} className="text-white" />
                )}
              </div>
            </div>

            {/* Camera button */}
            <button 
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-slate-200 shadow-sm text-slate-500 hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : uploadSuccess ? (
                <Check size={18} className="text-emerald-500" />
              ) : (
                <Camera size={18} />
              )}
            </button>

            {/* Remove button (only if avatar exists) */}
            {hasAvatar && !uploading && (
              <button
                onClick={handleRemoveAvatar}
                className="absolute top-0 right-0 p-1.5 bg-white rounded-full border border-slate-200 shadow-sm text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors"
                title="Remove photo"
              >
                <X size={14} />
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Upload hint */}
          <p className="text-xs text-slate-400 text-center max-w-[140px]">
            {uploading ? 'Uploading…' : uploadSuccess ? 'Photo updated!' : 'Click to change photo'}
          </p>

          <span className="text-sm font-medium text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-lg">
            {userData.role || 'Traveler'}
          </span>
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                <User size={14} /> Full Name
              </label>
              <input 
                type="text" 
                readOnly 
                value={userData.name || ''} 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                <Mail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                readOnly 
                value={userData.email || ''} 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="font-semibold text-slate-700">Account Actions</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setCurrentScreen('admin')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium flex-1"
              >
                <Shield size={16} /> Admin Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium flex-1 border border-red-100"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Sections matching wireframe */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const preplanned = trips.filter(t => new Date(t.end_date) >= today);
        const previous = trips.filter(t => new Date(t.end_date) < today);

        const renderMiniCard = (trip) => (
          <div key={trip.id} className="w-48 flex-shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-64">
            <div className="h-32 bg-slate-200 relative">
              {trip.cover_photo ? (
                <img src={trip.cover_photo} alt={trip.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <MapPin className="text-slate-300 w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{trip.name}</h4>
              <button 
                onClick={() => {
                  setCurrentScreen('myTrips');
                }}
                className="mt-auto w-full py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        );

        return (
          <div className="space-y-8 pt-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Preplanned Trips</h3>
              {preplanned.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {preplanned.map(renderMiniCard)}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No preplanned trips.</div>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Previous Trips</h3>
              {previous.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {previous.map(renderMiniCard)}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No previous trips.</div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}

/**
 * Resize an image (base64 data URL) to fit within maxSize x maxSize pixels.
 * Returns a new base64 data URL (JPEG, quality 0.85).
 */
function resizeImage(base64, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      // Only resize if larger than maxSize
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = base64;
  });
}
