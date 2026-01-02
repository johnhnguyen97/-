/**
 * Import all grammar examples from JSON files into Supabase grammar_examples table
 * Extracts Japanese sentences and their English translations from content
 * Run with: npx tsx scripts/import-grammar-examples.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const GRAMMAR_JSON_DIR = 'C:/Users/jnguyen/Documents/Project/web-scraper/data/practice-japanese';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Section {
  level?: number;
  heading?: string;
  content?: string;
  children?: Section[];
}

interface GrammarFile {
  config_name?: string;
  url?: string;
  data?: {
    title?: string;
    jlpt_level?: string;
    sections?: Section[];
  };
}

// Regex patterns to extract Japanese sentences with English translations
const EXAMPLE_PATTERNS = [
  // Pattern: Japanese "English"
  /([ぁ-んァ-ン一-龯々〆〤、。！？「」『』（）\w\s]+)\s*[""「『]([^""」』]+)[""」』]/g,
  // Pattern: Japanese → romaji (English meaning)
  /([ぁ-んァ-ン一-龯々]+(?:[ぁ-んァ-ン一-龯\s、]+)?)\s*→?\s*\(([^)]+)\)/g,
];

// Check if string contains Japanese characters
function containsJapanese(str: string): boolean {
  return /[ぁ-んァ-ン一-龯]/.test(str);
}

// Check if string looks like English
function isEnglish(str: string): boolean {
  // More than 50% ASCII letters
  const letters = str.match(/[a-zA-Z]/g) || [];
  return letters.length > str.length * 0.3;
}

function extractExamplesFromContent(content: string, topicSlug: string, jlptLevel: string | null, context: string): any[] {
  const examples: any[] = [];
  const seen = new Set<string>();

  // Split content by newlines and look for Japanese sentence + English translation pairs
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern 1: Line has Japanese followed by quoted English
    // e.g., 朝起きて、朝ご飯を食べて、学校に行きます "I wake up, eat breakfast, and go to school"
    const quotedMatch = line.match(/^([ぁ-んァ-ン一-龯々〆、。！？（）\s\w]+?)\s*[""「『]([^""」』]+)[""」』]$/);
    if (quotedMatch) {
      const japanese = quotedMatch[1].trim();
      const english = quotedMatch[2].trim();
      if (japanese && english && !seen.has(japanese)) {
        seen.add(japanese);
        examples.push({
          japanese,
          english,
          romaji: null,
          source_topic: topicSlug,
          context,
          jlpt_level: jlptLevel,
          tags: []
        });
      }
      continue;
    }

    // Pattern 2: Japanese line followed by English line
    if (containsJapanese(line) && !line.includes('→') && !line.includes('|')) {
      const nextLine = lines[i + 1];
      if (nextLine && isEnglish(nextLine) && !containsJapanese(nextLine)) {
        const japanese = line.trim();
        const english = nextLine.replace(/^["「『]|["」』]$/g, '').trim();
        if (japanese.length > 3 && english.length > 3 && !seen.has(japanese)) {
          seen.add(japanese);
          examples.push({
            japanese,
            english,
            romaji: null,
            source_topic: topicSlug,
            context,
            jlpt_level: jlptLevel,
            tags: []
          });
          i++; // Skip the English line
        }
      }
    }
  }

  return examples;
}

function processSection(section: Section, topicSlug: string, jlptLevel: string | null, parentContext: string = ''): any[] {
  const examples: any[] = [];
  const context = section.heading || parentContext;

  if (section.content) {
    const extracted = extractExamplesFromContent(section.content, topicSlug, jlptLevel, context);
    examples.push(...extracted);
  }

  if (section.children && Array.isArray(section.children)) {
    for (const child of section.children) {
      examples.push(...processSection(child, topicSlug, jlptLevel, context));
    }
  }

  return examples;
}

async function main() {
  console.log('Starting grammar examples import...');

  // Get all JSON files
  const files = fs.readdirSync(GRAMMAR_JSON_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`Found ${files.length} JSON files`);

  let totalExamples = 0;
  let allExamples: any[] = [];

  for (const file of files) {
    const filePath = path.join(GRAMMAR_JSON_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const topic: GrammarFile = JSON.parse(content);
      const slug = file.replace('.json', '');
      const jlptLevel = topic.data?.jlpt_level || null;

      if (topic.data?.sections && Array.isArray(topic.data.sections)) {
        for (const section of topic.data.sections) {
          const examples = processSection(section, slug, jlptLevel);
          allExamples.push(...examples);
        }
      }
    } catch (err) {
      console.error(`Error parsing ${file}:`, err);
    }
  }

  // Deduplicate by japanese text
  const uniqueExamples: any[] = [];
  const seenJapanese = new Set<string>();
  for (const ex of allExamples) {
    if (!seenJapanese.has(ex.japanese)) {
      seenJapanese.add(ex.japanese);
      uniqueExamples.push(ex);
    }
  }

  totalExamples = uniqueExamples.length;
  console.log(`Extracted ${allExamples.length} examples, ${totalExamples} unique`);

  if (totalExamples === 0) {
    console.log('No examples found. Check extraction patterns.');
    return;
  }

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < uniqueExamples.length; i += BATCH_SIZE) {
    const batch = uniqueExamples.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('grammar_examples')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch at ${i}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${totalExamples} examples`);
    }
  }

  console.log('\nImport complete!');
  console.log(`Total examples inserted: ${inserted}`);
}

main().catch(console.error);
