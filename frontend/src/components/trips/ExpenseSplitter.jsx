import React, { useState, useEffect } from 'react';
import { Plus, Receipt, UserCheck, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ExpenseSplitter({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  };

  const fetchData = async () => {
    try {
      // Fetch trip details to get travelers (now from tripTraveler indirectly, or we can use the trip members endpoint)
      const tripRes = await fetch(`${API_URL}/api/trips/${tripId}`, authHeaders);
      if (tripRes.ok) {
        const data = await tripRes.json();
        // Here we map collaborators/user to travelers, but since our new backend logic uses TripTraveler table directly,
        // we might want a new endpoint or just use the balances endpoint which returns travelers.
      }

      const expensesRes = await fetch(`${API_URL}/api/expenses/trip/${tripId}`, authHeaders);
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData.expenses || expensesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId, refreshTrigger]);

  const handleSaved = () => {
    setShowAdd(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif text-slate-800 flex items-center gap-2">
          <Receipt size={24} className="text-indigo-600"/> Split Expenses
        </h2>
        <button 
          onClick={() => setShowAdd(true)} 
          className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-medium text-slate-700 mb-4">Recent Expenses</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-slate-100 rounded-xl"></div>
              <div className="h-16 bg-slate-100 rounded-xl"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No expenses added yet.
            </div>
          ) : (
            expenses.map(exp => <ExpenseCard key={exp.id} expense={exp} />)
          )}
        </div>

        {/* Balances Panel */}
        <BalancesPanel 
          tripId={tripId} 
          authHeaders={authHeaders} 
          refreshTrigger={refreshTrigger} 
          onTravelersLoaded={setTravelers} 
        />
      </div>

      {showAdd && (
        <AddExpenseModal 
          tripId={tripId} 
          travelers={travelers} 
          onSave={handleSaved} 
          onClose={() => setShowAdd(false)} 
          authHeaders={authHeaders}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ExpenseCard Component
// -------------------------------------------------------------
function ExpenseCard({ expense }) {
  const paidByLabel = expense.paidBy?.isOwner
    ? 'Paid by You'
    : `Paid by ${expense.paidBy?.name || 'Unknown'}`;

  const dateStr = expense.date ? new Date(expense.date).toLocaleDateString() : 'No date';

  return (
    <div className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
      <div>
        <h4 className="font-medium text-slate-900">{expense.title}</h4>
        <div className="text-sm text-slate-500">
          {paidByLabel} · {dateStr} · <span className="capitalize">{expense.category}</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Split: {expense.participants?.map(p => p.traveler?.name).join(', ')}
        </div>
      </div>
      <div className="text-right">
        <span className="font-bold text-slate-900 text-lg">
          ₹{(expense.amount || 0).toLocaleString('en-IN')}
        </span>
        <div className="text-xs text-indigo-600 font-medium mt-1">
          {expense.splitType === 'equal' ? 'Equally Split' : 'Custom Split'}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// BalancesPanel Component
// -------------------------------------------------------------
function BalancesPanel({ tripId, authHeaders, refreshTrigger, onTravelersLoaded }) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, [tripId, refreshTrigger]);

  async function fetchBalances() {
    try {
      const res = await fetch(`${API_URL}/api/expenses/trip/${tripId}/balances`, authHeaders);
      if (res.ok) {
        const data = await res.json();
        const balancesData = data.balances || data;
        setBalances(balancesData);
        if (onTravelersLoaded) {
          onTravelersLoaded(balancesData.map(b => b.traveler));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
      <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
        <UserCheck size={18}/> Balances
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 rounded-lg"></div>
          <div className="h-8 bg-slate-200 rounded-lg"></div>
        </div>
      ) : balances.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">Add travelers to this trip to see balances.</p>
      ) : (
        <div className="space-y-4">
          {balances.map(({ traveler, balance, status }) => {
            if (!traveler) return null;
            return (
              <div key={traveler.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-xs">
                    {traveler.name ? traveler.name.substring(0, 2).toUpperCase() : '?'}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {traveler.name}
                    {traveler.isOwner && <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">You</span>}
                  </span>
                </div>
                
                <div className={`text-sm font-bold text-right`}>
                  {status === 'settled' && (
                    <span className="text-slate-400">Settled</span>
                  )}
                  {status === 'to_receive' && (
                    <span className="text-green-600">
                      Gets back ₹{balance.toLocaleString('en-IN')}
                    </span>
                  )}
                  {status === 'owes' && (
                    <span className="text-red-600">
                      Owes ₹{Math.abs(balance).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settle Up button — only show if anyone owes */}
      {balances.some(b => b.status === 'owes') && (
        <button 
          onClick={() => alert("Settle up logic not fully implemented in UI")} 
          className="w-full mt-6 py-2 border-2 border-indigo-600 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Settle Up
        </button>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// AddExpenseModal Component
// -------------------------------------------------------------
function AddExpenseModal({ tripId, travelers, onSave, onClose, authHeaders }) {
  const [form, setForm] = useState({
    title:             '',
    amount:            '',
    category:          'other',
    paidByTravelerId:  travelers.find(t => t.isOwner)?.id || (travelers[0]?.id || ''),
    splitType:         'equal',
    customShares:      travelers.map(t => ({ travelerId: t.id, share: 0 }))
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (form.splitType === 'equal' && form.amount) {
      const share = Math.round((parseFloat(form.amount) / travelers.length) * 100) / 100;
      setForm(f => ({
        ...f,
        customShares: travelers.map(t => ({ travelerId: t.id, share }))
      }));
    }
  }, [form.amount, form.splitType, travelers]);

  async function handleSave() {
    if (travelers.length === 0) {
      setError('Add travelers first');
      return;
    }
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!form.paidByTravelerId) { setError('Select who paid'); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.headers
        },
        body: JSON.stringify({
          tripId,
          title:            form.title.trim(),
          amount:           parseFloat(form.amount),
          category:         form.category,
          paidByTravelerId: form.paidByTravelerId,
          splitType:        form.splitType,
          customShares:     form.splitType !== 'equal' ? form.customShares : undefined
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save expense');
      }
      
      onSave();
    } catch (e) {
      setError(e.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif">Add Expense</h3>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full">
            <X size={20}/>
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Expense title *</label>
            <input
              type="text"
              placeholder="e.g. Dinner at Eiffel Tower"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                min="1"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Category</label>
              <select 
                value={form.category} 
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-white"
              >
                <option value="hotel">Hotel</option>
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="activity">Activity</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Paid by */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Paid by *</label>
            <select
              value={form.paidByTravelerId}
              onChange={e => setForm({ ...form, paidByTravelerId: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-white"
            >
              {travelers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.isOwner ? ' (You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split type */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Split</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200">
              {['equal', 'percentage', 'custom'].map(type => (
                <button
                  key={type}
                  className={`flex-1 py-2 text-sm font-medium ${
                    form.splitType === type 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setForm({ ...form, splitType: type })}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Split preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">Split among:</div>
            <div className="space-y-2">
              {travelers.map(t => {
                const share = form.customShares.find(s => s.travelerId === t.id);
                return (
                  <div key={t.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-700">
                      {t.name}{t.isOwner ? ' (You)' : ''}
                    </span>
                    
                    {form.splitType === 'equal' && (
                      <span className="font-medium text-slate-900">
                        ₹{share?.share?.toLocaleString('en-IN') || '0'}
                      </span>
                    )}
                    
                    {form.splitType === 'custom' && (
                      <div className="flex items-center">
                        <span className="text-slate-400 mr-2">₹</span>
                        <input
                          type="number"
                          className="w-20 p-1 text-right border border-slate-200 rounded outline-none focus:border-indigo-500"
                          value={share?.share || ''}
                          onChange={e => {
                            const updated = form.customShares.map(s =>
                              s.travelerId === t.id
                                ? { ...s, share: parseFloat(e.target.value) || 0 }
                                : s
                            );
                            setForm({ ...form, customShares: updated });
                          }}
                        />
                      </div>
                    )}
                    
                    {form.splitType === 'percentage' && (
                      <div className="flex items-center">
                        <input
                          type="number"
                          className="w-16 p-1 text-right border border-slate-200 rounded outline-none focus:border-indigo-500"
                          placeholder="0"
                          value={share?.percentage || ''}
                          onChange={e => {
                            const updated = form.customShares.map(s =>
                              s.travelerId === t.id
                                ? { ...s, percentage: parseFloat(e.target.value) || 0 }
                                : s
                            );
                            setForm({ ...form, customShares: updated });
                          }}
                        />
                        <span className="text-slate-400 ml-2">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 text-slate-600 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
