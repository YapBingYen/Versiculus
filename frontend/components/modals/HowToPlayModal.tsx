import React from 'react';
import { GameTile } from '../game/GameTile';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-[#1A1A1B] border border-[#3A3A3C] rounded-lg p-6 max-w-sm w-full text-white shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-bold">How To Play</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <p className="font-lora text-base mb-4">
          Guess the missing words in the daily Bible verse within 6 attempts.
        </p>
        <p className="font-lora text-base mb-6 text-[#818384]">
          The color of the tiles will change to show how close your guess was to the word.
        </p>
        
        <div className="space-y-6 mb-8">
          <div>
            <div className="flex gap-1.5 mb-2 w-full max-w-[200px]">
              <GameTile word="FAITH" state="correct" />
            </div>
            <p className="text-sm font-inter text-[#818384]">
              <strong>FAITH</strong> is in the verse and in the correct spot.
            </p>
          </div>
          <div>
            <div className="flex gap-1.5 mb-2 w-full max-w-[200px]">
              <GameTile word="HOPE" state="present" />
            </div>
            <p className="text-sm font-inter text-[#818384]">
              <strong>HOPE</strong> is in the verse but in the wrong spot. (Or you entered a very similar word!)
            </p>
          </div>
          <div>
            <div className="flex gap-1.5 mb-2 w-full max-w-[200px]">
              <GameTile word="LOVE" state="absent" />
            </div>
            <p className="text-sm font-inter text-[#818384]">
              <strong>LOVE</strong> is not in the verse.
            </p>
          </div>
        </div>
        
        <p className="font-lora text-sm mb-6 text-center italic text-[#818384]">
          Verses are taken from the New International Version (NIV).
        </p>

        <button 
          onClick={onClose} 
          className="w-full py-3 bg-[#2C5F8A] hover:bg-[#4A90C4] transition-colors text-white rounded font-inter font-bold text-lg"
        >
          Got It!
        </button>
      </div>
    </div>
  );
}
