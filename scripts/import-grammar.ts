/**
 * Import Grammar Data Script
 *
 * Parses all JSON files from practice-japanese and imports into Supabase
 * Run with: npx tsx scripts/import-grammar.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAMMAR_DIR = path.join(__dirname, '../src/data/grammar');
const OUTPUT_DIR = path.join(__dirname, '../src/data/processed');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface RawGrammarFile {
  config_name: string;
  url: string;
  data: {
    metadata?: { title: string };
    sections?: RawSection[];
    examples?: { sentence: string }[];
  };
}

interface RawSection {
  level: number;
  heading: string;
  content: string;
  children?: RawSection[];
}

interface ProcessedGrammarTopic {
  slug: string;
  title: string;
  source_url: string;
  category: string;
  jlpt_level: string | null;
  sections: ProcessedSection[];
  examples: string[];
}

interface ProcessedSection {
  level: number;
  heading: string;
  content: string;
  children?: ProcessedSection[];
}

// ============================================
// CATEGORY DETECTION
// ============================================

function detectCategory(slug: string, title: string): string {
  const lowerSlug = slug.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (lowerSlug.includes('verb-') || lowerTitle.includes('verb')) {
    if (lowerSlug.includes('conjugat') || lowerSlug.includes('form')) {
      return 'verb-conjugation';
    }
    return 'verb-conjugation';
  }

  if (lowerSlug.includes('adjective')) return 'adjective-conjugation';
  if (lowerSlug.includes('particle')) return 'particles';
  if (lowerSlug.includes('conditional') || lowerSlug.includes('tara') || lowerSlug.includes('-ba')) return 'conditionals';
  if (lowerSlug.includes('keigo') || lowerSlug.includes('honorific') || lowerSlug.includes('humble')) return 'keigo';
  if (lowerSlug.includes('te-') || lowerSlug.includes('giving') || lowerSlug.includes('receiving')) return 'giving-receiving';
  if (lowerSlug.includes('quotation') || lowerSlug.includes('to-iu') || lowerSlug.includes('tte')) return 'quotation';
  if (lowerSlug.includes('comparison') || lowerSlug.includes('yori') || lowerSlug.includes('hodo')) return 'comparison';
  if (lowerSlug.includes('jlpt')) return 'jlpt-grammar';

  return 'other';
}

// ============================================
// JLPT LEVEL DETECTION
// ============================================

function detectJLPTLevel(slug: string, title: string): string | null {
  const combined = (slug + ' ' + title).toLowerCase();

  if (combined.includes('n5') || combined.includes('jlpt-n5')) return 'N5';
  if (combined.includes('n4') || combined.includes('jlpt-n4')) return 'N4';
  if (combined.includes('n3') || combined.includes('jlpt-n3')) return 'N3';
  if (combined.includes('n2') || combined.includes('jlpt-n2')) return 'N2';
  if (combined.includes('n1') || combined.includes('jlpt-n1')) return 'N1';

  // Estimate based on content
  if (combined.includes('basic') || combined.includes('beginner')) return 'N5';
  if (combined.includes('intermediate')) return 'N3';
  if (combined.includes('advanced')) return 'N2';

  return null;
}

// ============================================
// SLUG EXTRACTION
// ============================================

function extractSlug(filename: string): string {
  // Remove prefix and extension
  let slug = filename
    .replace('practice-japanese.com_docs_', '')
    .replace('.json', '');

  return slug;
}

// ============================================
// CLEAN CONTENT
// ============================================

function cleanContent(content: string): string {
  // Remove footer content
  const footerPatterns = [
    /About\s+Pricing\s+Blog\s+Contact/gi,
    /Privacy Policy\s+Terms of Service\s+Cookie Policy/gi,
    /Company\s+About\s+Pricing/gi,
    /Legal\s+Privacy Policy/gi,
  ];

  let cleaned = content;
  for (const pattern of footerPatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }

  return cleaned;
}

// ============================================
// PROCESS SECTIONS
// ============================================

function processSections(sections: RawSection[] | undefined): ProcessedSection[] {
  if (!sections) return [];

  return sections
    .filter(section => {
      // Filter out footer sections
      const heading = section.heading.toLowerCase();
      return !['company', 'legal', 'about', 'pricing', 'contact'].includes(heading);
    })
    .map(section => ({
      level: section.level,
      heading: section.heading,
      content: cleanContent(section.content),
      children: section.children ? processSections(section.children) : undefined,
    }));
}

// ============================================
// PROCESS EXAMPLES
// ============================================

function processExamples(examples: { sentence: string }[] | undefined): string[] {
  if (!examples) return [];

  return examples
    .map(e => e.sentence)
    .filter(s => {
      // Filter out navigation/footer content
      const lower = s.toLowerCase();
      return !['about', 'pricing', 'blog', 'contact', 'privacy policy', 'terms of service', 'cookie policy'].includes(lower);
    });
}

// ============================================
// MAIN PROCESSING
// ============================================

async function processGrammarFiles(): Promise<void> {
  console.log('Processing grammar files...\n');

  const files = fs.readdirSync(GRAMMAR_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} grammar files\n`);

  const topics: ProcessedGrammarTopic[] = [];
  const categories: Record<string, number> = {};

  for (const file of files) {
    try {
      const filePath = path.join(GRAMMAR_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data: RawGrammarFile = JSON.parse(content);

      const slug = extractSlug(file);
      const title = data.data.metadata?.title || slug.replace(/-/g, ' ');
      const category = detectCategory(slug, title);
      const jlptLevel = detectJLPTLevel(slug, title);

      categories[category] = (categories[category] || 0) + 1;

      const topic: ProcessedGrammarTopic = {
        slug,
        title,
        source_url: data.url,
        category,
        jlpt_level: jlptLevel,
        sections: processSections(data.data.sections),
        examples: processExamples(data.data.examples),
      };

      topics.push(topic);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Write processed data
  const outputPath = path.join(OUTPUT_DIR, 'grammar-topics.json');
  fs.writeFileSync(outputPath, JSON.stringify(topics, null, 2));
  console.log(`\nWritten ${topics.length} topics to ${outputPath}`);

  // Print category summary
  console.log('\nCategory Summary:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Generate SQL for Supabase
  generateSQL(topics);
}

// ============================================
// GENERATE SQL
// ============================================

function generateSQL(topics: ProcessedGrammarTopic[]): void {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260101_import_grammar_topics.sql');

  let sql = `-- Grammar Topics Import
-- Generated from practice-japanese data
-- Total topics: ${topics.length}

-- Create grammar_topics table if not exists
CREATE TABLE IF NOT EXISTS grammar_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL,
  jlpt_level TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  examples JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_jlpt ON grammar_topics(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_slug ON grammar_topics(slug);

-- Insert topics
`;

  for (const topic of topics) {
    const escapedTitle = topic.title.replace(/'/g, "''");
    const sectionsJson = JSON.stringify(topic.sections).replace(/'/g, "''");
    const examplesJson = JSON.stringify(topic.examples).replace(/'/g, "''");

    sql += `
INSERT INTO grammar_topics (slug, title, source_url, category, jlpt_level, sections, examples)
VALUES (
  '${topic.slug}',
  '${escapedTitle}',
  '${topic.source_url}',
  '${topic.category}',
  ${topic.jlpt_level ? `'${topic.jlpt_level}'` : 'NULL'},
  '${sectionsJson}'::jsonb,
  '${examplesJson}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  source_url = EXCLUDED.source_url,
  category = EXCLUDED.category,
  jlpt_level = EXCLUDED.jlpt_level,
  sections = EXCLUDED.sections,
  examples = EXCLUDED.examples,
  updated_at = NOW();
`;
  }

  fs.writeFileSync(sqlPath, sql);
  console.log(`\nGenerated SQL migration at ${sqlPath}`);
}

// Run
processGrammarFiles().catch(console.error);
