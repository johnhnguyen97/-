// Calendar feature TypeScript types

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface WordOfTheDay {
  word: string;
  reading: string;
  romaji?: string;
  meaning: string;
  partOfSpeech: string;
  jlptLevel: JLPTLevel;
  isLearned: boolean;
  isFavorite?: boolean;
}

export interface KanjiOfTheDay {
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  strokeCount?: number;
  jlptLevel: JLPTLevel;
  isLearned: boolean;
  isFavorite?: boolean;
}

export interface JapaneseHoliday {
  date: string;
  localName: string;
  nameEnglish: string;
  description?: string;
  traditions?: string[];
  greetings?: string[];
  foods?: string[];
  isNationalHoliday: boolean;
}

export interface DailyCalendarData {
  date: string;
  dayOfWeek: string;
  dayOfWeekJapanese: string;
  jlptLevel: JLPTLevel;
  wordOfTheDay: WordOfTheDay | null;
  kanjiOfTheDay: KanjiOfTheDay | null;
  holidays: JapaneseHoliday[];
}

export interface CalendarSettings {
  jlptLevel: JLPTLevel;
  icalToken?: string;
}

export interface LearnedItem {
  id: string;
  itemType: 'word' | 'kanji';
  itemKey: string;
  reading?: string;
  meaning: string;
  jlptLevel?: JLPTLevel;
  learnedDate: string;
}

// Nager.Date API response type
export interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Jisho API response types
export interface JishoWord {
  slug: string;
  is_common: boolean;
  tags: string[];
  jlpt: string[];
  japanese: {
    word?: string;
    reading: string;
  }[];
  senses: {
    english_definitions: string[];
    parts_of_speech: string[];
    tags: string[];
    info: string[];
  }[];
}

export interface JishoSearchResult {
  meta: { status: number };
  data: JishoWord[];
}
