import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';
import { generateInvoiceFromTrip } from '../utils/invoiceUtils';

export default function InvoiceScreen({ tripId, setCurrentScreen }) {
  const [trip, setTrip] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch trip for invoice');
        
        let data = await res.json();
        setTrip(data);
        
        // Use the util to generate the invoice purely from the trip's activities
        const travelers = data.travelers || ['James', 'Arjun', 'Jerry', 'Cristina']; // Fallback mockup as per old screen
        const inv = generateInvoiceFromTrip(data, travelers);
        
        setInvoice(inv);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh] text-slate-500">Loading invoice...</div>;
  }

  if (!tripId || !trip || !invoice) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Trip Selected</h2>
        <button onClick={() => setCurrentScreen('myTrips')} className="bg-primary text-white px-6 py-2 rounded-xl">
          Go back to My Trips
        </button>
      </div>
    );
  }

  // Filter line items by search query
  const filteredLineItems = invoice.lineItems.filter(item => 
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.stopCity && item.stopCity.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amt) => amt.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formatINR = (amt) => `₹${amt.toLocaleString('en-IN')}`; // Used for display as per user request

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = invoice.totalBudget > 0 
    ? circumference - (Math.min(invoice.spentPct, 100) / 100) * circumference 
    : circumference;

  let ringFillColor = 'text-slate-300';
  if (invoice.totalBudget > 0) {
    if (invoice.spentPct < 80) ringFillColor = 'text-emerald-500';
    else if (invoice.spentPct <= 100) ringFillColor = 'text-amber-500';
    else ringFillColor = 'text-rose-500';
  }

  const isOverBudget = invoice.remaining < 0;

  // Derive payment status from live invoice state
  const allPaid = invoice.lineItems.length > 0 && invoice.lineItems.every(i => i.isPaid);

  const markActivityPaid = async (activityId) => {
    // 1. Optimistic UI update — mark as paid in local state
    setInvoice(prev => {
      const updatedItems = prev.lineItems.map(item =>
        item.activityId === activityId
          ? { ...item, isPaid: true }
          : item
      );
      const spent = updatedItems
        .filter(i => i.isPaid)
        .reduce((s, i) => s + i.amount, 0);
      const pct = prev.totalBudget > 0
        ? Math.round((spent / prev.totalBudget) * 100) : 0;
      return {
        ...prev,
        lineItems: updatedItems,
        totalSpent: spent,
        spentPct: pct,
        remaining: prev.totalBudget - spent,
        paymentStatus: spent === prev.totalBudget && prev.totalBudget > 0 ? 'PAID' : 'PENDING',
      };
    });

    // 2. Persist to backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/activities/${activityId}/toggle-paid`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark activity as paid:', err);
    }
  };

  const markAllPaid = async () => {
    const unpaidItems = invoice.lineItems.filter(i => !i.isPaid);
    if (unpaidItems.length === 0) return;

    // 1. Optimistic UI update
    setInvoice(prev => {
      const updatedItems = prev.lineItems.map(item => ({ ...item, isPaid: true }));
      const spent = updatedItems.reduce((s, i) => s + i.amount, 0);
      const pct = prev.totalBudget > 0 ? Math.round((spent / prev.totalBudget) * 100) : 0;
      return {
        ...prev,
        lineItems: updatedItems,
        totalSpent: spent,
        spentPct: pct,
        remaining: prev.totalBudget - spent,
        paymentStatus: spent === prev.totalBudget && prev.totalBudget > 0 ? 'PAID' : 'PENDING',
      };
    });

    // 2. Persist all to backend
    try {
      const token = localStorage.getItem('token');
      await Promise.all(unpaidItems.map(item => 
        fetch(`http://localhost:3000/api/activities/${item.activityId}/toggle-paid`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
    } catch (err) {
      console.error('Failed to mark all activities as paid:', err);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)] p-4 md:p-8 text-slate-600 font-sans border border-slate-200 rounded-3xl shadow-sm max-w-6xl mx-auto">
      
      {/* Top Bar matching wireframe */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-6 gap-4">
        <h1 className="text-2xl font-serif font-bold text-slate-800">Traveloop</h1>
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search invoices..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm w-full md:w-64 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button className="border border-slate-200 bg-white px-4 py-2 rounded-full text-sm hover:bg-slate-50 font-medium text-slate-700">Filter</button>
          <button className="border border-slate-200 bg-white px-4 py-2 rounded-full text-sm hover:bg-slate-50 font-medium text-slate-700">Sort ⇅</button>
        </div>
      </div>

      <button onClick={() => setCurrentScreen('myTrips')} className="flex items-center text-primary font-medium hover:underline mb-8 text-sm">
        <ArrowLeft size={16} className="mr-1" /> back to My Trips
      </button>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        
        {/* Main Details Card */}
        <div className="flex-1 border border-slate-200 bg-slate-50/50 rounded-2xl p-6 flex flex-col md:flex-row gap-8 shadow-sm">
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 border border-slate-200 rounded-2xl flex items-center justify-center bg-white overflow-hidden shadow-sm">
              {invoice.tripImage ? (
                <img src={invoice.tripImage} alt="trip" className="w-full h-full object-cover" />
              ) : (
                <div className="text-5xl">🏕️</div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-slate-800 font-bold text-xl mb-1">{invoice.tripTitle}</h2>
              <p className="text-xs text-slate-500 mb-2 font-medium">
                {invoice.dateRange} 
                <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">({invoice.cities} cities)</span>
              </p>
              <p className="text-xs text-slate-500">created by <span className="font-semibold text-slate-700">You</span></p>
            </div>
          </div>
          
          <div className="hidden md:block w-px bg-slate-200"></div>

          <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-2 text-sm pt-2 md:pt-0">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Invoice Id</p>
              <p className="text-slate-800 font-medium">{invoice.invoiceId}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Generated date</p>
              <p className="text-slate-800 font-medium">{invoice.generatedDate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Traveler Details:</p>
              <p className="text-slate-700 font-medium">{invoice.travelers.join(', ')}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2 mt-1">
              <p className="text-slate-500 text-sm font-medium">Payment status -</p>
              {allPaid ? (
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full shadow-sm">Paid</p>
              ) : (
                <p className="text-amber-600 text-xs font-bold uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full shadow-sm">Pending</p>
              )}
            </div>
          </div>
        </div>

        {/* Budget Insights Widget */}
        <div className="w-full lg:w-80 border border-slate-200 bg-white rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Budget Insights</p>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  className={invoice.totalBudget > 0 ? 'text-slate-100' : 'text-slate-200'}
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
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">{invoice.spentPct}%</span>
              </div>
            </div>
            
            <div className="text-sm space-y-2 flex-1">
              <div>
                <span className="text-slate-400 text-xs uppercase font-semibold block">Total Budget</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-800 font-bold">{formatINR(invoice.totalBudget)}</span>
                </div>
              </div>
              <p className="flex flex-col"><span className="text-slate-400 text-xs uppercase font-semibold">Total Spent</span> <span className="text-slate-800 font-bold">{formatINR(invoice.totalSpent)}</span></p>
              <p className="flex flex-col"><span className={`text-xs uppercase font-semibold ${isOverBudget ? 'text-rose-500' : 'text-slate-400'}`}>{isOverBudget ? 'Over budget' : 'Remaining'}</span> <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-emerald-500'}`}>{invoice.totalBudget === 0 ? "—" : (isOverBudget ? formatINR(Math.abs(invoice.remaining)) : formatINR(invoice.remaining))}</span></p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full mt-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex justify-center items-center gap-2"
          >
            {showBreakdown ? 'Hide Full Budget' : 'View Full Budget'}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${showBreakdown ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          {/* Expandable Breakdown Panel */}
          {showBreakdown && (
            <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-500">Budget Used</span>
                    <span className="font-bold text-slate-700">{formatINR(invoice.totalSpent)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${invoice.spentPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(invoice.spentPct, 100)}%` }}
                    ></div>
                  </div>
                </div>
                {isOverBudget && (
                  <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>Over budget by {formatINR(Math.abs(invoice.remaining))}.</span>
                  </div>
                )}
              </div>

              <h5 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wider">Category Spend</h5>
              {Object.keys(invoice.categorySpend).length === 0 ? (
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-xs">
                  No activities added yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-2 font-semibold text-slate-600">Category</th>
                        <th className="p-2 font-semibold text-slate-600 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(invoice.categorySpend)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, total]) => (
                        <tr key={cat}>
                          <td className="p-2 text-slate-700 capitalize">{cat}</td>
                          <td className="p-2 text-slate-800 font-medium text-right">{formatINR(total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 w-12 border-r border-slate-200 text-center">#</th>
              <th className="p-4 w-40 border-r border-slate-200">Category</th>
              <th className="p-4 border-r border-slate-200">Description</th>
              <th className="p-4 w-32 border-r border-slate-200">Qty</th>
              <th className="p-4 w-32 border-r border-slate-200 text-right">Unit Cost</th>
              <th className="p-4 w-32 border-r border-slate-200 text-right">Amount</th>
              <th className="p-4 w-32 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLineItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500 font-medium">No matching items found.</td>
              </tr>
            ) : (
              filteredLineItems.map((act) => (
                <tr key={act.number} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 border-r border-slate-100 text-center text-slate-400 font-medium">{act.number}</td>
                  <td className="p-4 border-r border-slate-100 capitalize font-medium text-slate-700">{act.category}</td>
                  <td className="p-4 border-r border-slate-100 text-slate-600">{act.description} <span className="text-slate-400">({act.stopCity})</span></td>
                  <td className="p-4 border-r border-slate-100 text-slate-500">{act.qty} item</td>
                  <td className="p-4 border-r border-slate-100 text-right text-slate-600 font-medium">{formatINR(act.unitCost)}</td>
                  <td className="p-4 border-r border-slate-100 text-right text-slate-800 font-bold">{formatINR(act.amount)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => markActivityPaid(act.activityId)}
                      disabled={act.isPaid}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        act.isPaid
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
                      }`}
                    >
                      {act.isPaid ? '✅ Paid' : 'Mark Paid'}
                    </button>
                  </td>
                </tr>
              ))
            )}
            
            {/* Empty rows to match design */}
            {Array.from({ length: Math.max(0, 4 - filteredLineItems.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-slate-50 h-14">
                <td className="border-r border-slate-50"></td><td className="border-r border-slate-50"></td><td className="border-r border-slate-50"></td><td className="border-r border-slate-50"></td><td className="border-r border-slate-50"></td><td className="border-r border-slate-50"></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex border-t border-slate-200 bg-slate-50">
          <div className="flex-1 border-r border-slate-200"></div>
          <div className="w-64 p-6 text-sm text-right space-y-3">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">{formatINR(invoice.totalBudget)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Tax (0%)</span>
              <span className="font-semibold">{formatINR(0)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 text-slate-600">
              <span className="font-medium">Discount</span>
              <span className="font-semibold text-slate-400">₹0</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-800 font-bold uppercase tracking-wider text-xs">Grand Total</span>
              <span className="text-indigo-600 font-black text-xl">{formatINR(invoice.totalBudget)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 print:hidden">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <Download size={16} className="text-slate-400" /> Download Invoice
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <FileText size={16} className="text-slate-400" /> Export as PDF
        </button>
        <div className="flex-1"></div>
        <button 
          onClick={markAllPaid}
          disabled={allPaid}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
            allPaid 
              ? 'bg-emerald-100 text-emerald-700 cursor-default' 
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
          }`}
          title={allPaid ? "All items paid" : "Mark all unpaid items as paid"}
        >
          <CheckCircle2 size={18} /> {allPaid ? 'All Paid' : `Mark ${invoice.lineItems.filter(i => !i.isPaid).length} unpaid as paid`}
        </button>
      </div>

    </div>
  );
}
