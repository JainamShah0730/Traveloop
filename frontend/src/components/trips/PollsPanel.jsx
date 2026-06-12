import React, { useState, useEffect } from 'react';
import PollCard from './PollCard';
import CreatePollModal from './CreatePollModal';
import { Plus, X } from 'lucide-react';

export default function PollsPanel({ tripId, onClose }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  const fetchPolls = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/polls/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPolls(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [tripId]);

  const handleVote = async (pollId, optionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ optionId })
      });
      if (res.ok) fetchPolls();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/polls/${pollId}/close`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchPolls();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-50 border-l border-slate-200 shadow-2xl z-[9999] flex flex-col animate-fade-in">
      <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-2xl font-serif text-slate-800">Group Polls</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> New
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-40 bg-white rounded-xl border border-slate-200"></div>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 border-dashed">
            <span className="text-4xl mb-2 block">📊</span>
            <h3 className="text-lg font-medium text-slate-700">No polls yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Create a poll to ask your group about hotels, dates, or activities.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map(poll => (
              <PollCard key={poll.id} poll={poll} currentUserId={currentUserId} onVote={handleVote} onClosePoll={handleClosePoll} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePollModal tripId={tripId} onClose={() => setShowCreate(false)} onCreated={fetchPolls} />
      )}
    </div>
  );
}
