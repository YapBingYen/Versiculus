import React from 'react';
import { DailyVerse } from '../../types/game';

interface VerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: DailyVerse;
}

export function VerseModal({ isOpen, onClose, verse }: VerseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#1A1A1B] border border-[#3A3A3C] rounded-lg p-6 max-w-lg w-full text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-playfair font-bold text-[#C9A84C]">{verse.reference}</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p className="text-white font-lora text-base sm:text-lg leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {verse.fullText}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 mt-6 bg-[#2C5F8A] hover:bg-[#4A90C4] transition-colors text-white rounded font-inter font-bold text-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}

