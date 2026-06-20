import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function InvoiceScreen({ tripId, setCurrentScreen }) {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [tripId]);

  async function fetchInvoice() {
    if (!tripId) {
      setLoading(false);
      return;
    }
    try {
      const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const res = await fetch(`${API_URL}/api/invoice/trip/${tripId}`, authHeaders);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch invoice');
      }
      const data = await res.json();
      setInvoiceData(data);
    } catch (err) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh] text-slate-500">Loading invoice...</div>;
  }

  if (error || !invoiceData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{error || "No Trip Selected"}</h2>
        <button onClick={() => setCurrentScreen('myTrips')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl">
          Go back to My Trips
        </button>
      </div>
    );
  }

  const { trip, travelers, expenses, summary, perTraveler } = invoiceData;
  const percentSpent = summary.percentSpent;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = summary.totalBudget > 0 
    ? circumference - (Math.min(percentSpent, 100) / 100) * circumference 
    : circumference;

  let ringFillColor = 'text-slate-300';
  if (summary.totalBudget > 0) {
    if (percentSpent < 80) ringFillColor = 'text-emerald-500';
    else if (percentSpent <= 100) ringFillColor = 'text-amber-500';
    else ringFillColor = 'text-rose-500';
  }

  const isOverBudget = summary.remaining < 0;

  // Filter expenses
  const filteredExpenses = expenses.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)] p-4 md:p-8 text-slate-600 font-sans border border-slate-200 rounded-3xl shadow-sm max-w-6xl mx-auto">
      
      {/* Top Bar matching wireframe */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-6 gap-4">
        <h1 className="text-2xl font-serif font-bold text-slate-800">Traveloop</h1>
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search expenses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm w-full md:w-64 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button onClick={() => setCurrentScreen('myTrips')} className="flex items-center text-indigo-600 font-medium hover:underline mb-8 text-sm">
        <ArrowLeft size={16} className="mr-1" /> back to My Trips
      </button>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        
        {/* Main Details Card */}
        <div className="flex-1 border border-slate-200 bg-slate-50/50 rounded-2xl p-6 flex flex-col md:flex-row gap-8 shadow-sm">
          <div className="flex flex-col justify-center">
            <h2 className="text-slate-800 font-bold text-xl mb-1">{trip.name}</h2>
            <p className="text-xs text-slate-500 mb-2 font-medium">
              {new Date(trip.startDate || trip.start_date).toLocaleDateString()} - {new Date(trip.endDate || trip.end_date).toLocaleDateString()}
            </p>
          </div>
          
          <div className="hidden md:block w-px bg-slate-200"></div>

          <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-2 text-sm pt-2 md:pt-0">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Invoice Id</p>
              <p className="text-slate-800 font-medium">{invoiceData.invoiceId}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Generated date</p>
              <p className="text-slate-800 font-medium">{new Date(invoiceData.generatedDate).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">TRAVELER DETAILS</p>
              <p className="text-slate-700 font-medium">
                {travelers.map(t => t.name).join(', ')} 
                <span className="text-slate-400 ml-2">({travelers.length} {travelers.length === 1 ? 'traveler' : 'travelers'})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Budget Insights Widget */}
        <div className="w-full lg:w-80 border border-slate-200 bg-white rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">BUDGET INSIGHTS</p>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  className={summary.totalBudget > 0 ? 'text-slate-100' : 'text-slate-200'}
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                />
                <circle
                  className={`${ringFillColor} transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                  style={{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">{percentSpent}%</span>
              </div>
            </div>
            
            <div className="text-sm space-y-2 flex-1">
              <div>
                <span className="text-slate-400 text-xs uppercase font-semibold block">Total budget</span>
                <span className="text-slate-800 font-bold">₹{summary.totalBudget.toLocaleString('en-IN')}</span>
              </div>
              <p className="flex flex-col">
                <span className="text-slate-400 text-xs uppercase font-semibold">Total spent</span> 
                <span className={`font-bold ${summary.totalSpent > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                  ₹{summary.totalSpent.toLocaleString('en-IN')}
                </span>
              </p>
              <p className="flex flex-col">
                <span className="text-slate-400 text-xs uppercase font-semibold">Remaining</span> 
                <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-emerald-500'}`}>
                  ₹{Math.abs(summary.remaining).toLocaleString('en-IN')}
                  {isOverBudget && <span className="text-[10px] ml-1 uppercase">(over budget)</span>}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Per-traveler summary */}
        <div className="border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Per traveler summary</h3>
          <div className="space-y-4">
            {perTraveler.map(({ traveler, totalPaid, totalOwes, netBalance }) => (
              <div key={traveler.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="font-medium text-slate-800 mb-1 sm:mb-0">
                  {traveler.name}{traveler.isOwner ? ' (You)' : ''}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <div className="text-slate-500">Paid: <span className="font-medium text-slate-700">₹{totalPaid.toLocaleString('en-IN')}</span></div>
                  <div className="text-slate-500">Share: <span className="font-medium text-slate-700">₹{totalOwes.toLocaleString('en-IN')}</span></div>
                  <div className={`font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {netBalance >= 0
                      ? `Gets back ₹${netBalance.toLocaleString('en-IN')}`
                      : `Owes ₹${Math.abs(netBalance).toLocaleString('en-IN')}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by category */}
        <div className="border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Spending by category</h3>
          <div className="space-y-3">
            {Object.keys(summary.byCategory).length === 0 ? (
              <p className="text-sm text-slate-500">No expenses yet.</p>
            ) : (
              Object.entries(summary.byCategory).map(([cat, amount]) => (
                <div key={cat} className="flex items-center gap-3 text-sm">
                  <span className="w-24 font-medium text-slate-600 capitalize">{cat}</span>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.min((amount / summary.totalSpent) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-semibold text-slate-800">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Expense list */}
      <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm mb-8">
        <table className="w-full text-sm text-left min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 border-r border-slate-200">Date</th>
              <th className="p-4 border-r border-slate-200">Title</th>
              <th className="p-4 border-r border-slate-200">Category</th>
              <th className="p-4 border-r border-slate-200">Paid By</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No expenses found.</td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 border-r border-slate-100 text-slate-500">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 border-r border-slate-100 text-slate-700 font-medium">
                    {exp.title}
                  </td>
                  <td className="p-4 border-r border-slate-100 text-slate-600 capitalize">
                    {exp.category}
                  </td>
                  <td className="p-4 border-r border-slate-100 text-slate-600">
                    {exp.paidBy?.name || 'Unknown'}
                  </td>
                  <td className="p-4 text-right text-slate-800 font-bold">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-4 print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Download size={16} /> Download Invoice
        </button>
      </div>

    </div>
  );
}
