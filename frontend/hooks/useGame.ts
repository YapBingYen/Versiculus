import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, TileState, DailyVerse } from '../types/game';
import { normalizeWord, isSimilar } from '../lib/normalize';
import { loadGameState, saveGameState } from '../lib/localStorage';
import { useStats } from './useStats';

const MAX_ATTEMPTS = 6;

export function useGame(dailyVerse: DailyVerse) {
  const blankCount = dailyVerse.keyWords.length;
  const isPractice = dailyVerse.mode === 'practice';
  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const { updateStats } = useStats();

  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    feedback: [],
    currentGuess: Array(blankCount).fill(''),
    status: 'playing',
    currentRow: 0,
    hintsUsed: 0,
  });

  // Load state on mount (client-side only to prevent SSR hydration mismatch)
  useEffect(() => {
    const initialState: GameState = {
      guesses: [],
      feedback: [],
      currentGuess: Array(blankCount).fill(''),
      status: 'playing',
      currentRow: 0,
      hintsUsed: 0,
    };

    if (isPractice) {
      setGameState(initialState);
      setActiveBlankIndex(0);
      setIsLoaded(true);
      return;
    }

    const todayKey = `${new Date().toISOString().split('T')[0]}-${dailyVerse.translation}-${blankCount}`;
    const saved = loadGameState(todayKey);
    if (saved && saved.currentGuess && saved.currentGuess.length === blankCount) {
      setGameState(saved);
    } else {
      setGameState(initialState);
      saveGameState(todayKey, initialState);
    }

    setActiveBlankIndex(0);
    setIsLoaded(true);
  }, [dailyVerse.id, dailyVerse.translation, blankCount, isPractice]);

  // Persist state when it changes
  useEffect(() => {
    if (isLoaded && !isPractice) {
      const todayKey = `${new Date().toISOString().split('T')[0]}-${dailyVerse.translation}-${blankCount}`;
      saveGameState(todayKey, gameState);
    }
  }, [gameState, isLoaded, dailyVerse.translation, blankCount, isPractice]);

  const updateCurrentGuess = useCallback((index: number, word: string) => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => {
      const newGuess = [...prev.currentGuess];
      newGuess[index] = word;
      return { ...prev, currentGuess: newGuess };
    });
  }, [gameState.status]);

  const requestHint = useCallback(() => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => {
      const targetWord = dailyVerse.keyWords[activeBlankIndex];
      const currentWord = prev.currentGuess[activeBlankIndex];
      
      // Don't hint if the word is already correct
      if (currentWord.toLowerCase() === targetWord.toLowerCase()) return prev;

      // Reveal the first letter of the target word
      const newGuess = [...prev.currentGuess];
      newGuess[activeBlankIndex] = targetWord[0].toUpperCase();

      return {
        ...prev,
        currentGuess: newGuess,
        hintsUsed: (prev.hintsUsed || 0) + 1
      };
    });
  }, [gameState.status, activeBlankIndex, dailyVerse.keyWords]);

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

    if (!isPractice && (isWin || isLoss)) {
      updateStats(isWin, gameState.currentRow + 1);
    }

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
  }, [gameState, dailyVerse.keyWords, blankCount, updateStats, isPractice]);

  const resetGame = useCallback(() => {
    const todayKey = `${new Date().toISOString().split('T')[0]}-${dailyVerse.translation}-${blankCount}`;
    const initialState: GameState = {
      guesses: [],
      feedback: [],
      currentGuess: Array(blankCount).fill(''),
      status: 'playing',
      currentRow: 0,
      hintsUsed: 0,
    };
    setGameState(initialState);
    setActiveBlankIndex(0);
    saveGameState(todayKey, initialState);
  }, [blankCount, dailyVerse.translation]);

  const keyStatuses = useMemo(() => {
    // We want to return an array of status records, one for each blank index
    const statusesPerBlank: Record<string, TileState>[] = Array(blankCount).fill(null).map(() => ({}));
    
    gameState.guesses.forEach((guessRow, rowIndex) => {
      const feedbackRow = gameState.feedback[rowIndex];
      guessRow.forEach((word, wordIndex) => {
        // Prevent crashing if a corrupted state has more words than the current blankCount
        if (wordIndex >= blankCount) return;
        
        const state = feedbackRow[wordIndex];
        const letters = word.toUpperCase().split('');
        
        letters.forEach(letter => {
          const currentState = statusesPerBlank[wordIndex][letter];
          
          if (state === 'correct') {
            statusesPerBlank[wordIndex][letter] = 'correct';
          } else if (state === 'present' && currentState !== 'correct') {
            statusesPerBlank[wordIndex][letter] = 'present';
          } else if (state === 'absent' && currentState !== 'correct' && currentState !== 'present') {
            statusesPerBlank[wordIndex][letter] = 'absent';
          }
        });
      });
    });
    
    // Return the keyboard statuses specifically for the currently focused blank
    return statusesPerBlank[activeBlankIndex];
  }, [gameState.guesses, gameState.feedback, activeBlankIndex, blankCount]);

  return {
      gameState,
      submitGuess,
      updateCurrentGuess,
      activeBlankIndex,
      setActiveBlankIndex,
      blankCount,
      maxAttempts: MAX_ATTEMPTS,
      isLoaded,
      resetGame,
      keyStatuses,
      requestHint
    };
}
