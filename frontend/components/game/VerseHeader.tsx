import React from 'react';
import { DailyVerse } from '../../types/game';

interface VerseHeaderProps {
  verse: DailyVerse;
}

export function VerseHeader({ verse }: VerseHeaderProps) {
  return (
    <div className="w-full max-w-[420px] mx-auto px-4 py-3 sm:py-4 text-center">
      <h2 className="font-playfair text-[#C9A84C] font-semibold text-base sm:text-lg mb-2">
        {verse.reference}
      </h2>
      <p className="font-lora text-white text-sm sm:text-base leading-relaxed">
        {verse.maskedText}
      </p>
    </div>
  );
}
