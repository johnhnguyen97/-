/**
 * Import N1 JLPT Verbs Script
 *
 * Imports N1 level verbs from jlpt-n1-verbs.json into the Supabase verbs table.
 *
 * Run with: npx tsx scripts/import-n1-verbs.ts
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

// File path
const N1_FILE = path.join(__dirname, '../public/data/jlpt-n1-verbs.json');

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

// Convert reading to romaji
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
  k: string; // Kanji form
  r: string; // Reading (hiragana)
  p: string[]; // Part of speech
  t: string[]; // Tags
  m: string[]; // Meanings
}

interface VerbFile {
  version: string;
  category: string;
  source: string;
  count: number;
  data: VerbEntry[];
}

async function importN1Verbs() {
  console.log('Importing N1 JLPT verbs...\n');

  if (!fs.existsSync(N1_FILE)) {
    console.error(`File not found: ${N1_FILE}`);
    process.exit(1);
  }

  console.log(`Reading ${path.basename(N1_FILE)}...`);
  const rawData = fs.readFileSync(N1_FILE, 'utf-8');
  const verbFile: VerbFile = JSON.parse(rawData);

  console.log(`Found ${verbFile.data.length} N1 verbs`);

  // Filter out non-verb entries (like adjectives)
  const verbs = verbFile.data.filter(v => {
    const pos = v.p || [];
    return pos.some(p => p.startsWith('v') && p !== 'vi' && p !== 'vt');
  });

  console.log(`Filtered to ${verbs.length} verb entries`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches
  const BATCH_SIZE = 50;

  for (let i = 0; i < verbs.length; i += BATCH_SIZE) {
    const batch = verbs.slice(i, i + BATCH_SIZE);

    const recordsWithDupes = batch
      .filter(v => v.r && v.m && v.m.length > 0)
      .map(verb => {
        const dictionaryForm = verb.k || verb.r;
        const verbGroup = getVerbGroup(verb.p || []);

        return {
          dictionary_form: dictionaryForm,
          reading: verb.r,
          romaji: toRomaji(verb.r),
          meaning: verb.m.slice(0, 5).join('; '),
          verb_group: verbGroup,
          jlpt_level: 'N1',
          is_transitive: isTransitive(verb.p || []),
          tags: verb.t || [],
          frequency: 4, // N1 verbs are less common, default to lower frequency
        };
      });

    // Deduplicate by dictionary_form within the batch
    const seenForms = new Set<string>();
    const records = recordsWithDupes.filter(r => {
      if (seenForms.has(r.dictionary_form)) {
        return false;
      }
      seenForms.add(r.dictionary_form);
      return true;
    });

    if (records.length === 0) {
      skipped += batch.length;
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
        errors += batch.length;
      } else {
        imported += records.length;
        console.log(`  Imported batch ${Math.floor(i / BATCH_SIZE) + 1}: ${records.length} verbs`);
      }
    } catch (err) {
      console.error(`Exception at batch ${i}:`, err);
      errors += batch.length;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total imported: ${imported}`);
  console.log(`Total skipped: ${skipped}`);
  console.log(`Total errors: ${errors}`);

  // Verify count
  const { count } = await supabase
    .from('verbs')
    .select('*', { count: 'exact', head: true })
    .eq('jlpt_level', 'N1');

  console.log(`\nN1 verbs in database: ${count}`);
}

// Run the import
importN1Verbs().catch(console.error);
