import { GameState, TileState } from '../types/game';

/**
 * Converts the game's feedback state into a string of emoji squares
 * suitable for sharing on social media.
 */
export function generateShareText(
  gameState: GameState, 
  dayNumber: number, 
  isHardMode: boolean = false
): string {
  const { feedback, status, currentRow } = gameState;
  
  // Title and Day
  let text = `Versiculus 🗓️ Day ${dayNumber}\n`;
  
  // Score (e.g. "4/6")
  const attempts = status === 'won' ? currentRow : 'X';
  const hardModeAsterisk = isHardMode ? '*' : '';
  text += `${attempts}/6${hardModeAsterisk}\n\n`;

  // Emoji Grid
  const emojiMap: Record<TileState, string> = {
    correct: '🟩',
    present: '🟨',
    absent: '⬜',
    empty: '⬛', // Should not happen in a completed game
    filled: '⬛', // Should not happen in a completed game
  };

  feedback.forEach(row => {
    const rowEmojis = row.map(state => emojiMap[state] || '⬛').join('');
    text += `${rowEmojis}\n`;
  });

  // Footer URL
  text += `\nversiculus.app`;

  return text;
}
