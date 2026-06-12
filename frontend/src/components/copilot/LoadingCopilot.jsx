import React, { useState, useEffect } from 'react';

const MESSAGES = [
  "Analyzing destination...",
  "Finding the best activities...",
  "Calculating realistic budgets...",
  "Building your day-by-day itinerary...",
  "Adding local tips..."
];

export default function LoadingCopilot() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
      <h3 className="text-xl font-medium text-gray-800 animate-pulse">{MESSAGES[index]}</h3>
      <p className="text-sm text-gray-500 mt-2">This usually takes about 10-15 seconds</p>
    </div>
  );
}
