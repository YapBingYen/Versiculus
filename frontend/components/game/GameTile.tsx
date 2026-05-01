'use client';

import React, { useEffect, useState } from 'react';
import { TileState } from '../../types/game';

interface GameTileProps {
  word: string;
  state: TileState;
  animationDelay?: number;
  isActive?: boolean;
}

export function GameTile({ word, state, animationDelay = 0, isActive = false }: GameTileProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [displayState, setDisplayState] = useState<TileState>('empty');
  
  // Track previous state to trigger flip animation
  useEffect(() => {
    // Only flip if we're transitioning from filled to a feedback state
    if (state !== 'empty' && state !== 'filled' && displayState === 'filled') {
      const timer = setTimeout(() => {
        setIsFlipping(true);
        // Halfway through the flip, change the color
        setTimeout(() => {
          setDisplayState(state);
        }, 150);
        
        // End flip animation
        setTimeout(() => {
          setIsFlipping(false);
        }, 300);
      }, animationDelay);
      
      return () => clearTimeout(timer);
    } else {
      // Immediate update for non-animating states (e.g. typing, or restoring from save)
      setDisplayState(state);
    }
  }, [state, animationDelay, displayState]);

  // Determine colors based on display state
  const getColors = () => {
    switch (displayState) {
      case 'correct':
        return 'bg-[#538D4E] text-white border-[#538D4E]';
      case 'present':
        return 'bg-[#B59F3B] text-white border-[#B59F3B]';
      case 'absent':
        return 'bg-[#3A3A3C] text-white border-[#3A3A3C]';
      case 'filled':
        return 'bg-[#121213] text-white border-gray-400';
      case 'empty':
      default:
        return 'bg-[#121213] text-white border-[#565758]';
    }
  };

  return (
    <div
      className={`
        relative flex items-center justify-center 
        flex-1 min-w-[44px] sm:min-w-[52px] h-[44px] sm:h-[52px] md:h-[58px] px-1 sm:px-2
        border-2 rounded font-inter font-bold text-[11px] sm:text-sm md:text-base
        transition-all duration-100 uppercase select-none overflow-hidden
        ${getColors()}
        ${isActive ? 'border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}
        ${isFlipping ? 'animate-flip' : ''}
        ${state === 'filled' && !isFlipping ? 'animate-pop' : ''}
      `}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {word && (
        <span 
          className="w-full text-center block"
          style={{
            fontSize: word.length > 6 ? '0.75rem' : 'inherit',
            wordBreak: 'break-word',
            lineHeight: 1.1
          }}
          title={word}
        >
          {word}
        </span>
      )}
    </div>
  );
}
