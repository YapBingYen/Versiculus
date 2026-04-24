'use client';

import Link from 'next/link';
import { GameTile } from '../components/game/GameTile';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#121213] flex flex-col items-center justify-center text-center p-4">
      
      {/* Decorative Tiles */}
      <div className="mb-8 flex gap-2 justify-center max-w-full">
        <GameTile word="V" state="correct" />
        <GameTile word="E" state="present" />
        <GameTile word="R" state="correct" />
        <GameTile word="S" state="absent" />
        <GameTile word="E" state="correct" />
      </div>
      
      {/* Hero Content */}
      <h1 className="font-playfair text-5xl md:text-6xl text-white font-bold tracking-wider mb-4 animate-fade-in">
        VERSICULUS
      </h1>
      
      <p className="font-lora text-xl text-[#818384] mb-10 max-w-md mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '100ms' }}>
        A daily word puzzle game inspired by Wordle, purpose-built for Scripture memorization.
      </p>
      
      {/* Call to Action */}
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <Link 
          href="/play" 
          className="bg-[#2C5F8A] hover:bg-[#4A90C4] text-white px-10 py-4 rounded font-inter font-bold text-xl transition-colors shadow-[0_0_15px_rgba(44,95,138,0.5)] flex items-center gap-2"
        >
          Play Now
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </Link>
      </div>

    </main>
  );
}
