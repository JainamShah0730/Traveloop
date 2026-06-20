import React from 'react';

const fmt = (n) => n != null ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

function BudgetRow({ label, value, bold, isNegative, prefix, confirmed }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-semibold text-base' : 'text-sm'} ${isNegative ? 'text-red-600' : bold ? 'text-slate-800' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span className={`font-medium ${bold ? '' : ''} transition-all duration-300`}>
        {prefix && <span className="mr-0.5">{prefix}</span>}
        {value}
        {confirmed && <span className="text-emerald-500 ml-1">✓</span>}
      </span>
    </div>
  );
}

export default function BudgetAdjustmentCard({ budgetResult, selectedFlight, travelers }) {
  if (!budgetResult || !selectedFlight) return null;

  const {
    breakdown, perPersonBudget, totalPerPerson,
    remainingPerPerson, isOverBudget, overByPerPerson, groupTotals
  } = budgetResult;

  const travelersCount = travelers || budgetResult.travelers || 1;

  return (
    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <span className="font-semibold text-slate-700">Budget updated</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Per person</span>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <BudgetRow
          label={`Flight (${selectedFlight.airline} ${selectedFlight.flightNo})`}
          value={fmt(breakdown.flights)}
          confirmed
        />
        <BudgetRow label="Accommodation"   value={fmt(breakdown.accommodation)} />
        <BudgetRow label="Food & dining"   value={fmt(breakdown.food)} />
        <BudgetRow label="Activities"      value={fmt(breakdown.activities)} />
        <BudgetRow label="Local transport" value={fmt(breakdown.localTransport)} />

        <hr className="border-slate-200 my-3" />

        <BudgetRow label="Total per person" value={fmt(totalPerPerson)} bold />
        <BudgetRow
          label="Remaining per person"
          value={fmt(Math.abs(remainingPerPerson))}
          isNegative={isOverBudget}
          prefix={isOverBudget ? '−' : '+'}
          bold
        />

        {/* Rebalance Note */}
        {budgetResult.rebalanced && budgetResult.rebalanceNote && (
          <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100 flex gap-2">
            <span>ℹ</span>
            <span>{budgetResult.rebalanceNote}</span>
          </p>
        )}

        {/* Over budget warning */}
        {isOverBudget && (
          <p className="text-xs text-red-600 mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
            ⚠ This trip costs {fmt(overByPerPerson)} more <strong>per person</strong> than your budget.
            Try a cheaper date, fewer days, or adjust accommodation.
          </p>
        )}

        {!isOverBudget && (
          <p className="text-xs text-emerald-600 mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
            ✓ Within budget — {fmt(remainingPerPerson)} remaining per person
          </p>
        )}

        {/* Group total — informational, shown separately and smaller */}
        {travelersCount > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Group total for {travelersCount} travelers
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Total for group</span>
              <span className="font-semibold text-slate-800">{fmt(groupTotals.totalForGroup)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              = {fmt(totalPerPerson)} × {travelersCount} people
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
