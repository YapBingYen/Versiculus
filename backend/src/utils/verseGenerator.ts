import axios from 'axios';

const FAMOUS_VERSES = [
  "John 3:16", "Jeremiah 29:11", "Romans 8:28", "Philippians 4:28",
  "Genesis 1:1", "Proverbs 3:5", "Proverbs 3:6", "Isaiah 41:10",
  "Matthew 11:28", "John 14:6", "Matthew 28:19", "Philippians 4:13",
  "Romans 12:2", "Psalms 23:1", "Psalms 46:1", "Galatians 2:20",
  "Joshua 1:9", "Romans 8:38", "Matthew 6:33", "Isaiah 53:5",
  "Proverbs 22:6", "Matthew 28:20", "Romans 8:31", "Romans 8:32",
  "Romans 8:39", "1 Corinthians 10:13", "1 Corinthians 13:4", "1 Corinthians 13:7",
  "2 Corinthians 5:17", "2 Corinthians 5:21", "2 Corinthians 12:9", "Ephesians 2:8",
  "Ephesians 2:9", "Philippians 4:6", "Philippians 4:7", "Colossians 2:6",
  "Colossians 2:7", "Colossians 3:16", "Colossians 3:17", "1 Thessalonians 5:16",
  "1 Thessalonians 5:17", "1 Thessalonians 5:18", "2 Timothy 1:7", "2 Timothy 3:16",
  "Hebrews 11:1", "Hebrews 12:1", "Hebrews 12:2", "James 1:5",
  "James 1:22", "1 Peter 5:7", "1 John 1:9", "Revelation 3:20",
  "Revelation 21:4", "Revelation 22:4", "Revelation 22:5"
];

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
  'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
  'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
  'this', 'to', 'was', 'will', 'with', 'he', 'she', 'him', 'her',
  'his', 'hers', 'my', 'your', 'yours', 'our', 'ours', 'we', 'us',
  'them', 'who', 'whom', 'whose', 'which', 'what', 'where', 'when',
  'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'nor', 'too', 'very', 'can', 'will', 'just',
  'shall', 'should', 'would', 'may', 'might', 'must', 'can', 'could',
  'do', 'does', 'did', 'have', 'has', 'had', 'am', 'are', 'is', 'was',
  'were', 'be', 'being', 'been', 'have', 'has', 'had', 'having', 'do',
  'does', 'did', 'doing', 'i', 'you', 'thou', 'thee', 'thy', 'thine',
  'ye', 'yea', 'let', 'so', 'from', 'upon', 'unto', 'unto'
]);

export async function fetchVerseByReference(reference: string, translation: string = 'NIV'): Promise<{ reference: string; text: string } | null> {
  try {
    let apiTranslation = 'web';
    if (translation === 'KJV') apiTranslation = 'kjv';
    if (translation === 'ESV') apiTranslation = 'asv';
    if (translation === 'NIV') apiTranslation = 'web';
    
    const response = await axios.get(`https://bible-api.com/${encodeURIComponent(reference)}?translation=${apiTranslation}`, {
      headers: {
        'User-Agent': 'VersiculusApp/1.0 (hello@versiculus.app)'
      }
    });
    
    if (response.data && response.data.text) {
      return {
        reference: response.data.reference,
        text: response.data.text.trim().replace(/\n/g, ' ')
      };
    }
  } catch (error) {
    console.error(`Error fetching verse ${reference} from API:`, error);
  }
  return null;
}

export async function fetchRandomVerse(translation: string = 'NIV'): Promise<{ reference: string; text: string }> {
  try {
    const randomIndex = Math.floor(Math.random() * FAMOUS_VERSES.length);
    const reference = FAMOUS_VERSES[randomIndex] as string;
    
    // Map our frontend translation string to bible-api.com supported translations
    let apiTranslation = 'web';
    if (translation === 'KJV') apiTranslation = 'kjv';
    if (translation === 'ESV') apiTranslation = 'asv';
    if (translation === 'NIV') apiTranslation = 'web';
    
    const response = await axios.get(`https://bible-api.com/${encodeURIComponent(reference)}?translation=${apiTranslation}`, {
      headers: {
        'User-Agent': 'VersiculusApp/1.0 (hello@versiculus.app)'
      }
    });
    
    if (response.data && response.data.text) {
      return {
        reference: response.data.reference,
        text: response.data.text.trim().replace(/\n/g, ' ')
      };
    }
  } catch (error) {
    console.error('Error fetching verse from API:', error);
  }
  
  // Fallback
  return {
    reference: 'John 11:35',
    text: 'Jesus wept.'
  };
}

export function selectKeyWords(text: string, count: number = 4): string[] {
  const words = text.match(/[a-zA-Z]+/g) || [];
  const totalWordsInVerse = words.length;
  const safeCount = Math.min(count, Math.max(1, totalWordsInVerse - 1));

  const minimalStopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
    'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
    'that', 'the', 'their', 'then', 'there', 'these', 'they',
    'this', 'to', 'was', 'were', 'with', 'he', 'she', 'him', 'her',
    'his', 'hers', 'my', 'your', 'yours', 'our', 'ours', 'we', 'us',
    'them', 'who', 'whom', 'whose', 'which', 'what', 'where', 'when',
    'why', 'how'
  ]);

  const stages = [
    { minLen: 4, stop: STOP_WORDS },
    { minLen: 3, stop: STOP_WORDS },
    { minLen: 3, stop: minimalStopWords }
  ];

  let eligible: number[] = [];
  for (const stage of stages) {
    const current = words
      .map((w, idx) => ({ w: w.toLowerCase(), idx }))
      .filter(x => x.w.length >= stage.minLen && !stage.stop.has(x.w))
      .map(x => x.idx);
    eligible = current;
    if (eligible.length >= safeCount) break;
  }

  const selected = new Set<number>();
  const maxToSelect = Math.min(safeCount, eligible.length);
  while (selected.size < maxToSelect) {
    selected.add(eligible[Math.floor(Math.random() * eligible.length)] as number);
  }

  return Array.from(selected)
    .sort((a, b) => a - b)
    .map(i => (words[i] || '').toLowerCase())
    .filter(Boolean);
}
