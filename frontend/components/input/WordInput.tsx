import React, { useEffect, useRef } from 'react';

interface WordInputProps {
  currentWord: string;
  activeBlankIndex: number;
  blankCount: number;
  onWordChange: (word: string) => void;
  onNextBlank: () => void;
  onPrevBlank: () => void;
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
  onSubmit,
  isReadyToSubmit,
  disabled
}: WordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when active blank changes, but avoid stealing focus on mobile unless intended
    if (!disabled && inputRef.current) {
      // Small timeout helps with some mobile browsers
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [activeBlankIndex, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isReadyToSubmit) {
        onSubmit();
      } else {
        onNextBlank();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevBlank();
      } else {
        onNextBlank();
      }
    } else if (e.key === 'Backspace' && currentWord === '') {
      e.preventDefault();
      onPrevBlank();
    }
  };

  if (disabled) return null;

  return (
    <div className="w-full max-w-[420px] mx-auto mt-4 px-4 flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-2">
        <span className="text-[#818384] font-inter text-sm whitespace-nowrap">
          Word {activeBlankIndex + 1} of {blankCount}:
        </span>
        <input
          ref={inputRef}
          type="text"
          value={currentWord}
          onChange={(e) => onWordChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-[#1A1A1B] border border-[#565758] rounded p-3 text-white font-inter text-lg focus:outline-none focus:border-[#4A90C4] transition-colors"
          placeholder="Type word..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </div>
      
      <div className="flex gap-2 w-full">
        <button
          onClick={onPrevBlank}
          disabled={activeBlankIndex === 0}
          className="flex-1 py-3 px-4 bg-[#3A3A3C] text-white rounded font-inter font-semibold disabled:opacity-50 transition-colors"
        >
          Prev
        </button>
        <button
          onClick={onNextBlank}
          disabled={activeBlankIndex === blankCount - 1}
          className="flex-1 py-3 px-4 bg-[#3A3A3C] text-white rounded font-inter font-semibold disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>

      {isReadyToSubmit && (
        <button
          onClick={onSubmit}
          className="w-full py-3 px-4 bg-[#2C5F8A] hover:bg-[#4A90C4] text-white rounded font-inter font-bold text-lg transition-colors shadow-lg animate-fade-in"
        >
          Submit Row
        </button>
      )}
    </div>
  );
}
