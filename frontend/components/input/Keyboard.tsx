'use client';

import React from 'react';
import { TileState } from '../../types/game';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  keyStatuses: Record<string, TileState>;
  disabled?: boolean;
  isReadyToSubmit?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export function Keyboard({ 
  onKeyPress, 
  onDelete, 
  onEnter, 
  keyStatuses, 
  disabled = false,
  isReadyToSubmit = false
}: KeyboardProps) {
  
  const getKeyStyle = (key: string) => {
    if (key === 'ENTER') {
      return isReadyToSubmit 
        ? 'bg-[#538D4E] hover:bg-[#467741] text-white px-2 sm:px-4' 
        : 'bg-[#565758] hover:bg-[#818384] text-white px-2 sm:px-4';
    }
    
    if (key === 'BACKSPACE') {
      return 'bg-[#565758] hover:bg-[#818384] text-white px-2 sm:px-4';
    }

    const status = keyStatuses[key];
    switch (status) {
      case 'correct': return 'bg-[#538D4E] text-white';
      case 'present': return 'bg-[#B59F3B] text-white';
      case 'absent': return 'bg-[#3A3A3C] text-white opacity-60';
      default: return 'bg-[#818384] hover:bg-[#565758] text-white';
    }
  };

  const handleKeyClick = (key: string) => {
    if (disabled) return;
    if (key === 'ENTER') onEnter();
    else if (key === 'BACKSPACE') onDelete();
    else onKeyPress(key);
  };

  return (
    <div className="w-full max-w-[500px] mx-auto mt-2 px-2 flex flex-col gap-1.5 select-none animate-fade-in pb-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map(key => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              disabled={disabled}
              className={`
                flex items-center justify-center rounded font-inter font-bold text-sm sm:text-base h-10 sm:h-12
                transition-colors ${key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5]' : 'flex-1'}
                ${getKeyStyle(key)}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
              aria-label={key === 'BACKSPACE' ? 'Delete' : key === 'ENTER' ? 'Submit' : key}
            >
              {key === 'BACKSPACE' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                  <line x1="18" y1="9" x2="12" y2="15"></line>
                  <line x1="12" y1="9" x2="18" y2="15"></line>
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
