import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import ExpenseSplitter from './trips/ExpenseSplitter';

const categoryConfig = {
  transport: { name: 'Transport', color: 'bg-blue-500' },
  hotel: { name: 'Hotels', color: 'bg-rose-500' },
  food: { name: 'Cuisine', color: 'bg-amber-400' },
  sightseeing: { name: 'Sightseeing', color: 'bg-emerald-500' },
  shopping: { name: 'Shopping', color: 'bg-purple-500' },
  other: { name: 'Other', color: 'bg-slate-500' }
};

export default function BudgetGauges({ tripId, setCurrentScreen }) {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBudget = async () => {
      if (!tripId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + ''}/api/trips/${tripId}/budget`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch budget details');
        }

        const data = await res.json();
        setBudgetData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!tripId || !budgetData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Trip Selected</h2>
        <button 
          onClick={() => setCurrentScreen('myTrips')}
          className="bg-primary text-white px-6 py-2 rounded-xl"
        >
          Go back to My Trips
        </button>
      </div>
    ); 
  }

  const { total_budget, total_spent, spent_by_category } = budgetData;
  const remaining = total_budget - total_spent;
  const overallPercentage = total_budget > 0 ? Math.min(100, Math.round((total_spent / total_budget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <button 
          onClick={() => setCurrentScreen('myTrips')}
          className="flex items-center text-slate-500 hover:text-primary transition-colors text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to My Trips
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-3xl mx-auto">
        <div className="text-center mb-10 px-2">
          <h2 className="text-xl font-medium text-slate-500 uppercase tracking-widest mb-2">Total Spent</h2>
          <div className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-slate-800 break-all">₹{total_spent.toFixed(2)}</div>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            of ₹{total_budget.toFixed(2)} budget 
            ({remaining >= 0 ? `₹${remaining.toFixed(2)} remaining` : `₹${Math.abs(remaining).toFixed(2)} over budget!`})
          </p>
        </div>

        {/* Overall Progress */}
        <div className="mb-12">
          <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${overallPercentage > 100 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
        </div>

        {spent_by_category.length === 0 ? (
          <div className="text-center text-slate-500 py-8 border-t border-slate-100">
            No expenses recorded yet. Add activities with costs to see the breakdown here.
          </div>
        ) : (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Category Breakdown</h3>
            {spent_by_category.map((cat, idx) => {
              // Calculate percentage relative to the TOTAL BUDGET (or total spent if budget is 0 to avoid Infinity)
              const percentage = total_budget > 0 
                ? Math.round((cat.total / total_budget) * 100) 
                : Math.round((cat.total / total_spent) * 100);
                
              const config = categoryConfig[cat.type] || categoryConfig.other;
              
              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-lg font-semibold text-slate-700">{config.name}</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-slate-800">₹{cat.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${config.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="absolute right-0 -top-8 text-sm font-bold text-slate-500 bg-white px-2 rounded">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto mt-8">
        <ExpenseSplitter tripId={tripId} />
      </div>
    </div>
  );
}
