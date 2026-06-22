import { Bot, User, Plane, Cloud, Building2, MapPin, Wallet, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TOOL_BADGES = {
  search_flights: { label: 'Flights', icon: Plane, color: 'bg-sky-100 text-sky-700' },
  get_weather: { label: 'Weather', icon: Cloud, color: 'bg-amber-100 text-amber-700' },
  search_hotels: { label: 'Hotels', icon: Building2, color: 'bg-violet-100 text-violet-700' },
  get_route: { label: 'Routes', icon: MapPin, color: 'bg-emerald-100 text-emerald-700' },
  predict_budget: { label: 'Budget', icon: Wallet, color: 'bg-rose-100 text-rose-700' }
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.error;
  const [isSaving, setIsSaving] = useState(false);

  const contentLower = (message.content || '').toLowerCase();
  const isFullPlan = message.role === 'assistant' && (
    contentLower.includes('budget') || 
    contentLower.includes('day 1') || 
    contentLower.includes('itinerary') || 
    contentLower.includes('day-by-day') ||
    contentLower.includes('pro tips')
  );

  async function handleSaveAsTrip() {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/copilot/save-from-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentResponse: message.content })
      });
      if (res.ok) {
        alert('Trip saved to My Trips!');
      } else {
        alert('Failed to save trip');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving trip');
    } finally {
      setIsSaving(false);
    }
  }

  const MarkdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-800 mt-5 mb-3" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-4 mb-2 pb-1 border-b border-slate-100" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-base font-semibold text-slate-700 mt-3 mb-1" {...props} />,
    p: ({node, ...props}) => <p className="text-sm text-slate-700 my-2 leading-relaxed" {...props} />,
    ul: ({node, ...props}) => <ul className="space-y-1 my-2 ml-4 list-disc marker:text-blue-400" {...props} />,
    ol: ({node, ...props}) => <ol className="space-y-1 my-2 ml-4 list-decimal marker:text-blue-400" {...props} />,
    li: ({node, ...props}) => <li className="text-sm text-slate-700 pl-1" {...props} />,
    strong: ({node, ...props}) => <strong className="font-semibold text-slate-800" {...props} />,
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-slate-200">
        <table className="w-full text-sm text-left border-collapse" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200" {...props} />,
    tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-100" {...props} />,
    tr: ({node, ...props}) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
    th: ({node, ...props}) => <th className="px-4 py-3 font-semibold whitespace-nowrap" {...props} />,
    td: ({node, ...props}) => <td className="px-4 py-3 text-slate-700" {...props} />,
    a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-slate-600 my-3" {...props} />,
  };

  // Convert Indian Rupee format before passing to markdown parser
  // to ensure amounts are always styled clearly
  const formatRupees = (text) => {
    if (!text) return text;
    return text.replace(/(₹[\d,]+)/g, '**$1**');
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4 animate-fade-in`}>
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
          : isError
            ? 'bg-gradient-to-br from-red-400 to-red-500'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600'
      }`}>
        {isUser
          ? <User size={16} className="text-white" />
          : <Bot size={16} className="text-white" />
        }
      </div>

      {/* Message content */}
      <div className={`max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        {/* Tool badges (only for assistant messages) */}
        {!isUser && message.toolsCalled && message.toolsCalled.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[...new Set(message.toolsCalled)].map(tool => {
              const badge = TOOL_BADGES[tool];
              if (!badge) return null;
              const Icon = badge.icon;
              return (
                <span key={tool} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                  <Icon size={12} />
                  {badge.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm overflow-hidden ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-md'
            : isError
              ? 'bg-red-50 border border-red-200 rounded-tl-md'
              : 'bg-white border border-slate-200 rounded-tl-md'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : isError ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={16} />
              {message.content}
            </div>
          ) : (
            <div className="agent-response prose-sm max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={MarkdownComponents}
              >
                {formatRupees(message.content)}
              </ReactMarkdown>

              {isFullPlan && (
                <button 
                  onClick={handleSaveAsTrip} 
                  disabled={isSaving}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save this trip →'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
