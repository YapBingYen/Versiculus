import React from 'react';
import { GameRow } from './GameRow';
import { TileState } from '../../types/game';

interface GameGridProps {
  guesses: string[][];
  feedback: TileState[][];
  currentGuess: string[];
  currentRow: number;
  blankCount: number;
  maxAttempts: number;
  activeBlankIndex: number;
  status: 'playing' | 'won' | 'lost';
}

export function GameGrid({
  guesses,
  feedback,
  currentGuess,
  currentRow,
  blankCount,
  maxAttempts,
  activeBlankIndex,
  status
}: GameGridProps) {
  
  // Create an array representing all rows
  const rows = Array.from({ length: maxAttempts }).map((_, i) => {
    // Past guesses
    if (i < currentRow) {
      return {
        words: guesses[i],
        states: feedback[i],
        isActive: false
      };
    }
    
    // Current active row
    if (i === currentRow && status === 'playing') {
      return {
        words: currentGuess,
        states: undefined, // States will be calculated by GameRow based on emptiness
        isActive: true
      };
    }
    
    // Future empty rows
    return {
      words: Array(blankCount).fill(''),
      states: Array(blankCount).fill('empty') as TileState[],
      isActive: false
    };
  });

  return (
    <div className="w-full max-w-[420px] mx-auto px-4 py-2 sm:py-3 flex flex-col items-center justify-center">
      {rows.map((row, i) => (
        <GameRow
          key={i}
          words={row.words}
          states={row.states}
          isActive={row.isActive}
          activeBlankIndex={row.isActive ? activeBlankIndex : -1}
          blankCount={blankCount}
        />
      ))}
    </div>
  );
}
