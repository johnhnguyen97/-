import { supabase } from '../lib/supabase';

// Interface matching the actual grammar_topics table schema
export interface GrammarTopic {
  id: string;
  slug: string;
  name: string;
  pattern: string;
  name_japanese: string | null;
  category: string;
  jlpt_level: string | null;

  // Chapter info for textbook-style organization
  chapter_id: string | null;
  chapter_order: number | null;
  chapter_title: string | null;
  chapter_title_japanese: string | null;

  // Core content
  description: string | null;
  usage: string | null;
  notes: string | null;

  // Study materials
  examples: Array<{
    japanese: string;
    reading: string;
    english: string;
  }> | null;
  key_points: string[] | null;
  common_mistakes: Array<{
    wrong: string;
    correct: string;
    explanation: string;
  }> | null;
  practice_tips: string[] | null;
  conjugation_rules: Array<{
    from: string;
    to: string;
  }> | null;
  related_patterns: string[] | null;

  // Full content
  sections: GrammarSection[];
  source_url: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Aliases for backwards compatibility
  level: string | null; // alias for jlpt_level
}

export interface GrammarSection {
  heading?: string;
  content?: string;
  examples?: Array<{
    japanese: string;
    english: string;
    reading?: string;
  }>;
}

export interface GrammarChunk {
  id: string;
  chunk_index: number;
  content: string;
  character_count: number;
}

export interface SearchResult {
  id: string;
  content: string;
  rank: number;
}

// Cache for grammar topics
let topicsCache: GrammarTopic[] | null = null;
let topicsCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Transform raw database row to GrammarTopic
 */
function transformTopic(row: Record<string, unknown>): GrammarTopic {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    pattern: row.pattern as string || '',
    name_japanese: row.name_japanese as string | null,
    category: row.category as string,
    jlpt_level: row.jlpt_level as string | null,

    // Chapter info
    chapter_id: row.chapter_id as string | null,
    chapter_order: row.chapter_order as number | null,
    chapter_title: row.chapter_title as string | null,
    chapter_title_japanese: row.chapter_title_japanese as string | null,

    // Core content
    description: row.description as string | null,
    usage: row.usage as string | null,
    notes: row.notes as string | null,

    // Study materials (already stored as JSONB)
    examples: row.examples as Array<{ japanese: string; reading: string; english: string }> | null,
    key_points: row.key_points as string[] | null,
    common_mistakes: row.common_mistakes as Array<{ wrong: string; correct: string; explanation: string }> | null,
    practice_tips: row.practice_tips as string[] | null,
    conjugation_rules: row.conjugation_rules as Array<{ from: string; to: string }> | null,
    related_patterns: row.related_patterns as string[] | null,

    // Full content
    sections: (row.sections as GrammarSection[]) || [],
    source_url: row.source_url as string | null,

    // Timestamps
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,

    // Alias for backwards compatibility
    level: row.jlpt_level as string | null,
  };
}

/**
 * Get all grammar topics
 */
export async function getAllTopics(): Promise<GrammarTopic[]> {
  // Check cache
  if (topicsCache && Date.now() - topicsCacheTime < CACHE_TTL) {
    return topicsCache;
  }

  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .order('chapter_order')
    .order('jlpt_level')
    .order('name');

  if (error) {
    console.error('Error fetching grammar topics:', error);
    throw error;
  }

  topicsCache = (data || []).map(transformTopic);
  topicsCacheTime = Date.now();
  return topicsCache;
}

/**
 * Get topics by category
 */
export async function getTopicsByCategory(category: string): Promise<GrammarTopic[]> {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('category', category)
    .order('chapter_order')
    .order('name');

  if (error) {
    console.error('Error fetching topics by category:', error);
    throw error;
  }

  return (data || []).map(transformTopic);
}

/**
 * Get topics by JLPT level
 */
export async function getTopicsByLevel(level: string): Promise<GrammarTopic[]> {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('jlpt_level', level)
    .order('chapter_order')
    .order('name');

  if (error) {
    console.error('Error fetching topics by level:', error);
    throw error;
  }

  return (data || []).map(transformTopic);
}

/**
 * Get a single topic by ID
 */
export async function getTopicById(id: string): Promise<GrammarTopic | null> {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching topic:', error);
    throw error;
  }

  return data ? transformTopic(data) : null;
}

/**
 * Search grammar content using full-text search
 */
