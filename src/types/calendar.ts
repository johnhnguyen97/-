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

// Calendar event types
export type CalendarEventType = 'custom' | 'study_session' | 'review' | 'word_review' | 'kanji_review';
export type CalendarSyncStatus = 'local' | 'synced' | 'pending_sync' | 'sync_error';
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  isAllDay: boolean;
  linkedWord?: string;
  linkedKanji?: string;
  googleEventId?: string;
  syncStatus: CalendarSyncStatus;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Calendar task types
export type CalendarTaskType = 'custom' | 'learn_word' | 'review_word' | 'learn_kanji' | 'grammar_study' | 'srs_review';
export type TaskPriority = 0 | 1 | 2;

export interface CalendarTask {
  id: string;
  title: string;
  notes?: string;
  taskType: CalendarTaskType;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  dueTime?: string;
  reminderMinutes?: number;
  linkedWord?: string;
  linkedKanji?: string;
  linkedJlptLevel?: JLPTLevel;
  googleTaskId?: string;
  googleTaskListId?: string;
  syncStatus: CalendarSyncStatus;
  priority: TaskPriority;
  createdAt?: string;
  updatedAt?: string;
}
