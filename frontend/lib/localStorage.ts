import { GameState } from '../types/game';

const GAME_STATE_KEY = 'versiculus_game_state';

interface PersistedData {
  dateKey: string;
  state: GameState;
}

/**
 * Loads the saved game state from localStorage if it exists and matches the current date.
 * If the date doesn't match, it returns null (starting a new game).
 */
export function loadGameState(dateKey: string): GameState | null {
  if (typeof window === 'undefined') return null; // Handle SSR safely
  
  try {
    const item = localStorage.getItem(`${GAME_STATE_KEY}_${dateKey}`);
    if (!item) return null;
    
    const parsed: PersistedData = JSON.parse(item);
    
    // Only return state if it belongs to today's puzzle/translation
    if (parsed.dateKey === dateKey) {
      return parsed.state;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load game state from localStorage', error);
    return null;
  }
}

/**
 * Saves the current game state to localStorage alongside the current date key.
 */
export function saveGameState(dateKey: string, state: GameState): void {
  if (typeof window === 'undefined') return; // Handle SSR safely
  
  try {
    const dataToSave: PersistedData = {
      dateKey,
      state
    };
    
    localStorage.setItem(`${GAME_STATE_KEY}_${dateKey}`, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save game state to localStorage', error);
  }
}