export async function searchGrammar(query: string, limit: number = 10): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .rpc('search_grammar', { query_text: query, limit_count: limit });

  if (error) {
    console.error('Error searching grammar:', error);
    // Fallback to simple ILIKE search
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('grammar_chunks')
      .select('id, content')
      .ilike('content', `%${query}%`)
      .limit(limit);

    if (fallbackError) throw fallbackError;
    return (fallbackData || []).map((d, i) => ({ ...d, rank: 1 - i * 0.1 }));
  }

  return data || [];
}

/**
 * Find relevant grammar topics for a Japanese sentence
 */
export async function findRelevantTopics(japaneseText: string): Promise<GrammarTopic[]> {
  const allTopics = await getAllTopics();

  // Score each topic by how relevant it is to the text
  const scored = allTopics.map(topic => {
    let score = 0;

    // Check if pattern appears in text
    if (topic.pattern && japaneseText.includes(topic.pattern)) {
      score += 10;
    }

    // Check for related patterns
    if (topic.related_patterns) {
      for (const related of topic.related_patterns) {
        if (japaneseText.includes(related)) {
          score += 3;
        }
      }
    }

    // Check examples
    if (topic.examples) {
      for (const example of topic.examples) {
        // Look for similar patterns
        const examplePatterns = example.japanese.match(/[ぁ-んァ-ン一-龯]+/g) || [];
        for (const pat of examplePatterns) {
          if (pat.length > 1 && japaneseText.includes(pat)) {
            score += 1;
          }
        }
      }
    }

    return { topic, score };
  });

  // Return topics with score > 0, sorted by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.topic);
}

/**
 * Get grammar context for AI prompt
 * Returns formatted grammar rules relevant to a sentence
 */
export async function getGrammarContext(japaneseText: string): Promise<string> {
  const topics = await findRelevantTopics(japaneseText);

  if (topics.length === 0) {
    return '';
  }

  let context = '\n\n--- GRAMMAR REFERENCE ---\n';
  context += 'Use these grammar rules to accurately break down the sentence:\n\n';

  for (const topic of topics) {
    context += `【${topic.pattern}】${topic.name}`;
    if (topic.name_japanese) {
      context += ` (${topic.name_japanese})`;
    }
    context += '\n';

    if (topic.description) {
      context += `  Description: ${topic.description}\n`;
    }

    if (topic.usage) {
      context += `  Usage: ${topic.usage}\n`;
    }

    if (topic.conjugation_rules && topic.conjugation_rules.length > 0) {
      context += `  Conjugation:\n`;
      for (const rule of topic.conjugation_rules) {
        context += `    - ${rule.from} → ${rule.to}\n`;
      }
    }

    if (topic.examples && topic.examples.length > 0) {
      context += `  Example: ${topic.examples[0].japanese} (${topic.examples[0].english})\n`;
    }

    context += '\n';
  }

  return context;
}

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  const topics = await getAllTopics();
  const categories = [...new Set(topics.map(t => t.category))];
  return categories.sort();
}

/**
 * Get category display names for all 17 categories
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    // Main categories (17 total)
    'grammar-patterns': 'Grammar Patterns (文法)',
    'verb-forms': 'Verb Forms (動詞活用)',
    'particles': 'Particles (助詞)',
    'adjectives': 'Adjectives (形容詞)',
    'counters': 'Counters (助数詞)',
    'question-words': 'Question Words (疑問詞)',
    'writing-style': 'Writing Style (文体)',
    'expressions': 'Expressions (表現)',
    'basics': 'Basics (基本)',
    'keigo': 'Honorifics (敬語)',
    'pronouns': 'Pronouns (代名詞)',
    'numbers-time': 'Numbers & Time (数字・時間)',
    'speech-styles': 'Speech Styles (話し方)',
    'connectors': 'Connectors (接続)',
    'jlpt-reference': 'JLPT Reference',
    'giving-receiving': 'Giving/Receiving (授受)',
    'conditionals': 'Conditionals (条件)',
    // Legacy/alternate names for backwards compatibility
    'particle': 'Particles (助詞)',
    'verb-conjugation': 'Verb Conjugation (動詞活用)',
    'grammar': 'Grammar Patterns (文法)',
    'adjective': 'Adjectives (形容詞)',
    'copula': 'Copula (断定)',
    'general': 'General (一般)',
    'other': 'Other',
  };
  return names[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
}

/**
 * Get JLPT level description
 */
