import React from 'react';
import { GameTile } from './GameTile';
import { TileState } from '../../types/game';

interface GameRowProps {
  words: string[];
  states?: TileState[];
  isActive?: boolean;
  activeBlankIndex?: number;
  blankCount: number;
}

export function GameRow({ 
  words, 
  states, 
  isActive = false, 
  activeBlankIndex = -1, 
  blankCount 
}: GameRowProps) {
  // Pad arrays to match blankCount
  const paddedWords = [...words];
  while (paddedWords.length < blankCount) {
    paddedWords.push('');
  }
  
  const paddedStates = states ? [...states] : [];
  while (paddedStates.length < blankCount) {
    paddedStates.push(paddedWords[paddedStates.length] ? 'filled' : 'empty');
  }

  return (
    <div className={`flex gap-1 sm:gap-1.5 justify-center w-full mb-1 sm:mb-1.5`}>
      {paddedWords.map((word, i) => (
        <GameTile
          key={i}
          word={word}
          state={paddedStates[i]}
          animationDelay={i * 100} // Staggered flip animation
          isActive={isActive && i === activeBlankIndex}
        />
      ))}
    </div>
  );
}
