import { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowLeft, Plus, Trash2, Edit3, Save, X, Plane, CheckCircle, Lightbulb, Bell, Clock, CalendarClock, Tag, CheckCheck, BellOff } from 'lucide-react';

const NOTE_TYPES = {
  flights: { color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', label: 'Flights', icon: Plane },
  confirmations: { color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', label: 'Confirmations', icon: CheckCircle },
  ideas: { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: 'Ideas', icon: Lightbulb },
  reminders: { color: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', label: 'Reminders', icon: Clock }
};

export default function TravelNotes({ tripId, setCurrentScreen }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI States
  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Add Note States
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('ideas');
  const [newContent, setNewContent] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  
  // Edit Note States
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('ideas');
  const [editContent, setEditContent] = useState('');
  const [editHasReminder, setEditHasReminder] = useState(false);
  const [editReminderTime, setEditReminderTime] = useState('');

  const toLocalISOString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const fetchNotes = async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/notes/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [tripId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddNote = async () => {
    if (!newContent.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/notes/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newTitle.trim() || null,
          type: newType,
          content: newContent,
          has_reminder: hasReminder,
          reminder_time: hasReminder && reminderTime ? reminderTime : null
        })
      });
      if (!res.ok) throw new Error('Failed to add note');
      
      if (hasReminder) showToast('Reminder added to header bell');
      else showToast('Note saved successfully.');

      setNewTitle('');
      setNewType('ideas');
      setNewContent('');
      setHasReminder(false);
      setReminderTime('');
      setIsAdding(false);
      fetchNotes();
      window.dispatchEvent(new Event('remindersUpdated'));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title || '');
    setEditType(note.type || 'ideas');
    setEditContent(note.content);
    setEditHasReminder(note.has_reminder);
    setEditReminderTime(note.reminder_time ? toLocalISOString(note.reminder_time) : '');
  };

  const handleUpdateNote = async (id) => {
    if (!editContent.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          type: editType,
          content: editContent,
          has_reminder: editHasReminder,
          reminder_time: editHasReminder && editReminderTime ? editReminderTime : null,
          is_read: false
        })
      });
      if (!res.ok) throw new Error('Failed to update note');
      
      setEditingId(null);
      fetchNotes();
      window.dispatchEvent(new Event('remindersUpdated'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotes();
      window.dispatchEvent(new Event('remindersUpdated'));
    } catch (err) {
      alert(err.message);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!tripId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Trip Selected</h2>
        <button onClick={() => setCurrentScreen('myTrips')} className="bg-primary text-white px-6 py-2 rounded-xl">
          Go back to My Trips
        </button>
      </div>
    );
  }

  const unreadReminders = notes.filter(n => n.has_reminder && !n.is_read);
  const filteredNotes = activeFilter === 'all' ? notes : notes.filter(n => n.type === activeFilter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-20">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Nav */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setCurrentScreen('myTrips')}
          className="flex items-center text-slate-500 hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to My Trips
        </button>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">Travel Notes</h2>
          <p className="text-slate-500">Keep track of flights, confirmation numbers, or random ideas.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} /> New Note
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          All
        </button>
        {Object.entries(NOTE_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 border ${
                activeFilter === key 
                  ? `bg-${config.color}-500 text-white border-${config.color}-500` 
                  : `bg-white border-slate-200 ${config.text} hover:${config.bg}`
              }`}
            >
              <Icon size={14} /> {config.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* New Note Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4">
            <input 
              autoFocus
              type="text"
              placeholder="Note Title (Optional)" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0 outline-none"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {Object.entries(NOTE_TYPES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setNewType(key)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors border ${
                  newType === key ? `${config.bg} ${config.text} border-${config.color}-200` : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          <textarea 
            placeholder="Write your details here..." 
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full min-h-[120px] p-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-200 outline-none resize-y mb-4"
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100 w-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${hasReminder ? 'bg-primary' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${hasReminder ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="sr-only" checked={hasReminder} onChange={(e) => setHasReminder(e.target.checked)} />
                  <span className="text-sm font-semibold text-slate-600 flex items-center gap-1"><Bell size={14}/> Reminder</span>
                </label>

                {hasReminder && (
                  <input 
                    type="datetime-local" 
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="text-xs p-1.5 border border-slate-200 rounded-lg outline-none focus:border-primary bg-white text-slate-700"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 pl-2">Reminder appears in the bell icon on the header</p>
            </div>

            <div className="flex justify-end gap-2 w-full sm:w-auto">
              <button 
                onClick={() => { setIsAdding(false); setNewContent(''); setNewTitle(''); setHasReminder(false); }}
                className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddNote}
                disabled={!newContent.trim()}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && !isAdding ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm border-dashed">
          <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">Your notebook is empty.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-2 text-primary font-bold hover:underline"
          >
            Create your first note
          </button>
        </div>
      ) : filteredNotes.length === 0 && !isAdding ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No notes found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => {
            const config = NOTE_TYPES[note.type] || NOTE_TYPES.ideas;
            const TypeIcon = config.icon;

            return (
              <div key={note.id} className={`bg-white p-5 rounded-2xl border-t-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full min-h-[220px] ${config.border} border-x border-b border-x-slate-100 border-b-slate-100`}>
                
                {editingId === note.id ? (
                  <div className="flex flex-col h-full">
                    <input 
                      type="text"
                      placeholder="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full font-bold mb-2 p-2 bg-slate-50 rounded-lg border-none outline-none"
                    />
                    <select 
                      value={editType} 
                      onChange={(e) => setEditType(e.target.value)}
                      className="mb-3 p-1.5 text-xs rounded-lg border border-slate-200 outline-none"
                    >
                      {Object.keys(NOTE_TYPES).map(k => <option key={k} value={k}>{NOTE_TYPES[k].label}</option>)}
                    </select>

                    <textarea 
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-200 outline-none resize-none mb-4 min-h-[100px]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100">
                       <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={editHasReminder} onChange={(e) => setEditHasReminder(e.target.checked)} className="sr-only" />
                        <span className="text-xs font-semibold text-slate-500">Reminder</span>
                      </label>
                      {editHasReminder && (
                        <input type="datetime-local" value={editReminderTime} onChange={(e) => setEditReminderTime(e.target.value)} className="text-xs p-1 border border-slate-200 rounded" />
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200">
                        <X size={16} />
                      </button>
                      <button onClick={() => handleUpdateNote(note.id)} disabled={!editContent.trim()} className="p-2 text-white bg-slate-800 hover:bg-slate-900 rounded-lg disabled:opacity-50">
                        <Save size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
                        <TypeIcon size={12} /> {config.label}
                      </span>
                      
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 bg-white rounded-lg shadow-sm border border-slate-100 p-1">
                        <button onClick={() => startEditing(note)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {note.title && <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{note.title}</h3>}
                    
                    <div className="whitespace-pre-wrap text-slate-600 text-sm leading-relaxed flex-1">
                      {note.content}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
                      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                      <span className={`flex items-center gap-1 ${note.has_reminder ? (note.is_read ? 'text-slate-400' : 'text-rose-500 font-bold') : 'text-slate-300'}`}>
                        {note.has_reminder ? <Bell size={14} fill="currentColor" /> : <BellOff size={14} />}
                        {note.has_reminder && note.reminder_time ? new Date(note.reminder_time).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
