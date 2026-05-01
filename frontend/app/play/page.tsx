'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { VerseModal } from '../../components/modals/VerseModal';
import { Toast } from '../../components/ui/Toast';
import { useGame } from '../../hooks/useGame';
import { useAuth, User } from '../../hooks/useAuth';
import { DailyVerse } from '../../types/game';
import { apiUrl } from '../../lib/api';
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
  const { token } = useAuth();
  
  // V2 Settings State
  const [hardMode, setHardMode] = useState(false);
  const [translation, setTranslation] = useState('NIV');
  const [mode, setMode] = useState<'daily' | 'practice'>('daily');
  const [practiceSeed, setPracticeSeed] = useState(0);

  const fetchVerse = useCallback(async (endpoint: string, opts?: { auth?: boolean }) => {
    const res = await fetch(apiUrl(endpoint), {
      headers: opts?.auth && token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error('Failed to fetch verse');
    return res.json();
  }, [token]);

  // Fetch the daily verse from the backend on mount
  useEffect(() => {
    setIsLoading(true);
    const difficulty = hardMode ? 3 : 1;
    const endpoint =
      mode === 'practice'
        ? `/api/practice?translation=${translation}&difficulty=${difficulty}&seed=${practiceSeed}`
        : `/api/daily?translation=${translation}&difficulty=${difficulty}`;

    if (mode === 'practice' && !token) {
      setMode('daily');
      setIsLoading(false);
      return;
    }

    fetchVerse(endpoint, { auth: mode === 'practice' })
      .then(data => {
        const verse = mode === 'practice' ? data : { ...data, mode: 'daily' };
        setDailyVerse(verse);

        if (mode === 'daily') {
          if (data.translation && data.translation !== translation) {
            setTranslation(data.translation);
          }
          if (data.difficulty !== undefined && (data.difficulty === 3) !== hardMode) {
            setHardMode(data.difficulty === 3);
          }
        }

        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Backend not reachable, falling back to mock verse.', err);
        setDailyVerse({ ...MOCK_VERSE, mode: 'daily' });
        setIsLoading(false);
      });
  }, [translation, hardMode, mode, practiceSeed, token, fetchVerse]);

  if (isLoading || !dailyVerse) {
    return (
      <main className="min-h-screen bg-[#121213] text-white flex flex-col items-center justify-center">
        <div className="animate-pulse text-[#C9A84C] font-playfair text-2xl">Loading today&apos;s verse...</div>
      </main>
    );
  }

  return (
    <GameCore
      verse={dailyVerse}
      hardMode={hardMode}
      setHardMode={setHardMode}
      translation={translation}
      setTranslation={setTranslation}
      mode={mode}
      onPlayPractice={() => {
        setMode('practice');
        setPracticeSeed(s => s + 1);
      }}
      onNextPractice={() => {
        setMode('practice');
        setPracticeSeed(s => s + 1);
      }}
      onBackToDaily={() => {
        setMode('daily');
      }}
    />
  );
}

function GameCore({
  verse,
  hardMode,
  setHardMode,
  translation,
  setTranslation,
  mode,
  onPlayPractice,
  onNextPractice,
  onBackToDaily,
}: {
  verse: DailyVerse;
  hardMode: boolean;
  setHardMode: (v: boolean) => void;
  translation: string;
  setTranslation: (v: string) => void;
  mode: 'daily' | 'practice';
  onPlayPractice: () => void;
  onNextPractice: () => void;
  onBackToDaily: () => void;
}) {
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
  const [isVerseOpen, setIsVerseOpen] = useState(false);

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
    <main className="h-[100dvh] bg-[#121213] text-white flex flex-col overflow-hidden">
      <Header 
        onOpenHelp={() => setIsHelpOpen(true)} 
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
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
          <div className="w-full max-w-[420px] mx-auto mt-2 px-4 text-center animate-fade-in flex flex-col">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h3 className="text-xl sm:text-2xl font-playfair text-[#C9A84C]">
                {gameState.status === 'won' ? 'Magnificent!' : 'Try again tomorrow'}
              </h3>
              <button
                onClick={() => setIsVerseOpen(true)}
                className="text-sm font-inter text-[#4A90C4] hover:underline"
              >
                Verse
              </button>
            </div>
            {mode === 'daily' ? (
              <>
                <button 
                  onClick={handleShare}
                  className="w-full py-2 px-4 mb-2 bg-[#538D4E] hover:bg-[#467741] transition-colors text-white rounded font-inter font-bold text-base sm:text-lg shadow flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  Share Result
                </button>
                <button 
                  onClick={() => {
                    if (!user) {
                      showToast('Log in to play unlimited mode.');
                      setIsAuthOpen(true);
                      return;
                    }
                    onPlayPractice();
                  }}
                  className="w-full py-2 px-4 mb-2 bg-[#2C5F8A] hover:bg-[#254F72] transition-colors text-white rounded font-inter font-bold text-base sm:text-lg shadow"
                >
                  Play Another Verse
                </button>
                <button 
                  onClick={resetGame}
                  className="w-full py-2 px-4 bg-[#3A3A3C] hover:bg-[#565758] transition-colors text-white rounded font-inter font-bold text-base sm:text-lg flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                  Reset for Testing
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    if (!user) {
                      showToast('Log in to play unlimited mode.');
                      setIsAuthOpen(true);
                      return;
                    }
                    onNextPractice();
                  }}
                  className="w-full py-2 px-4 mb-2 bg-[#2C5F8A] hover:bg-[#254F72] transition-colors text-white rounded font-inter font-bold text-base sm:text-lg shadow"
                >
                  Next Verse
                </button>
                <button 
                  onClick={onBackToDaily}
                  className="w-full py-2 px-4 bg-[#3A3A3C] hover:bg-[#565758] transition-colors text-white rounded font-inter font-bold text-base sm:text-lg"
                >
                  Back to Daily
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <Toast message={toastMessage} />
      <VerseModal isOpen={isVerseOpen} onClose={() => setIsVerseOpen(false)} verse={verse} />
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
