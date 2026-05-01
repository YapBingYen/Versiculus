import React, { useEffect } from 'react';

interface WordInputProps {
  currentWord: string;
  activeBlankIndex: number;
  blankCount: number;
  onWordChange: (word: string) => void;
  onNextBlank: () => void;
  onPrevBlank: () => void;
  onRequestHint: () => void;
  onSubmit: () => void;
  isReadyToSubmit: boolean;
  disabled: boolean;
}

export function WordInput({
  currentWord,
  activeBlankIndex,
  blankCount,
  onWordChange,
  onNextBlank,
  onPrevBlank,
  onRequestHint,
  onSubmit,
  isReadyToSubmit,
  disabled
}: WordInputProps) {
  
  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts (like copy/paste)
      if (e.ctrlKey || e.metaKey || e.altKey) return; 
      
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isReadyToSubmit) {
          onSubmit();
        } else {
          onNextBlank();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) onPrevBlank();
        else onNextBlank();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentWord === '') onPrevBlank();
        else onWordChange(currentWord.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        onWordChange(currentWord + e.key.toLowerCase());
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, currentWord, isReadyToSubmit, onNextBlank, onPrevBlank, onSubmit, onWordChange]);

  if (disabled) return null;

  return (
    <div className="w-full max-w-[420px] mx-auto mt-1 px-4 flex flex-col items-center gap-2">
      <div className="flex w-full items-center gap-2">
        <span className="text-[#818384] font-inter text-sm whitespace-nowrap">
          Word {activeBlankIndex + 1} of {blankCount}:
        </span>
        <div className="flex-1 bg-[#1A1A1B] border border-[#565758] rounded px-3 py-2 text-white font-inter text-base sm:text-lg h-[clamp(38px,5.5vh,44px)] flex items-center uppercase tracking-wider relative overflow-hidden">
          {currentWord}
          <span className="animate-pulse ml-[2px] w-[2px] h-5 bg-[#4A90C4]"></span>
        </div>
      </div>
      
      <div className="flex gap-2 w-full">
        <button
          onClick={onPrevBlank}
          disabled={activeBlankIndex === 0}
          className="flex-1 py-1 px-2 bg-[#3A3A3C] hover:bg-[#565758] text-white rounded font-inter font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          Prev Blank
        </button>
        <button
          onClick={onRequestHint}
          className="flex-[0.5] py-1 px-2 bg-[#C9A84C] hover:bg-[#D4B55E] text-black rounded font-inter font-bold text-sm transition-colors flex items-center justify-center gap-1"
          title="Reveal first letter (uses 1 hint)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          Hint
        </button>
        <button
          onClick={onNextBlank}
          disabled={activeBlankIndex === blankCount - 1}
          className="flex-1 py-1 px-2 bg-[#3A3A3C] hover:bg-[#565758] text-white rounded font-inter font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          Next Blank
        </button>
      </div>
    </div>
  );
}
