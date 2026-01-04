/**
 * Import JLPT Verbs Script
 *
 * Imports verbs from vocab-godan-verbs.json and vocab-ichidan-verbs.json
 * into the Supabase verbs table.
 *
 * Run with: npx tsx scripts/import-jlpt-verbs.ts
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
const GODAN_FILE = path.join(__dirname, '../public/data/vocab-godan-verbs.json');
const ICHIDAN_FILE = path.join(__dirname, '../public/data/vocab-ichidan-verbs.json');

// Estimate JLPT level based on frequency and tags
function estimateJLPTLevel(verb: VerbEntry): string {
  // Check for JLPT tags
  const tags = verb.t || [];
  for (const tag of tags) {
    if (tag === 'jlpt-n5' || tag === 'N5') return 'N5';
    if (tag === 'jlpt-n4' || tag === 'N4') return 'N4';
    if (tag === 'jlpt-n3' || tag === 'N3') return 'N3';
    if (tag === 'jlpt-n2' || tag === 'N2') return 'N2';
    if (tag === 'jlpt-n1' || tag === 'N1') return 'N1';
  }

  // Estimate based on common markers
  const isCommon = tags.includes('uk') || tags.includes('col');
  const meanings = verb.m?.length || 0;

  // Simple heuristic based on commonality
  if (isCommon && meanings <= 3) return 'N5';
  if (isCommon) return 'N4';
  if (meanings <= 5) return 'N3';
  if (meanings <= 8) return 'N2';
  return 'N1';
}

// Determine verb group from part of speech tags
function getVerbGroup(posArray: string[]): string {
  for (const pos of posArray) {
    if (pos.startsWith('v5')) return 'godan';
    if (pos === 'v1' || pos.startsWith('v1')) return 'ichidan';
    if (pos === 'vs' || pos === 'vs-i' || pos === 'vs-s') return 'irregular-suru';
    if (pos === 'vk') return 'irregular-kuru';
  }
  return 'godan'; // Default
}

// Check if verb is transitive
function isTransitive(posArray: string[]): boolean | null {
  if (posArray.includes('vt')) return true;
  if (posArray.includes('vi')) return false;
  return null; // Unknown
}

// Convert reading to romaji (basic conversion)
function toRomaji(reading: string): string {
  const hiraganaToRomaji: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'っ': '', // Double consonant handled separately
    'ー': '-',
  };

  let result = '';
  let i = 0;
  while (i < reading.length) {
    // Check for two-character combinations first
    if (i < reading.length - 1) {
      const twoChar = reading.substring(i, i + 2);
      if (hiraganaToRomaji[twoChar]) {
        result += hiraganaToRomaji[twoChar];
        i += 2;
        continue;
      }
    }

    // Handle small tsu (っ) - doubles the next consonant
    if (reading[i] === 'っ' && i < reading.length - 1) {
      const nextChar = reading[i + 1];
      const nextRomaji = hiraganaToRomaji[nextChar];
      if (nextRomaji) {
        result += nextRomaji[0]; // Double the consonant
      }
      i++;
      continue;
    }

    const char = reading[i];
    result += hiraganaToRomaji[char] || char;
    i++;
  }

  return result;
}

interface VerbEntry {
  id: string;
  k: string | null; // Kanji form
  r: string; // Reading (hiragana)
  c: number; // Count/frequency
  p: string[]; // Part of speech
  f: string[] | null; // Fields
  d: string[] | null; // Dialects
  t: string[] | null; // Tags
  m: string[]; // Meanings
}

interface VerbFile {
  version: string;
  category: string;
  count: number;
  data: VerbEntry[];
}

async function importVerbs() {
  console.log('Importing JLPT verbs...\n');

  const files = [
    { path: GODAN_FILE, defaultGroup: 'godan' },
    { path: ICHIDAN_FILE, defaultGroup: 'ichidan' },
  ];

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const levelCounts: Record<string, number> = {
    N5: 0, N4: 0, N3: 0, N2: 0, N1: 0
  };

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }

    console.log(`Reading ${path.basename(file.path)}...`);
    const rawData = fs.readFileSync(file.path, 'utf-8');
    const verbFile: VerbFile = JSON.parse(rawData);

    console.log(`Found ${verbFile.count} verbs (${verbFile.category})`);

    // Process in batches
    const BATCH_SIZE = 100;
    const verbs = verbFile.data;

    for (let i = 0; i < verbs.length; i += BATCH_SIZE) {
      const batch = verbs.slice(i, i + BATCH_SIZE);

      const recordsWithDupes = batch
        .filter(v => v.r && v.m && v.m.length > 0) // Must have reading and meaning
        .map(verb => {
          const dictionaryForm = verb.k || verb.r; // Use kanji if available, else reading
          const verbGroup = getVerbGroup(verb.p || []);
          const jlptLevel = estimateJLPTLevel(verb);

          levelCounts[jlptLevel]++;

          return {
            dictionary_form: dictionaryForm,
            reading: verb.r,
            romaji: toRomaji(verb.r),
            meaning: verb.m.slice(0, 5).join('; '), // First 5 meanings
            verb_group: verbGroup,
            jlpt_level: jlptLevel,
            is_transitive: isTransitive(verb.p || []),
            tags: verb.t || [],
            frequency: Math.min(10, Math.max(1, 11 - (verb.c || 5))), // Convert count to frequency
          };
        });

      // Deduplicate by dictionary_form within the batch (keep first occurrence)
      const seenForms = new Set<string>();
      const records = recordsWithDupes.filter(r => {
        if (seenForms.has(r.dictionary_form)) {
          return false;
        }
        seenForms.add(r.dictionary_form);
        return true;
      });

      if (records.length === 0) {
        totalSkipped += batch.length;
        continue;
      }

      try {
        const { error } = await supabase
          .from('verbs')
          .upsert(records, {
            onConflict: 'dictionary_form',
            ignoreDuplicates: false // Update existing records
          });

        if (error) {
          console.error(`Batch error at ${i}:`, error.message);
          totalErrors += batch.length;
        } else {
          totalImported += records.length;
        }
      } catch (err) {
        console.error(`Exception at batch ${i}:`, err);
        totalErrors += batch.length;
      }

      // Progress update
      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= verbs.length) {
        console.log(`  Progress: ${Math.min(i + BATCH_SIZE, verbs.length)}/${verbs.length}`);
      }
    }

    console.log('');
  }

  console.log('=== Import Complete ===');
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('\nBy JLPT Level:');
  for (const [level, count] of Object.entries(levelCounts)) {
    console.log(`  ${level}: ${count}`);
  }
}

// Run the import
importVerbs().catch(console.error);
