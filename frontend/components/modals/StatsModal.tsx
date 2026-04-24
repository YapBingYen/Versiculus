import React from 'react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  if (!isOpen) return null;

  // Mock Stats for V1 UI implementation
  const stats = {
    played: 42,
    winRate: 71,
    currentStreak: 5,
    maxStreak: 12
  };

  const distribution = [0, 2, 5, 12, 8, 3];
  const maxDistribution = Math.max(...distribution);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-[#1A1A1B] border border-[#3A3A3C] rounded-t-2xl sm:rounded-lg p-6 max-w-md w-full text-white shadow-2xl transition-transform duration-300 transform translate-y-0" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-bold">Statistics</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {/* Top Stats Row */}
        <div className="flex justify-between text-center mb-8 px-2">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-inter font-bold">{stats.played}</div>
            <div className="text-xs font-inter text-[#818384] mt-1">Played</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-inter font-bold">{stats.winRate}%</div>
            <div className="text-xs font-inter text-[#818384] mt-1">Win Rate</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-inter font-bold">{stats.currentStreak}</div>
            <div className="text-xs font-inter text-[#818384] mt-1 text-center leading-tight">Current<br/>Streak</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-inter font-bold">{stats.maxStreak}</div>
            <div className="text-xs font-inter text-[#818384] mt-1 text-center leading-tight">Max<br/>Streak</div>
          </div>
        </div>

        {/* Guess Distribution */}
        <h3 className="text-lg font-inter font-bold mb-4 uppercase tracking-wide">Guess Distribution</h3>
        <div className="flex flex-col gap-2 mb-8">
          {distribution.map((count, index) => {
            const width = Math.max(7, Math.round((count / maxDistribution) * 100));
            // Highlight the row if it's the current game's win (mocking index 3 for demonstration)
            const isCurrentGame = index === 3; 
            
            return (
              <div key={index} className="flex items-center gap-2 w-full text-sm font-inter font-bold">
                <div className="w-3 text-right">{index + 1}</div>
                <div className="flex-1 h-6">
                  <div 
                    className={`h-full flex items-center justify-end px-2 ${isCurrentGame ? 'bg-[#538D4E]' : 'bg-[#3A3A3C]'}`}
                    style={{ width: `${width}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={onClose} 
          className="w-full py-3 bg-[#3A3A3C] hover:bg-[#565758] transition-colors text-white rounded font-inter font-bold text-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}
