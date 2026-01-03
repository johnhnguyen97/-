/**
 * Import combined grammar topics to Supabase database
 * Uses the Supabase client to upsert topics
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const COMBINED_FILE = path.join(__dirname, '../grammar-data/combined-topics.json');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Grammar Import to Database ===\n');

  // Load combined topics
  const topics = JSON.parse(fs.readFileSync(COMBINED_FILE, 'utf8'));
  console.log(`Loaded ${topics.length} topics from combined-topics.json`);

  // Transform topics to database format
  const dbRecords = topics.map(topic => ({
    slug: topic.id,
    pattern: topic.pattern || '',
    name: topic.name,
    name_japanese: topic.nameJapanese || '',
    category: topic.category,
    jlpt_level: topic.level,

    // Chapter info
    chapter_id: topic.chapterId,
    chapter_order: topic.chapterOrder,
    chapter_title: topic.chapterTitle,
    chapter_title_japanese: topic.chapterTitleJapanese,

    // Core content
    description: topic.description || '',
    usage: topic.usage || '',
    notes: topic.notes || '',

    // Study materials (as JSONB)
    examples: topic.examples || [],
    key_points: topic.keyPoints || [],
    common_mistakes: topic.commonMistakes || [],
    practice_tips: topic.practiceTips || [],
    conjugation_rules: topic.conjugationRules || [],
    related_patterns: topic.relatedPatterns || [],

    // Full content
    sections: topic.sections || [],
    source_url: topic.sourceUrl || ''
  }));

  console.log(`\nImporting to database in batches...`);

  // Import in batches of 50
  const batchSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < dbRecords.length; i += batchSize) {
    const batch = dbRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('grammar_topics')
      .upsert(batch, {
        onConflict: 'slug',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`  Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      process.stdout.write(`  Imported: ${imported}/${dbRecords.length}\r`);
    }
  }

  console.log(`\n\n=== Import Complete ===`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(console.error);
