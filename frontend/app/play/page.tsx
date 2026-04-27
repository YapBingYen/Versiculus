'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { VerseHeader } from '../../components/game/VerseHeader';
import { GameGrid } from '../../components/game/GameGrid';
import { WordInput } from '../../components/input/WordInput';
import { Keyboard } from '../../components/input/Keyboard';
import { HowToPlayModal } from '../../components/modals/HowToPlayModal';
import { StatsModal } from '../../components/modals/StatsModal';
import { AuthModal } from '../../components/modals/AuthModal';
import { LeaderboardModal } from '../../components/modals/LeaderboardModal';
import { SettingsModal } from '../../components/modals/SettingsModal';
import { Toast } from '../../components/ui/Toast';
import { useGame } from '../../hooks/useGame';
import { useAuth, User } from '../../hooks/useAuth';
import { DailyVerse } from '../../types/game';
import { generateShareText } from '../../lib/shareGrid';

// MOCK VERSE FOR DEVELOPMENT
const MOCK_VERSE: DailyVerse = {
  id: 1,
  reference: "John 3:16",
  fullText: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  keyWords: ["world", "Son", "believes", "perish"],
  maskedText: "For God so loved the [_____], that he gave his one and only [___], that whoever [________] in him shall not [______] but have eternal life.",
  translation: 'NIV',
  difficulty: 1
};

