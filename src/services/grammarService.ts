import { supabase } from '../lib/supabase';

// Interface matching the actual grammar_topics table schema
export interface GrammarTopic {
  id: string;
  slug: string;
  title: string;
  url: string | null;
  category: string;
  jlpt_level: string | null;
  sections: GrammarSection[];
  raw_content: string | null;
  created_at: string;
  updated_at: string;

  // Computed/derived fields for UI compatibility
  pattern: string;      // derived from slug
  name: string;         // alias for title
  name_japanese: string | null;
  level: string | null; // alias for jlpt_level
  description: string | null;
  usage: string | null;
  examples: Array<{
    japanese: string;
    reading: string;
    english: string;
  }> | null;
  conjugation: Record<string, string> | null;
  notes: string | null;
  related_patterns: string[] | null;
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
 * Transform raw database row to GrammarTopic with derived fields
 */
function transformTopic(row: Record<string, unknown>): GrammarTopic {
  const sections = (row.sections as GrammarSection[]) || [];

  // Extract description from first section content
  const description = sections.length > 0 && sections[0].content
    ? sections[0].content
    : null;

  // Extract examples from all sections
  const examples: Array<{ japanese: string; reading: string; english: string }> = [];
  for (const section of sections) {
    if (section.examples) {
      for (const ex of section.examples) {
        examples.push({
          japanese: ex.japanese,
          english: ex.english,
          reading: ex.reading || '',
        });
      }
    }
  }

  // Generate pattern from slug (e.g., "particle-wa" -> "は")
  const patternMap: Record<string, string> = {
    'particle-wa': 'は',
    'particle-ga': 'が',
    'particle-wo': 'を',
    'particle-ni': 'に',
    'particle-de': 'で',
    'particle-to': 'と',
    'particle-mo': 'も',
    'particle-ka': 'か',
    'particle-ne': 'ね',
    'particle-yo': 'よ',
    'particle-no': 'の',
    'particle-he': 'へ',
    'particle-kara': 'から',
    'particle-made': 'まで',
    'te-form': 'て形',
    'ta-form': 'た形',
    'nai-form': 'ない形',
    'masu-form': 'ます形',
    'dictionary-form': '辞書形',
    'potential-form': '可能形',
    'passive-form': '受身形',
    'causative-form': '使役形',
    'conditional-ba': 'ば形',
    'conditional-tara': 'たら',
    'volitional-form': '意志形',
    'imperative-form': '命令形',
    'i-adjectives': 'い形容詞',
    'na-adjectives': 'な形容詞',
  };

  const slug = row.slug as string;
  const pattern = patternMap[slug] || slug.replace(/-/g, ' ');

  return {
    id: row.id as string,
    slug: slug,
    title: row.title as string,
    url: row.url as string | null,
    category: row.category as string,
    jlpt_level: row.jlpt_level as string | null,
    sections: sections,
    raw_content: row.raw_content as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,

    // Derived fields for UI compatibility
    pattern: pattern,
    name: row.title as string,
    name_japanese: null, // Not in current schema
    level: row.jlpt_level as string | null,
    description: description,
    usage: null, // Could be extracted from sections if needed
    examples: examples.length > 0 ? examples : null,
    conjugation: null, // Could be extracted from sections if needed
    notes: null, // Could be extracted from sections if needed
    related_patterns: null, // Not in current schema
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
    .order('category')
    .order('title');

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
    .order('title');

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
    .order('category')
    .order('title');

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

    if (topic.conjugation) {
      context += `  Conjugation:\n`;
      for (const [key, value] of Object.entries(topic.conjugation)) {
        context += `    - ${key}: ${value}\n`;
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
 * Get category display names
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    'particle': 'Particles (助詞)',
    'particles': 'Particles (助詞)',
    'verb-forms': 'Verb Forms (動詞活用)',
    'verb-conjugation': 'Verb Conjugation (動詞活用)',
    'grammar': 'Grammar Patterns (文法)',
    'adjective': 'Adjectives (形容詞)',
    'adjectives': 'Adjectives (形容詞)',
    'copula': 'Copula (断定)',
    'general': 'General (一般)',
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
