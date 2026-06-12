import React, { useState, useEffect } from 'react';
import ItineraryResultView from './ItineraryResultView';
import FlexibleDatePicker from '../shared/FlexibleDatePicker';
import FlightHotelSelector from './FlightHotelSelector';
import CopilotSavePanel from './CopilotSavePanel';

export default function TripGenerationWizard({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    destination: '',
    duration: 5,
    budget: 30000,
    travelers: 2,
    style: 'balanced'
  });
  
  // States for steps 2 to 5
  const [generatedResult, setGeneratedResult] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  const [selectedDates, setSelectedDates] = useState({ depart: null, return: null });
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get('destination');
    const dur = params.get('duration');
    const bud = params.get('budget');
    
    if (dest || dur || bud) {
      setFormData(prev => ({
        ...prev,
        destination: dest || prev.destination,
        duration: dur ? parseInt(dur, 10) : prev.duration,
        budget: bud ? parseInt(bud, 10) : prev.budget
      }));
      // Auto advance to step 3 if coming from a package customize
      if (dest) {
        // Mocking generation for now if pre-filled, or just let them start at step 1 filled out.
        // The user spec said "Pre-fill from package: copilot opens on step 3 with all fields populated"
        // To do that, we need to generate immediately.
        handleGenerate({ ...formData, destination: dest, duration: dur, budget: bud });
      }
    }
  }, []);

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (step === 1 && !formData.destination) return alert('Please enter a destination');
    if (step < 3) setStep(step + 1);
    else if (step === 3) handleGenerate(formData);
  };

  const handleGenerate = async (dataToGenerate) => {
    setGenerating(true);
    setStep(2); // The generated itinerary is step 2
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/copilot/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dataToGenerate)
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedResult(data.itinerary);
        setRecordId(data.record.id);
        setStep(3); // Wait, itinerary is step 2, but the user views it. The user spec says "Step 2: Reviews AI generated itinerary. Step 3: Flexible Date picker."
        // We will keep them on Step 2 to review, then they click next to go to Step 3.
        setStep(2);
      } else {
        setStep(1);
        alert('Failed to generate itinerary');
      }
    } catch (err) {
      setStep(1);
      alert('Error generating itinerary');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      
      {/* STEPS INDICATOR */}
      <div className="flex justify-between items-center mb-12 max-w-xl mx-auto">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-2 rounded-full flex-1 mx-1 ${step >= i ? 'bg-indigo-600' : 'bg-gray-200'} transition-all duration-300`} />
        ))}
      </div>

      {/* STEP 1: Input Form (Parts 1-3 of original) */}
      {step === 1 && !generating && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-gray-900">Trip Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <input 
                type="text" 
                placeholder="e.g., Goa, Bali, Paris" 
                className="w-full p-4 border rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.destination}
                onChange={e => update('destination', e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                <input 
                  type="number" min="1" max="30"
                  className="w-full p-4 border rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.duration}
                  onChange={e => update('duration', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Travelers</label>
                <input 
                  type="number" min="1" max="20"
                  className="w-full p-4 border rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.travelers}
                  onChange={e => update('travelers', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (INR)</label>
              <input 
                type="number" step="5000"
                className="w-full p-4 border rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.budget}
                onChange={e => update('budget', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Travel Style</label>
              <div className="grid grid-cols-2 gap-4">
                {['balanced', 'adventure', 'relaxation', 'cultural'].map(style => (
                  <button 
                    key={style}
                    onClick={() => update('style', style)}
                    className={`p-3 rounded-xl border text-center capitalize transition-colors ${formData.style === style ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button onClick={() => handleGenerate(formData)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-md">
              Generate Itinerary
            </button>
          </div>
        </div>
      )}

      {/* GENERATING STATE */}
      {generating && (
        <div className="text-center py-24 space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
          </div>
          <h2 className="text-3xl font-serif text-gray-900">Crafting your perfect trip...</h2>
          <p className="text-gray-500">Our AI is fetching flights, analyzing hotels, and planning your days.</p>
        </div>
      )}

      {/* STEP 2+: Always show Itinerary once generated */}
      {generatedResult && !generating && (
        <div className="space-y-8">
          <ItineraryResultView result={generatedResult} />

          {/* STEP 2 ACTION */}
          {step === 2 && (
            <div className="flex justify-center mt-8">
              <button onClick={() => setStep(3)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-medium text-lg hover:bg-indigo-700 shadow-lg animate-bounce">
                Next: Pick Travel Dates &rarr;
              </button>
            </div>
          )}

          {/* STEP 3: Flexible Date Picker */}
          {step >= 3 && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in mt-12">
              <h3 className="text-2xl font-serif text-gray-900 mb-6 text-center">Pick Your Dates</h3>
              <FlexibleDatePicker 
                origin="BOM" // Defaulting to BOM as origin for this demo
                destination={generatedResult.destination}
                tripType="roundtrip"
                onSelectDates={(depart, ret) => setSelectedDates({ depart, return: ret })}
                context="copilot"
              />
              {step === 3 && (
                <div className="flex justify-center mt-8">
                  <button 
                    disabled={!selectedDates.depart}
                    onClick={() => setStep(4)} 
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-medium text-lg hover:bg-indigo-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Flight & Hotel &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Flight & Hotel Selector */}
          {step >= 4 && (
            <div className="mt-12 animate-fade-in">
              <FlightHotelSelector 
                itineraryId={recordId}
                destination={generatedResult.destination}
                origin="BOM"
                budget={generatedResult.budget_total}
                departDate={selectedDates.depart}
                returnDate={selectedDates.return}
                travelers={generatedResult.total_travelers}
                onComplete={(flight, hotel) => {
                  setSelectedFlight(flight);
                  setSelectedHotel(hotel);
                  setStep(5);
                }}
              />
            </div>
          )}

          {/* STEP 5: Save Panel */}
          {step === 5 && (
            <div className="mt-12 animate-fade-in">
              <CopilotSavePanel 
                itineraryId={recordId}
                destination={generatedResult.destination}
                totalBudget={generatedResult.budget_used || generatedResult.budget_total}
                duration={generatedResult.total_days}
                travelers={generatedResult.total_travelers}
                departDate={selectedDates.depart}
                returnDate={selectedDates.return}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