export default function PlayPage() {
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  // V2 Settings State
  const [hardMode, setHardMode] = useState(false);
  const [translation, setTranslation] = useState('NIV');

  // Load from localStorage on mount to prevent SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHardMode = localStorage.getItem('versiculus_hardMode');
      if (savedHardMode !== null) setHardMode(savedHardMode === 'true');
      
      const savedTranslation = localStorage.getItem('versiculus_translation');
      if (savedTranslation) setTranslation(savedTranslation);
    }
    setIsReady(true);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('versiculus_hardMode', String(hardMode));
      localStorage.setItem('versiculus_translation', translation);
    }
  }, [hardMode, translation, isReady]);

  // Fetch the daily verse from the backend on mount
  useEffect(() => {
    if (!isReady) return;
    setIsLoading(true);
    fetch(`https://versiculus.onrender.com/api/daily?translation=${translation}&difficulty=${hardMode ? 3 : 1}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch daily verse');
        return res.json();
      })
      .then(data => {
        setDailyVerse(data);
        
        // Sync frontend settings with what the backend actually returned
        if (data.translation) {
          setTranslation(data.translation);
        }
        if (data.difficulty !== undefined) {
          setHardMode(data.difficulty === 3);
        }
        
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Backend not reachable, falling back to mock verse.', err);
        setDailyVerse(MOCK_VERSE); // Fallback to mock verse for development/demo
        setIsLoading(false);
      });
  }, [translation, hardMode, isReady]);

  if (isLoading || !dailyVerse) {
    return (
      <main className="min-h-screen bg-[#121213] text-white flex flex-col items-center justify-center">
        <div className="animate-pulse text-[#C9A84C] font-playfair text-2xl">Loading today&apos;s verse...</div>
      </main>
    );
  }

  return <GameCore verse={dailyVerse} hardMode={hardMode} setHardMode={setHardMode} translation={translation} setTranslation={setTranslation} />;
}

function GameCore({ verse, hardMode, setHardMode, translation, setTranslation }: { verse: DailyVerse, hardMode: boolean, setHardMode: (v: boolean) => void, translation: string, setTranslation: (v: string) => void }) {
  const {
    gameState,
    submitGuess,
    updateCurrentGuess,
    activeBlankIndex,
    setActiveBlankIndex,
    blankCount,
    maxAttempts,
    isLoaded,
    resetGame,
    keyStatuses,
    requestHint
  } = useGame(verse);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { user, login, logout } = useAuth();

  const handleLogin = (newUser: User, token: string) => {
    login(newUser, token);
    showToast(`Welcome, ${newUser.username}!`);
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.');
  };

  const isReadyToSubmit = gameState.currentGuess.every(word => word.trim().length > 0);
  const isAnyModalOpen = isHelpOpen || isStatsOpen || isAuthOpen || isLeaderboardOpen || isSettingsOpen;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleRowSubmit = () => {
    if (!isReadyToSubmit) {
      showToast("Not enough letters");
      return;
    }
    submitGuess();
  };

  const handleShare = async () => {
    const shareText = generateShareText(gameState, 1); // Mock Day 1
    try {
      await navigator.clipboard.writeText(shareText);
      showToast("Result copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <main className="min-h-screen bg-[#121213] text-white flex flex-col">
      <Header 
        onOpenHelp={() => setIsHelpOpen(true)} 
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className={`flex-1 flex flex-col overflow-y-auto pb-8 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <VerseHeader verse={verse} />
        
        <GameGrid
          guesses={gameState.guesses}
          feedback={gameState.feedback}
          currentGuess={gameState.currentGuess}
          currentRow={gameState.currentRow}
          blankCount={blankCount}
          maxAttempts={maxAttempts}
          activeBlankIndex={activeBlankIndex}
          status={gameState.status}
        />

        {gameState.status === 'playing' ? (
          <div className="flex flex-col gap-2">
            <WordInput
              currentWord={gameState.currentGuess[activeBlankIndex] || ''}
              activeBlankIndex={activeBlankIndex}
              blankCount={blankCount}
              onWordChange={(word) => updateCurrentGuess(activeBlankIndex, word)}
              onNextBlank={() => setActiveBlankIndex(Math.min(blankCount - 1, activeBlankIndex + 1))}
              onPrevBlank={() => setActiveBlankIndex(Math.max(0, activeBlankIndex - 1))}
              onRequestHint={requestHint}
              onSubmit={handleRowSubmit}
              isReadyToSubmit={isReadyToSubmit}
              disabled={gameState.status !== 'playing' || isAnyModalOpen}
            />
            <Keyboard
              onKeyPress={(key) => updateCurrentGuess(activeBlankIndex, (gameState.currentGuess[activeBlankIndex] || '') + key.toLowerCase())}
              onDelete={() => {
                const word = gameState.currentGuess[activeBlankIndex] || '';
                if (word === '') setActiveBlankIndex(Math.max(0, activeBlankIndex - 1));
                else updateCurrentGuess(activeBlankIndex, word.slice(0, -1));
              }}
              onEnter={() => {
                if (isReadyToSubmit) handleRowSubmit();
                else setActiveBlankIndex(Math.min(blankCount - 1, activeBlankIndex + 1));
              }}
              keyStatuses={keyStatuses}
              disabled={gameState.status !== 'playing' || isAnyModalOpen}
              isReadyToSubmit={isReadyToSubmit}
            />
          </div>
        ) : (
          <div className="w-full max-w-[420px] mx-auto mt-8 px-4 text-center animate-fade-in">
            <h3 className="text-2xl font-playfair text-[#C9A84C] mb-4">
              {gameState.status === 'won' ? 'Magnificent!' : 'Keep reading. Try again tomorrow!'}
            </h3>
            <p className="text-white font-lora mb-6 text-lg">
              {verse.fullText}
            </p>
            <button 
              onClick={handleShare}
              className="w-full py-3 px-4 mb-3 bg-[#538D4E] hover:bg-[#467741] transition-colors text-white rounded font-inter font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share Result
            </button>
            <button 
              onClick={resetGame}
              className="w-full py-3 px-4 bg-[#3A3A3C] hover:bg-[#565758] transition-colors text-white rounded font-inter font-bold text-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              Reset for Testing
            </button>
          </div>
        )}
      </div>

      <Toast message={toastMessage} />
      <HowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        hardMode={hardMode}
        setHardMode={setHardMode}
        translation={translation}
        setTranslation={setTranslation}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
    </main>
  );
}
