import React, { useState } from 'react';
import Header from '../components/Header';
import TripGenerationWizard from '../components/copilot/TripGenerationWizard';
import LoadingCopilot from '../components/copilot/LoadingCopilot';
import ItineraryResultView from '../components/copilot/ItineraryResultView';

export default function TravelCopilotPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recordId, setRecordId] = useState(null);

  const handleGenerate = async (formData) => {
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/copilot/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.itinerary) {
        setResult(data.itinerary);
        setRecordId(data.record?.id);
      } else {
        alert("Generation failed: " + data.error);
      }
    } catch (err) {
      alert("Error calling Copilot API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {!loading && !result && (
          <div className="text-center mb-12 animate-fade-in">
            <span className="px-4 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">Wave 1 Feature</span>
            <h1 className="text-5xl font-serif text-gray-900 mb-4">AI Travel Copilot</h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Describe your dream trip and let our AI build a realistic, day-by-day itinerary optimized exactly for your budget.</p>
          </div>
        )}

        {loading ? (
          <LoadingCopilot />
        ) : result ? (
          <ItineraryResultView result={result} recordId={recordId} />
        ) : (
          <TripGenerationWizard onSubmit={handleGenerate} />
        )}
      </main>
    </div>
  );
}
