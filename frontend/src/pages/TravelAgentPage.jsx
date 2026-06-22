import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Plane, Cloud, Building2, Wallet, Compass } from 'lucide-react';
import MessageBubble from '../components/agent/MessageBubble';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LOADING_MESSAGES = [
  { text: 'Searching flights...', icon: Plane },
  { text: 'Checking weather forecast...', icon: Cloud },
  { text: 'Finding best hotels...', icon: Building2 },
  { text: 'Calculating your budget...', icon: Wallet },
  { text: 'Building your itinerary...', icon: Compass }
];

const SUGGESTION_CHIPS = [
  'Plan a 7-day Bali trip for 2, ₹1.5L budget, leaving Mumbai',
  'Is ₹50,000 enough for 5 days in Goa?',
  'What\'s the best time to visit Japan?',
  'Optimize my Paris itinerary for less walking'
];

export default function TravelAgentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  // Build conversation history for multi-turn
  function getConversationHistory() {
    return messages
      .filter(m => !m.error)
      .map(m => ({
        role: m.role,
        content: m.content
      }));
  }

  async function sendMessage(messageText) {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setLoadingIdx(0);

    try {
      // 1. Start the job
      const startRes = await fetch(`${API_URL}/api/agent/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: text,
          conversationHistory: getConversationHistory()
        })
      });

      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${startRes.status}`);
      }

      const { jobId } = await startRes.json();

      // 2. Poll for result every 2 seconds
      let result = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 90; // 3 minutes max

      while (!result && attempts < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;

        const pollRes = await fetch(`${API_URL}/api/agent/job/${jobId}`, {
          headers: getAuthHeaders()
        });

        if (!pollRes.ok) continue;

        const data = await pollRes.json();

        if (data.status === 'completed') {
          result = data;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Agent processing failed');
        }
        // else: still pending/processing — keep polling
      }

      if (!result) {
        throw new Error('Request timed out — please try again');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.response,
        toolsCalled: result.toolsCalled
      }]);
    } catch (err) {
      console.error('Agent chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.message || 'Sorry, I ran into an issue. Please try again.',
        error: true
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const LoadingIcon = LOADING_MESSAGES[loadingIdx].icon;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center py-6 shrink-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-200 mb-3">
          <Bot size={28} />
        </div>
        <h1 className="text-2xl font-serif font-bold text-slate-800">Travel Agent</h1>
        <p className="text-slate-500 text-sm mt-1">Tell me where you want to go — I'll handle everything.</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 scroll-smooth" id="agent-messages">
        {/* Empty state — suggestion chips */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-6">
              <Sparkles size={36} className="text-violet-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">What are you planning?</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-sm text-center">
              I can search flights, check weather, find hotels, and build a full itinerary — all from a single message.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {SUGGESTION_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(chip)}
                  className="text-left px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 transition-all text-sm text-slate-600 hover:text-violet-700 shadow-sm hover:shadow-md group"
                >
                  <span className="text-violet-400 group-hover:text-violet-600 mr-1.5">→</span>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 mb-4 animate-fade-in">
            <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Bot size={16} className="text-white animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <LoadingIcon size={14} className="text-violet-500" />
                  {LOADING_MESSAGES[loadingIdx].text}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 p-3 md:p-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            placeholder="Tell me about your trip..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            id="agent-input"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium hover:from-violet-600 hover:to-indigo-700 transition-all shadow-md shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 shrink-0"
            id="agent-send-btn"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
