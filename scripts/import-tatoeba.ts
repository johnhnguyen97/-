/**
 * Import Tatoeba Sentences Script
 *
 * Imports Japanese-English sentence pairs from the jpn-eng-examples.json file
 * into the Supabase example_sentences table.
 *
 * Run with: npx tsx scripts/import-tatoeba.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// File paths
const TATOEBA_FILE = path.join(__dirname, 'data/jpn-eng-examples.json');

// JLPT level estimation based on sentence complexity
function estimateJLPTLevel(sentence: string, words: any[]): string {
  const charCount = sentence.length;
  const wordCount = words?.length || 0;

  // Simple heuristic based on sentence length and word count
  if (charCount <= 15 && wordCount <= 5) return 'N5';
  if (charCount <= 25 && wordCount <= 8) return 'N4';
  if (charCount <= 40 && wordCount <= 12) return 'N3';
  if (charCount <= 60 && wordCount <= 18) return 'N2';
  return 'N1';
}

// Extract verb dictionary forms from sentence words
function extractVerbKeys(words: any[]): string[] {
  if (!words) return [];

  return words
    .filter(w => {
      // Look for verbs based on common verb headword patterns
      const headword = w.headword || '';
      return headword.endsWith('る') ||
             headword.endsWith('す') ||
             headword.endsWith('く') ||
             headword.endsWith('ぐ') ||
             headword.endsWith('む') ||
             headword.endsWith('ぶ') ||
             headword.endsWith('ぬ') ||
             headword.endsWith('つ') ||
             headword.endsWith('う');
    })
    .map(w => w.headword)
    .filter(Boolean);
}

interface TatoebaSentence {
  id: string;
  text: string;
  translation: string;
  words?: Array<{
    headword?: string;
    reading?: string;
    surfaceForm?: string;
  }>;
}

async function importTatoebaSentences() {
  console.log('Reading Tatoeba sentences file...');

  if (!fs.existsSync(TATOEBA_FILE)) {
    console.error(`File not found: ${TATOEBA_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(TATOEBA_FILE, 'utf-8');
  const sentences: TatoebaSentence[] = JSON.parse(rawData);

  console.log(`Found ${sentences.length} sentences`);

  // Process in batches
  const BATCH_SIZE = 500;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Statistics by JLPT level
  const levelCounts: Record<string, number> = {
    N5: 0, N4: 0, N3: 0, N2: 0, N1: 0
  };

  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    const batch = sentences.slice(i, i + BATCH_SIZE);

    const records = batch.map(sentence => {
      const verbKeys = extractVerbKeys(sentence.words || []);
      const jlptLevel = estimateJLPTLevel(sentence.text, sentence.words || []);

      levelCounts[jlptLevel]++;

      return {
        tatoeba_id: parseInt(sentence.id, 10),
        japanese: sentence.text,
        english: sentence.translation,
        word_key: verbKeys[0] || null, // Primary verb
        word_reading: sentence.words?.find(w => w.headword === verbKeys[0])?.reading || null,
        jlpt_level: jlptLevel,
      };
    }).filter(r => r.japanese && r.english); // Only include valid records

    if (records.length === 0) {
      skipped += batch.length;
      continue;
    }

    try {
      const { error } = await supabase
        .from('example_sentences')
        .upsert(records, {
          onConflict: 'tatoeba_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.error(`Batch error at ${i}:`, error.message);
        errors += batch.length;
      } else {
        imported += records.length;
      }
    } catch (err) {
      console.error(`Exception at batch ${i}:`, err);
      errors += batch.length;
    }

    // Progress update
    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= sentences.length) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, sentences.length)}/${sentences.length} (${imported} imported, ${skipped} skipped, ${errors} errors)`);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total sentences: ${sentences.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('\nBy JLPT Level:');
  for (const [level, count] of Object.entries(levelCounts)) {
    console.log(`  ${level}: ${count}`);
  }
}

// Run the import
importTatoebaSentences().catch(console.error);
