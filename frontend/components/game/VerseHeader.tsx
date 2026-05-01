import React from 'react';
import { DailyVerse } from '../../types/game';

interface VerseHeaderProps {
  verse: DailyVerse;
}

export function VerseHeader({ verse }: VerseHeaderProps) {
  return (
    <div className="w-full max-w-[420px] mx-auto px-4 py-2 text-center">
      <h2 className="font-playfair text-[#C9A84C] font-semibold text-sm sm:text-base mb-1">
        {verse.reference}
      </h2>
      <p className="font-lora text-white text-[13px] sm:text-sm leading-snug">
        {verse.maskedText}
      </p>
    </div>
  );
}
