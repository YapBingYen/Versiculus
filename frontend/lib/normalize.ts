/**
 * Normalization Engine for Versiculus
 * 
 * Rules:
 * 1. toLowerCase()
 * 2. .replace(/[^a-z\s]/g, '') — strip all non-alpha, non-space characters
 * 3. .trim() — remove leading/trailing whitespace
 * 4. Apostrophes in contractions are stripped: "God's" → "gods"
 */
export function normalizeWord(word: string): string {
  if (!word) return '';
  
  return word
    .toLowerCase()
    // The following regex removes everything that is not a-z or a space.
    // This naturally strips apostrophes as well (e.g. "god's" -> "gods")
    .replace(/[^a-z\s]/g, '')
    .trim();
}

/**
 * Checks if a guessed word matches the target word according to normalization rules.
 */
export function isMatch(guess: string, target: string): boolean {
  return normalizeWord(guess) === normalizeWord(target);
}

/**
 * Checks if a word is similar enough to warrant a "present" (yellow) feedback.
 * e.g., "believe" vs "believes" or "faith" vs "faithful".
 */
export function isSimilar(word1: string, word2: string): boolean {
  if (!word1 || !word2) return false;
  const w1 = normalizeWord(word1);
  const w2 = normalizeWord(word2);
  if (w1 === w2) return true;
  
  // Plurals / simple suffixes (s, ed, d, ing, es)
  if (w1 + 's' === w2 || w2 + 's' === w1) return true;
  if (w1 + 'es' === w2 || w2 + 'es' === w1) return true;
  if (w1 + 'd' === w2 || w2 + 'd' === w1) return true;
  if (w1 + 'ed' === w2 || w2 + 'ed' === w1) return true;
  if (w1 + 'ing' === w2 || w2 + 'ing' === w1) return true;
  
  // Basic substring check (e.g. "believe" inside "believes") with length constraint
  if (w1.length > 3 && w2.length > 3) {
    if (w1.includes(w2) && w1.length - w2.length <= 3) return true;
    if (w2.includes(w1) && w2.length - w1.length <= 3) return true;
  }
  
  return false;
}
