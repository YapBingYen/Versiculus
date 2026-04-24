import { useState, useEffect, useCallback } from 'react';
import { GameState, TileState, DailyVerse } from '../types/game';
import { normalizeWord, isSimilar } from '../lib/normalize';
import { loadGameState, saveGameState } from '../lib/localStorage';

const MAX_ATTEMPTS = 6;

export function useGame(dailyVerse: DailyVerse) {
  const blankCount = dailyVerse.keyWords.length;
  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    feedback: [],
    currentGuess: Array(blankCount).fill(''),
    status: 'playing',
    currentRow: 0,
  });

  // Load state on mount (client-side only to prevent SSR hydration mismatch)
  useEffect(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const saved = loadGameState(todayKey);
    if (saved) {
      setGameState(saved);
    }
    setIsLoaded(true);
  }, []);

  // Persist state when it changes
  useEffect(() => {
    if (isLoaded) {
      const todayKey = new Date().toISOString().split('T')[0];
      saveGameState(todayKey, gameState);
    }
  }, [gameState, isLoaded]);

  const updateCurrentGuess = useCallback((index: number, word: string) => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => {
      const newGuess = [...prev.currentGuess];
      newGuess[index] = word;
      return { ...prev, currentGuess: newGuess };
    });
  }, [gameState.status]);

  const submitGuess = useCallback(() => {
    if (gameState.status !== 'playing') return;
    
    // Prevent submission if not all blanks are filled
    if (gameState.currentGuess.some(word => word.trim() === '')) return;

    const normalizedGuess = gameState.currentGuess.map(normalizeWord);
    const normalizedTarget = dailyVerse.keyWords.map(normalizeWord);

    const feedback: TileState[] = Array(blankCount).fill('absent');
    const targetWordsCount: Record<string, number> = {};

    // First pass: find correct matches and count remaining targets
    normalizedTarget.forEach((word, i) => {
      if (word === normalizedGuess[i]) {
        feedback[i] = 'correct';
      } else {
        targetWordsCount[word] = (targetWordsCount[word] || 0) + 1;
      }
    });

    // Second pass: find present matches (wrong position) or similar matches (current position)
    normalizedGuess.forEach((word, i) => {
      if (feedback[i] !== 'correct') {
        // Check if exact match exists somewhere else
        if (targetWordsCount[word] > 0) {
          feedback[i] = 'present';
          targetWordsCount[word]--;
        }
        // Check if similar to the target word in this specific position
        else if (isSimilar(word, normalizedTarget[i])) {
          feedback[i] = 'present';
        }
      }
    });

    const isWin = feedback.every(state => state === 'correct');
    const isLoss = !isWin && gameState.currentRow === MAX_ATTEMPTS - 1;

    setGameState(prev => ({
      ...prev,
      guesses: [...prev.guesses, prev.currentGuess],
      feedback: [...prev.feedback, feedback],
      currentGuess: Array(blankCount).fill(''), // Reset current guess for next row
      currentRow: prev.currentRow + 1,
      status: isWin ? 'won' : isLoss ? 'lost' : 'playing',
    }));

    if (!isWin && !isLoss) {
      setActiveBlankIndex(0);
    }
  }, [gameState, dailyVerse.keyWords, blankCount]);

  const resetGame = useCallback(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const initialState: GameState = {
      guesses: [],
      feedback: [],
      currentGuess: Array(blankCount).fill(''),
      status: 'playing',
      currentRow: 0,
    };
    setGameState(initialState);
    setActiveBlankIndex(0);
    saveGameState(todayKey, initialState);
  }, [blankCount]);

  return {
    gameState,
    submitGuess,
    updateCurrentGuess,
    activeBlankIndex,
    setActiveBlankIndex,
    blankCount,
    maxAttempts: MAX_ATTEMPTS,
    isLoaded,
    resetGame
  };
}
