import React from 'react';
import {
  calcTotalBudget,
  calcTotalSpent,
  calcRemaining,
  calcSpentPercent
} from '../utils/budgetUtils';

export default function BudgetInsights({ stops }) {
  const totalBudget  = calcTotalBudget(stops);
  const totalSpent   = calcTotalSpent(stops);
  const remaining    = calcRemaining(stops);
  const spentPercent = calcSpentPercent(stops);

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mt-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider text-center">BUDGET INSIGHTS</h2>

      <div className="flex flex-col md:flex-row items-center justify-around gap-8">
        {/* Circle/donut chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-100"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-blue-600 transition-all duration-1000 ease-out"
              strokeWidth="10"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
              style={{
                strokeDasharray: 251.2,
                strokeDashoffset: 251.2 - (spentPercent / 100) * 251.2,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xl font-bold text-slate-800">{spentPercent}%</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Spent</span>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col justify-center space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">TOTAL BUDGET</span>
            <span className="text-lg font-bold text-slate-800">{fmt(totalBudget)}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">TOTAL SPENT</span>
            <span className="text-lg font-bold text-slate-800">{fmt(totalSpent)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">REMAINING</span>
            <span className={`text-lg font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {fmt(remaining)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
          View Full Budget ↓
        </button>
      </div>
    </div>
  );
}
