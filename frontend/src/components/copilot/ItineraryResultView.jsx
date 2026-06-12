import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ItineraryResultView({ result, recordId }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <h1 className="text-4xl font-serif text-gray-900 mb-2">{result.destination}</h1>
        <p className="text-gray-500 text-lg mb-6">{result.total_days} Days • {result.total_travelers} Travelers • ₹{(result.budget_used || 0).toLocaleString()} Total</p>
        
        {result.budget_note && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm mb-6 max-w-2xl mx-auto border border-amber-100">
            {result.budget_note}
          </div>
        )}
      </div>

      {/* Budget Breakdown */}
      {result.cost_breakdown && result.budget_used > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-serif mb-6">Budget Breakdown</h3>
          <div className="flex h-6 rounded-full overflow-hidden mb-4">
            <div style={{width: `${(result.cost_breakdown.flights/result.budget_used)*100}%`}} className="bg-blue-500" title="Flights"></div>
            <div style={{width: `${(result.cost_breakdown.accommodation/result.budget_used)*100}%`}} className="bg-indigo-500" title="Accommodation"></div>
            <div style={{width: `${(result.cost_breakdown.food/result.budget_used)*100}%`}} className="bg-green-500" title="Food"></div>
            <div style={{width: `${(result.cost_breakdown.activities/result.budget_used)*100}%`}} className="bg-yellow-500" title="Activities"></div>
            <div style={{width: `${(result.cost_breakdown.local_transport/result.budget_used)*100}%`}} className="bg-purple-500" title="Transport"></div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Flights: ₹{(result.cost_breakdown.flights || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Hotels: ₹{(result.cost_breakdown.accommodation || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Food: ₹{(result.cost_breakdown.food || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Activities: ₹{(result.cost_breakdown.activities || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Transport: ₹{(result.cost_breakdown.local_transport || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Itinerary Days */}
      <div className="space-y-6">
        {(result.days || []).map((day, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-100"></div>
            <div className="pl-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase mb-1 block">Day {day.day}</span>
                  <h3 className="text-2xl font-serif text-gray-900">{day.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-medium text-gray-900">₹{(day.day_total || 0).toLocaleString()}</span>
                  <span className="block text-xs text-gray-500">Day budget</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {day.morning?.activity && (
                    <div className="border-l-2 border-orange-200 pl-4">
                      <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider block mb-1">Morning</span>
                      <p className="text-gray-800 font-medium">{day.morning.activity}</p>
                      <p className="text-sm text-gray-500 mt-1">₹{day.morning.cost} • {day.morning.tip}</p>
                    </div>
                  )}
                  {day.afternoon?.activity && (
                    <div className="border-l-2 border-blue-200 pl-4">
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block mb-1">Afternoon</span>
                      <p className="text-gray-800 font-medium">{day.afternoon.activity}</p>
                      <p className="text-sm text-gray-500 mt-1">₹{day.afternoon.cost} • {day.afternoon.tip}</p>
                    </div>
                  )}
                  {day.evening?.activity && (
                    <div className="border-l-2 border-indigo-200 pl-4">
                      <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider block mb-1">Evening</span>
                      <p className="text-gray-800 font-medium">{day.evening.activity}</p>
                      <p className="text-sm text-gray-500 mt-1">₹{day.evening.cost} • {day.evening.tip}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                  {day.hotel?.name && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Stay</span>
                      <p className="text-gray-800 font-medium">{day.hotel.name} {day.hotel.rating ? <span className="text-yellow-500">{'★'.repeat(Math.round(day.hotel.rating))}</span> : ''}</p>
                      <p className="text-sm text-gray-500">₹{day.hotel.cost_per_night} / night</p>
                    </div>
                  )}
                  {day.meals && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Meals (₹{day.meals.total_food_cost || 0})</span>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li><span className="font-medium text-gray-700">B:</span> {day.meals.breakfast}</li>
                        <li><span className="font-medium text-gray-700">L:</span> {day.meals.lunch}</li>
                        <li><span className="font-medium text-gray-700">D:</span> {day.meals.dinner}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Packing & Tips */}
      <div className="grid md:grid-cols-2 gap-6">
        {result.tips && result.tips.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-serif mb-4 flex items-center gap-2">💡 Local Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {result.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-indigo-500">•</span> {t}</li>)}
            </ul>
          </div>
        )}
        {result.packing_essentials && result.packing_essentials.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-serif mb-4 flex items-center gap-2">🎒 Packing Essentials</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {result.packing_essentials.map((t, i) => <li key={i} className="flex gap-2"><span className="text-indigo-500">✓</span> {t}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
