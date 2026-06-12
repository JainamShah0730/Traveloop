import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Share2, ArrowLeft } from 'lucide-react';

export default function TravelJournalView({ tripId, setCurrentScreen }) {
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchJournal = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journals/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setJournal(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchJournal();
  }, [tripId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journals/generate/${tripId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJournal(data.journal);
      } else {
        alert("Error generating journal");
      }
    } catch (err) {
      alert("Error generating journal");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journals`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tripId,
          title: journal.title,
          story: journal.story,
          isPublished: journal.isPublished || false
        })
      });
      if (res.ok) {
        const savedJournal = await res.json();
        setJournal(savedJournal);
        setIsEditing(false);
      } else {
        alert("Failed to save journal");
      }
    } catch (err) {
      alert("Error saving journal");
    } finally {
      setSaving(false);
    }
  };

  if (!tripId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Trip Selected</h2>
        <button onClick={() => setCurrentScreen('myTrips')} className="bg-primary text-white px-6 py-2 rounded-xl">Go back to My Trips</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <button 
          onClick={() => setCurrentScreen('myTrips')}
          className="flex items-center text-slate-500 hover:text-primary transition-colors text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to My Trips
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[60vh] relative overflow-hidden">
        {loading ? (
          <div className="animate-pulse space-y-4 pt-10">
            <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
            <div className="h-64 bg-slate-100 rounded-xl mt-8"></div>
          </div>
        ) : (!journal && !isEditing) ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={48} className="text-indigo-500" />
            </div>
            <h2 className="text-3xl font-serif text-slate-800 mb-4">Travel Journal</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
              Write your own beautiful story or let our AI magically read your itinerary, notes, and expenses to write a personalized story of your trip.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mx-auto max-w-md">
              <button 
                onClick={handleGenerate} 
                disabled={generating}
                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-lg flex items-center justify-center gap-2 shadow-md"
              >
                {generating ? <span className="animate-pulse">Writing...</span> : <><Sparkles size={20} /> Generate with AI</>}
              </button>
              <button 
                onClick={() => {
                  setJournal({ title: 'My Trip Story', story: '' });
                  setIsEditing(true);
                }} 
                disabled={generating}
                className="w-full bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-medium hover:bg-slate-50 transition-colors text-lg flex items-center justify-center gap-2 shadow-sm"
              >
                ✍️ Write my own
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-8 border-b border-slate-100 gap-4">
              <div className="flex-1 w-full">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold tracking-wider uppercase mb-4 inline-block">My Story</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={journal.title}
                    onChange={(e) => setJournal({...journal, title: e.target.value})}
                    className="w-full text-3xl md:text-4xl font-serif font-bold text-slate-900 leading-tight bg-transparent border-b border-indigo-200 focus:border-indigo-600 focus:outline-none pb-2 transition-colors"
                    placeholder="Journal Title"
                  />
                ) : (
                  <h1 className="text-4xl font-serif font-bold text-slate-900 leading-tight">{journal.title}</h1>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="p-3 bg-slate-50 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit Journal">
                    ✍️
                  </button>
                )}
                {isEditing && (
                  <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    {saving ? 'Saving...' : 'Save Journal'}
                  </button>
                )}
                {!isEditing && (
                  <button className="p-3 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                    <Share2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={journal.story}
                onChange={(e) => setJournal({...journal, story: e.target.value})}
                className="w-full h-[500px] p-6 border border-indigo-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 focus:outline-none resize-y text-lg text-slate-700 leading-relaxed bg-white/50"
                placeholder="Start writing your story here..."
              />
            ) : (
              <div className="prose prose-lg prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {journal.story}
              </div>
            )}

            {!isEditing && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <button 
                  onClick={handleGenerate} 
                  disabled={generating}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                >
                  <Sparkles size={16} /> {generating ? 'Rewriting...' : 'Rewrite Story with AI'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
