import React, { useState } from 'react';
import { X, Plus, Trash } from 'lucide-react';

export default function CreatePollModal({ tripId, onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('custom');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));
  const updateOption = (idx, val) => {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  };

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      return alert("Question and at least 2 options are required.");
    }
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tripId, question, type, options: validOptions })
      });
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        alert("Error creating poll");
      }
    } catch (err) {
      alert("Error creating poll");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif text-gray-900">Create a Poll</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input type="text" placeholder="e.g., Which hotel should we book?" value={question} onChange={e => setQuestion(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="destination">Destination</option>
              <option value="hotel">Hotel</option>
              <option value="activity">Activity</option>
              <option value="date">Date</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => updateOption(idx, e.target.value)} className="w-full border p-2 rounded-lg outline-none focus:border-indigo-500" />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(idx)} className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button onClick={addOption} className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                <Plus size={16} /> Add Option
              </button>
            )}
          </div>

          <button onClick={handleCreate} disabled={creating} className="w-full py-3 mt-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-sm transition-colors">
            {creating ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </div>
    </div>
  );
}
