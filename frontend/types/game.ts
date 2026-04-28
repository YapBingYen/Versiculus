export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

export interface TileData {
  word: string;
  state: TileState;
}

export interface GameState {
  guesses: string[][]; // Array of guessed words per attempt
  feedback: TileState[][]; // Array of feedback states per attempt
  currentGuess: string[]; // Words in the active, not-yet-submitted row
  status: 'playing' | 'won' | 'lost';
  currentRow: number;
  hintsUsed: number;
}

export interface DailyVerse {
  id: number;
  reference: string;
  fullText: string;
  keyWords: string[]; // The actual words that are blanked out
  maskedText: string; // The verse with blanks (for UI rendering)
  translation?: string; // The selected translation version
  difficulty?: number;
  mode?: 'daily' | 'practice';
}
