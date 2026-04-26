import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  onOpenHelp?: () => void;
  onOpenStats?: () => void;
  onOpenAuth?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenSettings?: () => void;
  user?: any;
  onLogout?: () => void;
}

export function Header({ onOpenHelp, onOpenStats, onOpenAuth, onOpenLeaderboard, onOpenSettings, user, onLogout }: HeaderProps) {
  return (
    <header className="w-full h-14 flex items-center justify-between px-2 sm:px-4 border-b border-[#3A3A3C] bg-[#121213] sticky top-0 z-10 shadow-sm">
      <div className="flex gap-1 sm:gap-2">
        <button onClick={onOpenHelp} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[#818384] hover:text-white transition-colors rounded-full hover:bg-[#1A1A1B]" aria-label="How to play">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </button>
        
        {/* User / Login Button */}
        {user ? (
          <div className="group relative pb-2">
            <button className="h-8 sm:h-10 px-2 sm:px-3 flex items-center gap-2 text-[#4A90C4] hover:bg-[#1A1A1B] rounded-full transition-colors font-inter font-bold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span className="hidden sm:inline">{user.username}</span>
            </button>
            <div className="absolute top-full left-0 hidden group-hover:flex flex-col bg-[#1A1A1B] border border-[#3A3A3C] rounded shadow-xl w-32 py-1 z-50">
              <button onClick={onLogout} className="px-4 py-2 text-left text-sm text-[#818384] hover:text-white hover:bg-[#3A3A3C]">Log Out</button>
              {user.username === 'admin' && (
                <Link href="/admin" className="px-4 py-2 text-left text-sm text-[#C9A84C] hover:bg-[#3A3A3C]">Admin CMS</Link>
              )}
            </div>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="h-8 sm:h-10 px-3 sm:px-4 flex items-center text-sm font-inter font-bold text-white bg-[#2C5F8A] hover:bg-[#4A90C4] rounded-full transition-colors shadow">
            Log In
          </button>
        )}
      </div>
      
      <Link href="/" className="font-playfair font-bold text-xl sm:text-2xl text-white tracking-wide hover:text-[#C9A84C] transition-colors">
        VERSICULUS
      </Link>
      
      <div className="flex gap-1 sm:gap-2">
        <button onClick={onOpenLeaderboard} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[#818384] hover:text-[#C9A84C] transition-colors rounded-full hover:bg-[#1A1A1B]" title="Leaderboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
        </button>
        <button onClick={onOpenStats} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[#818384] hover:text-white transition-colors rounded-full hover:bg-[#1A1A1B]" aria-label="Statistics">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </button>
        <button onClick={onOpenSettings} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[#818384] hover:text-white transition-colors rounded-full hover:bg-[#1A1A1B]" aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-.33-1.82l.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H21a1.65 1.65 0 0 0 1-1.51V15a2 2 0 0 1-2-2 2 2 0 0 1 2-2v-.09z"></path></svg>
        </button>
      </div>
    </header>
  );
}
