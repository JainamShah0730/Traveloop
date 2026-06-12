import React, { useState } from 'react';

export default function PollCard({ poll, currentUserId, onVote, onClosePoll }) {
  const [selectedOption, setSelectedOption] = useState(null);
  
  const totalVotes = poll.votes ? poll.votes.length : 0;
  const userHasVoted = poll.votes ? poll.votes.some(v => v.userId === currentUserId) : false;
  
  const handleVote = () => {
    if (selectedOption) onVote(poll.id, selectedOption);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium text-lg text-gray-900">{poll.question}</h3>
        {poll.status === 'open' && poll.createdBy === currentUserId && (
          <button onClick={() => onClosePoll(poll.id)} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors">Close</button>
        )}
        {poll.status === 'closed' && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Closed</span>
        )}
      </div>

      <div className="space-y-3">
        {poll.options.map(opt => {
          const optVotes = opt.votes ? opt.votes.length : 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100);
          const isWinner = poll.status === 'closed' && optVotes > 0 && optVotes === Math.max(...poll.options.map(o => o.votes ? o.votes.length : 0));

          return (
            <div key={opt.id} className="relative">
              <button
                disabled={poll.status === 'closed' || userHasVoted}
                onClick={() => setSelectedOption(opt.id)}
                className={`w-full relative z-10 flex justify-between p-3 rounded-lg border text-sm transition-all ${selectedOption === opt.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'} ${isWinner ? 'border-green-500 bg-green-50 text-green-900 font-medium' : ''} ${poll.status === 'closed' ? 'cursor-default' : ''}`}
              >
                <span>{opt.label} {isWinner && '👑'}</span>
                {userHasVoted || poll.status === 'closed' ? (
                  <span className="text-gray-500">{percentage}% ({optVotes})</span>
                ) : null}
              </button>
              {(userHasVoted || poll.status === 'closed') && (
                <div 
                  className={`absolute top-0 left-0 h-full rounded-lg opacity-20 ${isWinner ? 'bg-green-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {poll.status === 'open' && !userHasVoted && (
        <button 
          onClick={handleVote} 
          disabled={!selectedOption}
          className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${selectedOption ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          Submit Vote
        </button>
      )}
      
      <p className="text-xs text-gray-400 mt-4 text-center">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total</p>
    </div>
  );
}