export function getLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    'N5': 'Beginner - Basic grammar and vocabulary',
    'N4': 'Elementary - More complex sentences',
    'N3': 'Intermediate - Everyday conversations',
    'N2': 'Upper Intermediate - News and articles',
    'N1': 'Advanced - Complex texts and nuance',
  };
  return descriptions[level] || level;
}

// ============================================================
// CHAPTER & CATEGORY ORGANIZATION
// ============================================================

export interface Chapter {
  id: string;
  order: number;
  title: string;
  titleJapanese: string;
  topicCount: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  nameJapanese: string;
  topicCount: number;
  icon?: string;
}

export interface LevelInfo {
  level: string;
  name: string;
  description: string;
  topicCount: number;
}

export interface TopicFilters {
  chapter?: string;
  category?: string;
  level?: string;
  search?: string;
  hasExamples?: boolean;
  hasKeyPoints?: boolean;
  hasMistakes?: boolean;
}

/**
 * Get all chapters with topic counts
 */
export async function getChapters(): Promise<Chapter[]> {
  const topics = await getAllTopics();

  const chapterMap = new Map<string, Chapter>();

  for (const topic of topics) {
    if (topic.chapter_id && topic.chapter_title) {
      const existing = chapterMap.get(topic.chapter_id);
      if (existing) {
        existing.topicCount++;
      } else {
        chapterMap.set(topic.chapter_id, {
          id: topic.chapter_id,
          order: topic.chapter_order || 99,
          title: topic.chapter_title,
          titleJapanese: topic.chapter_title_japanese || '',
          topicCount: 1,
        });
      }
    }
  }

  return Array.from(chapterMap.values()).sort((a, b) => a.order - b.order);
}

/**
 * Get all categories with topic counts and metadata
 */
export async function getCategoriesWithInfo(): Promise<CategoryInfo[]> {
  const topics = await getAllTopics();

  const categoryMap = new Map<string, number>();
  for (const topic of topics) {
    categoryMap.set(topic.category, (categoryMap.get(topic.category) || 0) + 1);
  }

  // Category metadata with icons
  const categoryMeta: Record<string, { nameJapanese: string; icon: string }> = {
    'grammar-patterns': { nameJapanese: '文法', icon: '📚' },
    'verb-forms': { nameJapanese: '動詞活用', icon: '🏃' },
    'particles': { nameJapanese: '助詞', icon: '🔗' },
    'adjectives': { nameJapanese: '形容詞', icon: '🎨' },
    'counters': { nameJapanese: '助数詞', icon: '🔢' },
    'question-words': { nameJapanese: '疑問詞', icon: '❓' },
    'writing-style': { nameJapanese: '文体', icon: '✍️' },
    'expressions': { nameJapanese: '表現', icon: '💬' },
    'basics': { nameJapanese: '基本', icon: '📖' },
    'keigo': { nameJapanese: '敬語', icon: '🎩' },
    'pronouns': { nameJapanese: '代名詞', icon: '👤' },
    'numbers-time': { nameJapanese: '数字・時間', icon: '🕐' },
    'speech-styles': { nameJapanese: '話し方', icon: '🗣️' },
    'connectors': { nameJapanese: '接続', icon: '⛓️' },
    'jlpt-reference': { nameJapanese: 'JLPT参考', icon: '📋' },
    'giving-receiving': { nameJapanese: '授受', icon: '🤝' },
    'conditionals': { nameJapanese: '条件', icon: '🔀' },
  };

  const categories: CategoryInfo[] = [];
  for (const [category, count] of categoryMap.entries()) {
    const meta = categoryMeta[category] || { nameJapanese: '', icon: '📄' };
    categories.push({
      id: category,
      name: getCategoryDisplayName(category),
      nameJapanese: meta.nameJapanese,
      topicCount: count,
      icon: meta.icon,
    });
  }

  // Sort by topic count descending
  return categories.sort((a, b) => b.topicCount - a.topicCount);
}

/**
 * Get all JLPT levels with topic counts
 */
export async function getLevelsWithInfo(): Promise<LevelInfo[]> {
  const topics = await getAllTopics();

  const levelMap = new Map<string, number>();
  for (const topic of topics) {
    const level = topic.jlpt_level || 'Unknown';
    levelMap.set(level, (levelMap.get(level) || 0) + 1);
  }

  const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1', 'Unknown'];
  const levelNames: Record<string, string> = {
    'N5': 'Beginner',
    'N4': 'Elementary',
    'N3': 'Intermediate',
    'N2': 'Upper-Intermediate',
    'N1': 'Advanced',
    'Unknown': 'Uncategorized',
  };

  return levelOrder
    .filter(level => levelMap.has(level))
    .map(level => ({
      level,
      name: levelNames[level] || level,
      description: getLevelDescription(level),
      topicCount: levelMap.get(level) || 0,
    }));
}

