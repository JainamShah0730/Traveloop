import React, { useState, useEffect } from 'react';
import { Plus, Receipt, UserCheck, X } from 'lucide-react';

export default function ExpenseSplitter({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get trip members to show in balances or when splitting
      const tripRes = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tripRes.ok) {
        const trip = await tripRes.json();
        const mems = [{ id: trip.user_id, ...trip.user }, ...trip.collaborators.map(c => ({ id: c.user.id, ...c.user }))];
        setMembers(mems);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setExpenses(await res.json());
      
      const balRes = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/trip/${tripId}/balances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (balRes.ok) setBalances(await balRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const handleAddExpense = async () => {
    if (!title || !amount) return;
    try {
      const token = localStorage.getItem('token');
      // For simplicity, equally splitting among all members
      const participants = members.map(m => ({ userId: m.id || m.userId }));
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          tripId,
          title,
          amount: Number(amount),
          splitType: 'equal',
          category: 'other',
          participants
        })
      });
      if (res.ok) {
        setShowAdd(false);
        setTitle('');
        setAmount('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif text-slate-800 flex items-center gap-2"><Receipt size={24} className="text-indigo-600"/> Split Expenses</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
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
            expenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-medium text-slate-900">{exp.title}</h4>
                  <p className="text-sm text-slate-500">Paid by {exp.paidById === currentUserId ? 'You' : exp.paidBy?.name || 'Someone'} • {new Date(exp.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-lg">₹{exp.amount.toLocaleString()}</span>
                  <p className="text-xs text-indigo-600 font-medium capitalize mt-1">Equally Split</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2"><UserCheck size={18}/> Balances</h3>
          <div className="space-y-4">
            {balances.length === 0 && <p className="text-sm text-slate-500">No balances yet.</p>}
            {balances.map(b => (
              <div key={b.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-xs">
                    {b.avatar_url ? <img src={b.avatar_url} alt={b.name} /> : (b.name ? b.name[0] : '?')}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{b.userId === currentUserId ? 'You' : b.name}</span>
                </div>
                <span className={`text-sm font-bold ${b.balance > 0 ? 'text-green-600' : b.balance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {b.balance > 0 ? '+' : ''}{Math.abs(b.balance) < 0.01 ? 'Settled' : `₹${Math.abs(Math.round(b.balance)).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 border-2 border-indigo-600 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors">
            Settle Up
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif">Add Expense</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">What was it for?</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Dinner at Beach Club" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Total Amount (₹)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 2500" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
              </div>
              <p className="text-xs text-slate-500 italic">This will be split equally among all trip members.</p>
              <button onClick={handleAddExpense} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 mt-2">
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
