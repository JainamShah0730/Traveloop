import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Check, Plus, Sparkles, Package, ShieldCheck, Luggage, Shirt, FileText, Pill, Backpack, Smartphone, Droplets } from 'lucide-react';

const ICON_MAP = {
  'shirt': Shirt,
  'id': FileText,
  'first-aid-kit': Pill,
  'backpack': Backpack,
  'device-mobile': Smartphone,
  'droplet': Droplets
};
import { getCityImageUrl } from '../utils/cityImages';
import { getTemplateForTrip } from '../data/packingTemplates';

// ─── Fun Messages Based on Progress ──────────────────────────────────────────
function getProgressMessage(pct, mustHavesDone) {
  if (pct === 100) return { text: "You're all set! Have an amazing trip. 🎉", color: 'text-emerald-600' };
  if (mustHavesDone) return { text: "Must-haves done! Don't forget the extras. ✨", color: 'text-indigo-600' };
  if (pct >= 80) return { text: "Almost ready! Just a few more things. 🏁", color: 'text-amber-600' };
  if (pct >= 50) return { text: "Halfway there! Keep going. 💪", color: 'text-sky-600' };
  return { text: "Time to start packing! Your adventure awaits. 🧳", color: 'text-slate-500' };
}

// ─── Confetti Component ──────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const particles = Array.from({ length: 40 });
  const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const dur = 1.5 + Math.random() * 1.5;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-10px',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              backgroundColor: color,
              animation: `confetti-fall ${dur}s ease-in ${delay}s forwards`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function PackingList({ tripId, setCurrentScreen }) {
  const [trip, setTrip] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const prevMustDone = useRef(false);
  const saveTimer = useRef(null);
  const tabsRef = useRef(null);

  // ─── Fetch trip data and init packing list ────────────────────────────────
  useEffect(() => {
    if (!tripId) { setLoading(false); return; }

    const init = async () => {
      try {
        const token = localStorage.getItem('token');

        // 1. Fetch trip
        const tripRes = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!tripRes.ok) throw new Error('Failed to fetch trip');
        const tripData = await tripRes.json();
        setTrip(tripData);

        // 2. Auto-generate base state from template
        const template = getTemplateForTrip(tripData);
        const packingState = template.categories.map(cat => ({
          ...cat,
          items: cat.items.map(item => ({ ...item, packed: false, dbId: null }))
        }));

        // 3. Fetch saved items
        const packRes = await fetch(`http://localhost:3000/api/packing/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const savedItems = packRes.ok ? await packRes.json() : [];

        const missingFromDb = [];

        // 4. Match DB items to template items
        savedItems.forEach(dbItem => {
          let foundInTemplate = false;
          
          for (const cat of packingState) {
            if (cat.name.toLowerCase() === dbItem.category.toLowerCase()) {
              const tmplItem = cat.items.find(i => i.name.toLowerCase() === dbItem.name.toLowerCase());
              if (tmplItem) {
                tmplItem.dbId = dbItem.id;
                tmplItem.id = dbItem.id; // overwrite id so toggle works smoothly
                tmplItem.packed = dbItem.is_checked;
                foundInTemplate = true;
                break;
              }
            }
          }

          // Clean up old dummy data or append real custom items
          if (!foundInTemplate) {
            const isDummy = ['Shirts', 'Jeans', 'Socks', 'Underwear', 'Jacket', 'Comfortable Shoes', 'Sunglasses', 'Toothbrush', 'Toothpaste', 'Shampoo', 'Deodorant', 'Sunscreen', 'Hand Sanitizer', 'Phone Charger', 'Power Bank', 'Camera', 'Headphones', 'Universal Adapter', 'Passport', 'Flight Tickets', 'Hotel Booking', 'Travel Insurance', 'ID Card', 'First Aid Kit', 'Painkillers', 'Prescriptions', 'Vitamins', 'Umbrella', 'Water Bottle', 'Travel Pillow', 'Backpack'].includes(dbItem.name);

            if (isDummy) {
              fetch(`http://localhost:3000/api/packing/${dbItem.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              }).catch(console.error);
            } else {
              const cat = packingState.find(c => c.name.toLowerCase() === dbItem.category.toLowerCase());
              if (cat) {
                cat.items.push({
                  id: dbItem.id,
                  dbId: dbItem.id,
                  name: dbItem.name,
                  must: false,
                  packed: dbItem.is_checked
                });
              } else {
                packingState.push({
                  id: dbItem.category.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                  name: dbItem.category,
                  icon: getCategoryIcon(dbItem.category, null),
                  items: [{
                    id: dbItem.id,
                    dbId: dbItem.id,
                    name: dbItem.name,
                    must: false,
                    packed: dbItem.is_checked
                  }]
                });
              }
            }
          }
        });

        // 5. Track template items not yet saved to DB
        packingState.forEach(cat => {
          cat.items.forEach(item => {
            if (!item.dbId) {
              missingFromDb.push({ catName: cat.name, item });
            }
          });
        });

        setCategories(packingState);
        setActiveCategory(packingState[0]?.id || null);

        // 6. Background save missing items
        if (missingFromDb.length > 0) {
          Promise.allSettled(missingFromDb.map(async req => {
            const res = await fetch(`http://localhost:3000/api/packing/${tripId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: req.item.name, category: req.catName })
            });
            if (res.ok) {
              const saved = await res.json();
              req.item.dbId = saved.id;
              req.item.id = saved.id;
            }
          })).catch(console.error);
        }
      } catch (err) {
        console.error('Packing list init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [tripId]);

  // ─── Helper: get icon for a category name ─────────────────────────────────
  function getCategoryIcon(name, iconString, size = 16) {
    if (iconString && ICON_MAP[iconString]) {
      const Icon = ICON_MAP[iconString];
      return <Icon size={size} />;
    }
    const n = name.toLowerCase();
    let IconComponent = Package;
    if (n.includes('cloth')) IconComponent = Shirt;
    if (n.includes('doc')) IconComponent = FileText;
    if (n.includes('health') || n.includes('med')) IconComponent = Pill;
    if (n.includes('gear')) IconComponent = Backpack;
    if (n.includes('electr')) IconComponent = Smartphone;
    if (n.includes('toilet') || n.includes('bath')) IconComponent = Droplets;
    
    return <IconComponent size={size} />;
  }

  // ─── Bulk save all items to DB ────────────────────────────────────────────
  async function bulkSaveToDb(tId, cats, token) {
    try {
      for (const cat of cats) {
        for (const item of cat.items) {
          await fetch(`http://localhost:3000/api/packing/${tId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name: item.name, category: cat.name })
          });
        }
      }
    } catch (err) {
      console.error('Bulk save error:', err);
    }
  }

  // ─── Toggle item packed state ─────────────────────────────────────────────
  const toggleItem = useCallback(async (categoryId, itemId) => {
    setCategories(prev => {
      const next = prev.map(cat =>
        cat.id === categoryId ? {
          ...cat,
          items: cat.items.map(item =>
            item.id === itemId ? { ...item, packed: !item.packed } : item
          )
        } : cat
      );
      return next;
    });

    // Persist toggle to backend
    try {
      const token = localStorage.getItem('token');
      // Find the item to get its dbId
      const cat = categories.find(c => c.id === categoryId);
      const item = cat?.items.find(i => i.id === itemId);
      const dbId = item?.dbId || itemId;
      await fetch(`http://localhost:3000/api/packing/${dbId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  }, [categories]);

  // ─── Add custom item ──────────────────────────────────────────────────────
  const addCustomItem = async () => {
    if (!customName.trim() || !activeCategory) return;
    const cat = categories.find(c => c.id === activeCategory);
    if (!cat) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/packing/${tripId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: customName.trim(), category: cat.name })
      });
      if (!res.ok) throw new Error('Failed to add item');
      const newItem = await res.json();

      setCategories(prev => prev.map(c =>
        c.id === activeCategory ? {
          ...c,
          items: [...c.items, {
            id: newItem.id,
            dbId: newItem.id,
            name: newItem.name,
            must: false,
            packed: false
          }]
        } : c
      ));

      setCustomName('');
      setAddingCustom(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Computed stats ───────────────────────────────────────────────────────
  const allItems = categories.flatMap(c => c.items);
  const totalItems = allItems.length;
  const packedItems = allItems.filter(i => i.packed).length;
  const progress = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);
  const mustHaves = allItems.filter(i => i.must);
  const mustHavesLeft = mustHaves.filter(i => !i.packed).length;
  const mustHavesDone = mustHaves.length > 0 && mustHavesLeft === 0;
  const msg = getProgressMessage(progress, mustHavesDone);

  // ─── Confetti trigger ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mustHavesDone && !prevMustDone.current && totalItems > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    prevMustDone.current = mustHavesDone;
  }, [mustHavesDone, totalItems]);

  // ─── Active category data ─────────────────────────────────────────────────
  const activeCat = categories.find(c => c.id === activeCategory);
  const mustItems = activeCat?.items.filter(i => i.must) || [];
  const suggestedItems = activeCat?.items.filter(i => !i.must) || [];

  // Sort: unpacked first, packed at bottom
  const sortItems = (items) => [...items].sort((a, b) => (a.packed === b.packed ? 0 : a.packed ? 1 : -1));

  // ─── Hero image ───────────────────────────────────────────────────────────
  const primaryCity = trip?.stops?.[0]?.city_name || trip?.name || 'travel';
  const heroImage = trip?.cover_photo || getCityImageUrl(primaryCity);

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Generating your smart packing list...</p>
      </div>
    );
  }

  if (!tripId || !trip) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Trip Selected</h2>
        <button onClick={() => setCurrentScreen('myTrips')} className="bg-primary text-white px-6 py-2 rounded-xl">
          Go back to My Trips
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Confetti active={showConfetti} />

      {/* Back Button */}
      <button
        onClick={() => setCurrentScreen('myTrips')}
        className="flex items-center text-slate-500 hover:text-primary transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to My Trips
      </button>

      {/* ── Hero Banner ───────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/50">
        <div className="h-48 md:h-56 w-full overflow-hidden">
          <img
            src={heroImage}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-purple-300" />
            <span className="text-purple-200 text-xs font-bold uppercase tracking-widest">Smart Packing List</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">{trip.name}</h1>
          <p className="text-white/70 text-sm">
            {trip.stops?.length || 0} stops · Auto-generated for your trip
          </p>
        </div>
      </div>

      {/* ── Progress Section ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-semibold ${msg.color}`}>{msg.text}</span>
          <span className="text-sm font-bold text-slate-800">{progress}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : progress >= 80
                  ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                  : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
            }}
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <Package size={20} className="mx-auto mb-2 text-slate-400" />
            <p className="text-2xl font-black text-slate-800">{totalItems}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Items</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
            <Check size={20} className="mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-black text-emerald-600">{packedItems}</p>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Packed</p>
          </div>
          <div className={`rounded-xl p-4 text-center border ${mustHavesLeft === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <ShieldCheck size={20} className={`mx-auto mb-2 ${mustHavesLeft === 0 ? 'text-emerald-500' : 'text-rose-400'}`} />
            <p className={`text-2xl font-black ${mustHavesLeft === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{mustHavesLeft}</p>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mustHavesLeft === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Must-haves left</p>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ─────────────────────────────────────────────────────── */}
      <div
        ref={tabsRef}
        className="flex gap-2 flex-wrap pb-2"
      >
        {categories.map(cat => {
          const catPacked = cat.items.filter(i => i.packed).length;
          const catTotal = cat.items.length;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <span className="flex items-center justify-center">{getCategoryIcon(cat.name, cat.icon, 16)}</span>
              <span>{cat.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : catPacked === catTotal && catTotal > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}>
                {catPacked}/{catTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Items List ────────────────────────────────────────────────────────── */}
      {activeCat && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Category header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-purple-600 bg-purple-100 p-2 rounded-xl flex items-center justify-center">
                {getCategoryIcon(activeCat.name, activeCat.icon, 24)}
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{activeCat.name}</h3>
                <p className="text-xs text-slate-400">
                  {activeCat.items.filter(i => i.packed).length} of {activeCat.items.length} packed
                </p>
              </div>
            </div>
            <button
              onClick={() => setAddingCustom(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          {/* Custom item input */}
          {addingCustom && (
            <div className="px-6 py-3 border-b border-slate-100 bg-purple-50/50 flex gap-2 items-center">
              <input
                autoFocus
                type="text"
                placeholder="Item name..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                onClick={addCustomItem}
                disabled={!customName.trim()}
                className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingCustom(false); setCustomName(''); }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Must-have items */}
          {sortItems(mustItems).length > 0 && (
            <div className="px-6 pt-4 pb-2">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck size={12} /> Must-have
              </p>
              <div className="space-y-1">
                {sortItems(mustItems).map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categoryId={activeCat.id}
                    onToggle={toggleItem}
                    badgeType="must"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggested items */}
          {sortItems(suggestedItems).length > 0 && (
            <div className="px-6 pt-4 pb-4">
              <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles size={12} /> Suggested
              </p>
              <div className="space-y-1">
                {sortItems(suggestedItems).map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categoryId={activeCat.id}
                    onToggle={toggleItem}
                    badgeType="suggested"
                  />
                ))}
              </div>
            </div>
          )}

          {activeCat.items.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400">
              <Luggage size={32} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No items in this category yet.</p>
              <p className="text-xs mt-1">Click "Add Item" above to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Item Row Component ──────────────────────────────────────────────────────
function ItemRow({ item, categoryId, onToggle, badgeType }) {
  return (
    <button
      onClick={() => onToggle(categoryId, item.id)}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group text-left ${
        item.packed
          ? 'bg-slate-50 opacity-70 hover:opacity-90'
          : 'hover:bg-purple-50/50'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          item.packed
            ? 'bg-purple-600 border-purple-600 text-white scale-95'
            : 'border-slate-300 group-hover:border-purple-400'
        }`}
      >
        {item.packed && <Check size={14} strokeWidth={3} />}
      </div>

      {/* Name */}
      <span className={`flex-1 text-sm font-medium transition-all ${
        item.packed
          ? 'line-through text-slate-400'
          : 'text-slate-700'
      }`}>
        {item.name}
      </span>

      {/* Badge — only show when not packed */}
      {!item.packed && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${
          badgeType === 'must'
            ? 'bg-rose-100 text-rose-600'
            : 'bg-sky-100 text-sky-600'
        }`}>
          {badgeType === 'must' ? 'Must-have' : 'Suggested'}
        </span>
      )}
    </button>
  );
}