/**
 * Filter topics by multiple criteria
 */
export async function filterTopics(filters: TopicFilters): Promise<GrammarTopic[]> {
  let topics = await getAllTopics();

  // Filter by chapter
  if (filters.chapter) {
    topics = topics.filter(t => t.chapter_id === filters.chapter);
  }

  // Filter by category
  if (filters.category) {
    topics = topics.filter(t => t.category === filters.category);
  }

  // Filter by JLPT level
  if (filters.level) {
    topics = topics.filter(t => t.jlpt_level === filters.level);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    topics = topics.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.pattern.toLowerCase().includes(searchLower) ||
      (t.name_japanese && t.name_japanese.includes(filters.search!)) ||
      (t.description && t.description.toLowerCase().includes(searchLower))
    );
  }

  // Filter by content availability
  if (filters.hasExamples) {
    topics = topics.filter(t => t.examples && t.examples.length > 0);
  }
  if (filters.hasKeyPoints) {
    topics = topics.filter(t => t.key_points && t.key_points.length > 0);
  }
  if (filters.hasMistakes) {
    topics = topics.filter(t => t.common_mistakes && t.common_mistakes.length > 0);
  }

  return topics;
}

/**
 * Get topics grouped by chapter
 */
export async function getTopicsGroupedByChapter(): Promise<Map<string, GrammarTopic[]>> {
  const topics = await getAllTopics();
  const grouped = new Map<string, GrammarTopic[]>();

  for (const topic of topics) {
    const chapterId = topic.chapter_id || 'uncategorized';
    if (!grouped.has(chapterId)) {
      grouped.set(chapterId, []);
    }
    grouped.get(chapterId)!.push(topic);
  }

  return grouped;
}

/**
 * Get topics grouped by category
 */
export async function getTopicsGroupedByCategory(): Promise<Map<string, GrammarTopic[]>> {
  const topics = await getAllTopics();
  const grouped = new Map<string, GrammarTopic[]>();

  for (const topic of topics) {
    if (!grouped.has(topic.category)) {
      grouped.set(topic.category, []);
    }
    grouped.get(topic.category)!.push(topic);
  }

  return grouped;
}

/**
 * Get topics grouped by JLPT level
 */
export async function getTopicsGroupedByLevel(): Promise<Map<string, GrammarTopic[]>> {
  const topics = await getAllTopics();
  const grouped = new Map<string, GrammarTopic[]>();

  const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];
  for (const level of levelOrder) {
    grouped.set(level, []);
  }

  for (const topic of topics) {
    const level = topic.jlpt_level || 'Unknown';
    if (!grouped.has(level)) {
      grouped.set(level, []);
    }
    grouped.get(level)!.push(topic);
  }

  return grouped;
}

/**
 * Get topic statistics
 */
export async function getTopicStats(): Promise<{
  total: number;
  byChapter: Record<string, number>;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  withExamples: number;
  withKeyPoints: number;
  withMistakes: number;
  withConjugation: number;
}> {
  const topics = await getAllTopics();

  const byChapter: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  let withExamples = 0;
  let withKeyPoints = 0;
  let withMistakes = 0;
  let withConjugation = 0;

  for (const topic of topics) {
    // Count by chapter
    const chapter = topic.chapter_title || 'Uncategorized';
    byChapter[chapter] = (byChapter[chapter] || 0) + 1;

    // Count by category
    byCategory[topic.category] = (byCategory[topic.category] || 0) + 1;

    // Count by level
    const level = topic.jlpt_level || 'Unknown';
    byLevel[level] = (byLevel[level] || 0) + 1;

    // Count study materials
    if (topic.examples && topic.examples.length > 0) withExamples++;
    if (topic.key_points && topic.key_points.length > 0) withKeyPoints++;
    if (topic.common_mistakes && topic.common_mistakes.length > 0) withMistakes++;
    if (topic.conjugation_rules && topic.conjugation_rules.length > 0) withConjugation++;
  }

  return {
    total: topics.length,
    byChapter,
    byCategory,
    byLevel,
    withExamples,
    withKeyPoints,
    withMistakes,
    withConjugation,
  };
}
