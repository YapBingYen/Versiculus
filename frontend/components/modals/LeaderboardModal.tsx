import React, { useEffect, useState } from 'react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Leader {
  username: string;
  max_streak: number;
  games_won: number;
  games_played: number;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('http://localhost:5001/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch leaderboard', err);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#1A1A1B] border border-[#3A3A3C] rounded-lg p-6 max-w-md w-full text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-bold text-[#C9A84C]">Top Believers</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center text-[#818384] py-8 animate-pulse">Loading rankings...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center text-[#818384] py-8">No stats available yet. Be the first to play!</div>
        ) : (
          <div className="flex flex-col gap-3 font-inter">
            <div className="flex justify-between text-xs text-[#818384] border-b border-[#3A3A3C] pb-2 mb-2 px-2">
              <span className="w-8">#</span>
              <span className="flex-1">Player</span>
              <span className="w-16 text-center">Max Streak</span>
              <span className="w-12 text-center">Wins</span>
            </div>
            {leaders.map((leader, i) => (
              <div key={i} className={`flex justify-between items-center py-2 px-2 rounded ${i === 0 ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C]' : 'text-white hover:bg-[#3A3A3C]/50'}`}>
                <span className="w-8 font-bold">{i + 1}</span>
                <span className="flex-1 font-semibold truncate pr-2">{leader.username}</span>
                <span className="w-16 text-center font-bold text-lg">{leader.max_streak}</span>
                <span className="w-12 text-center text-[#818384]">{leader.games_won}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
