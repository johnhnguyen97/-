/**
 * Import All Grammar Data
 *
 * This script imports all 392 grammar JSON files into:
 * 1. grammar_topics table - Full topic content
 * 2. grammar_examples table - Example sentences extracted from topics
 * 3. verbs table - Additional verbs found in examples
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source directory
const GRAMMAR_DIR = 'C:/Users/jnguyen/Documents/Project/web-scraper/data/practice-japanese';

interface GrammarSection {
  level: number;
  heading: string;
  content: string;
  children?: GrammarSection[];
}

interface GrammarJSON {
  config_name: string;
  url: string;
  data: {
    sections: GrammarSection[];
  };
}

interface GrammarTopic {
  slug: string;
  title: string;
  url: string;
  category: string;
  jlpt_level: string | null;
  sections: GrammarSection[];
  raw_content: string;
}

interface ExampleSentence {
  japanese: string;
  english: string;
  romaji?: string;
  source_topic: string;
  context?: string;
}

// Category detection patterns
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'verb-conjugation': [/verb-/, /te-form/, /ta-form/, /masu/, /nai/, /potential/, /passive/, /causative/, /volitional/, /imperative/, /conditional/],
  'adjective': [/adjective/, /i-adjective/, /na-adjective/],
  'particle': [/particle-/, /^wa$/, /^ga$/, /^wo$/, /^ni$/, /^de$/, /^to$/, /^mo$/, /^ka$/],
  'keigo': [/honorific/, /humble/, /polite/, /keigo/, /formal/],
  'expression': [/expression/, /phrase/, /greetings/, /apolog/],
  'grammar-pattern': [/pattern/, /grammar/, /structure/],
  'sentence-ending': [/sentence-end/, /ending/, /final/],
  'conjunction': [/conjunction/, /connect/],
  'adverb': [/adverb/],
  'counter': [/counter/, /counting/],
  'time': [/time/, /date/, /when/],
  'comparison': [/compar/, /than/, /most/],
  'conditional': [/conditional/, /if/, /when/],
  'giving-receiving': [/giving/, /receiving/, /あげる/, /もらう/, /くれる/],
};

// JLPT level detection
const JLPT_KEYWORDS: Record<string, string[]> = {
  'N5': ['basic', 'beginner', 'simple', 'easy', 'first', 'elementary'],
  'N4': ['intermediate', 'common', 'everyday'],
  'N3': ['upper-intermediate', 'moderate'],
  'N2': ['advanced', 'complex', 'nuanced'],
  'N1': ['expert', 'literary', 'formal writing', 'classical'],
};

function detectCategory(slug: string, content: string): string {
  const lowerSlug = slug.toLowerCase();
  const lowerContent = content.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerSlug) || pattern.test(lowerContent)) {
        return category;
      }
    }
  }

  return 'general';
}

function detectJLPTLevel(content: string): string | null {
  const lowerContent = content.toLowerCase();

  // Direct JLPT mentions
  const jlptMatch = lowerContent.match(/jlpt\s*(n[1-5])/i);
  if (jlptMatch) {
    return jlptMatch[1].toUpperCase();
  }

  // Keyword-based detection
  for (const [level, keywords] of Object.entries(JLPT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        return level;
      }
    }
  }

  return null;
}

function extractSlug(filename: string): string {
  return filename
    .replace('practice-japanese.com_docs_', '')
    .replace('.json', '')
    .replace(/_/g, '-');
}

function extractTitle(sections: GrammarSection[]): string {
  // Find first H1 or H2 heading
  for (const section of sections) {
    if (section.level <= 2 && section.heading) {
      return section.heading;
    }
  }
  return 'Untitled';
}

function flattenContent(sections: GrammarSection[]): string {
  let content = '';

  function processSection(section: GrammarSection) {
    if (section.heading) {
      content += `## ${section.heading}\n\n`;
    }
    if (section.content) {
      content += `${section.content}\n\n`;
    }
    if (section.children) {
      for (const child of section.children) {
        processSection(child);
      }
    }
  }

  for (const section of sections) {
    processSection(section);
  }

  return content;
}

// Extract Japanese sentences with translations
function extractExamples(sections: GrammarSection[], topicSlug: string): ExampleSentence[] {
  const examples: ExampleSentence[] = [];
  const japanesePattern = /([ぁ-んァ-ン一-龯々ー]+[^a-zA-Z\n]*)/g;
  const translationPattern = /"([^"]+)"/g;

  function processSection(section: GrammarSection, context: string) {
    const content = section.content || '';

    // Look for patterns like: 日本語 "English translation"
    const lines = content.split('\n');
    for (const line of lines) {
      // Match Japanese followed by quoted English
      const match = line.match(/([ぁ-んァ-ン一-龯々ー][^\n"]*?)\s+"([^"]+)"/);
      if (match) {
        examples.push({
          japanese: match[1].trim(),
          english: match[2].trim(),
          source_topic: topicSlug,
          context: context || section.heading,
        });
      }
    }

    if (section.children) {
      for (const child of section.children) {
        processSection(child, section.heading || context);
      }
    }
  }

  for (const section of sections) {
    processSection(section, '');
  }

  return examples;
}

async function processAllFiles(): Promise<{
  topics: GrammarTopic[];
  examples: ExampleSentence[];
  stats: Record<string, number>;
}> {
  const files = fs.readdirSync(GRAMMAR_DIR).filter(f => f.endsWith('.json'));
  const topics: GrammarTopic[] = [];
  const allExamples: ExampleSentence[] = [];
  const categoryStats: Record<string, number> = {};

  console.log(`Processing ${files.length} grammar files...\n`);

  for (const file of files) {
    try {
      const filePath = path.join(GRAMMAR_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const json: GrammarJSON = JSON.parse(content);

      const slug = extractSlug(file);
      const sections = json.data?.sections || [];
      const rawContent = flattenContent(sections);
      const title = extractTitle(sections);
      const category = detectCategory(slug, rawContent);
      const jlptLevel = detectJLPTLevel(rawContent);

      // Count categories
      categoryStats[category] = (categoryStats[category] || 0) + 1;

      topics.push({
        slug,
        title,
        url: json.url,
        category,
        jlpt_level: jlptLevel,
        sections,
        raw_content: rawContent,
      });

      // Extract examples
      const examples = extractExamples(sections, slug);
      allExamples.push(...examples);

    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  return { topics, examples: allExamples, stats: categoryStats };
}

function generateSQL(topics: GrammarTopic[], examples: ExampleSentence[]): string {
  let sql = `-- Grammar Topics Import
-- Generated: ${new Date().toISOString()}
-- Total topics: ${topics.length}
-- Total examples: ${examples.length}

-- Create grammar_topics table if not exists
CREATE TABLE IF NOT EXISTS grammar_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  jlpt_level TEXT CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1') OR jlpt_level IS NULL),
  sections JSONB NOT NULL DEFAULT '[]',
  raw_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_jlpt ON grammar_topics(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_slug ON grammar_topics(slug);

-- Create grammar_examples table
CREATE TABLE IF NOT EXISTS grammar_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  japanese TEXT NOT NULL,
  english TEXT NOT NULL,
  romaji TEXT,
  source_topic TEXT REFERENCES grammar_topics(slug),
  context TEXT,
  jlpt_level TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_examples_topic ON grammar_examples(source_topic);
CREATE INDEX IF NOT EXISTS idx_grammar_examples_jlpt ON grammar_examples(jlpt_level);

-- Insert grammar topics
`;

  // Generate INSERT statements for topics
  for (const topic of topics) {
    const sectionsJson = JSON.stringify(topic.sections).replace(/'/g, "''");
    const rawContent = topic.raw_content.replace(/'/g, "''").substring(0, 50000); // Limit size

    sql += `INSERT INTO grammar_topics (slug, title, url, category, jlpt_level, sections, raw_content)
VALUES (
  '${topic.slug}',
  '${topic.title.replace(/'/g, "''")}',
  '${topic.url}',
  '${topic.category}',
  ${topic.jlpt_level ? `'${topic.jlpt_level}'` : 'NULL'},
  '${sectionsJson}'::jsonb,
  '${rawContent}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  jlpt_level = EXCLUDED.jlpt_level,
  sections = EXCLUDED.sections,
  raw_content = EXCLUDED.raw_content,
  updated_at = NOW();

`;
  }

  // Generate INSERT statements for examples (first 500 to avoid huge file)
  sql += `\n-- Insert example sentences (first 500)\n`;
  const limitedExamples = examples.slice(0, 500);

  for (const example of limitedExamples) {
    const japanese = example.japanese.replace(/'/g, "''");
    const english = example.english.replace(/'/g, "''");
    const context = example.context?.replace(/'/g, "''") || '';

    sql += `INSERT INTO grammar_examples (japanese, english, source_topic, context)
VALUES ('${japanese}', '${english}', '${example.source_topic}', '${context}')
ON CONFLICT DO NOTHING;
`;
  }

  return sql;
}

async function main() {
  console.log('=== Grammar Data Import ===\n');

  const { topics, examples, stats } = await processAllFiles();

  console.log('\n=== Category Statistics ===');
  for (const [category, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total topics: ${topics.length}`);
  console.log(`Total examples extracted: ${examples.length}`);

  // Generate SQL
  const sql = generateSQL(topics, examples);

  // Save SQL file
  const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260101_import_all_grammar.sql');
  fs.writeFileSync(outputPath, sql);
  console.log(`\nSQL migration saved to: ${outputPath}`);

  // Also save a JSON summary
  const summaryPath = path.join(__dirname, '..', 'src', 'data', 'grammar-summary.json');
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify({
    totalTopics: topics.length,
    totalExamples: examples.length,
    categories: stats,
    topics: topics.map(t => ({
      slug: t.slug,
      title: t.title,
      category: t.category,
      jlpt_level: t.jlpt_level,
    }))
  }, null, 2));
  console.log(`Summary saved to: ${summaryPath}`);
}

main().catch(console.error);
