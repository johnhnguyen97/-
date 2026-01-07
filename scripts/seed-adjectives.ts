/**
 * Seed adjectives table with i-adjectives and their conjugations
 *
 * Usage: npx tsx scripts/seed-adjectives.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_ADJECTIVES } from '../src/data/adjectives/common-adjectives';
import { generateAllAdjectiveConjugations } from '../src/lib/grammar-engine/conjugator';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdjectives() {
  console.log(`\n🌱 Seeding ${ALL_ADJECTIVES.length} i-adjectives...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const adjective of ALL_ADJECTIVES) {
    try {
      // Generate all conjugations using grammar engine
      const conjugations = generateAllAdjectiveConjugations(
        adjective.dictionary_form,
        adjective.reading
      );

      // Convert to database format
      const conjugationsJson = Object.fromEntries(
        Object.entries(conjugations).map(([key, val]) => [
          key,
          {
            kanji: val.kanji,
            reading: val.reading,
            romaji: val.romaji,
          }
        ])
      );

      // Assign frequency based on JLPT level and common usage
      let frequency = 5; // Default mid-range
      if (adjective.jlpt_level === 'N5') {
        // N5 adjectives are most common
        if (['いい', 'おいしい', '大きい', '小さい', '高い', '安い', '新しい', '古い'].includes(adjective.dictionary_form)) {
          frequency = 10; // Very common
        } else {
          frequency = 8;
        }
      } else if (adjective.jlpt_level === 'N4') {
        frequency = 6;
      }

      // Insert into database
      const { error } = await supabase
        .from('adjectives')
        .upsert({
          dictionary_form: adjective.dictionary_form,
          reading: adjective.reading,
          romaji: adjective.romaji,
          meaning: adjective.meaning,
          adjective_type: adjective.adjective_type,
          jlpt_level: adjective.jlpt_level,
          frequency,
          conjugations: conjugationsJson,
        }, {
          onConflict: 'dictionary_form,reading'
        });

      if (error) {
        console.error(`❌ Error inserting ${adjective.dictionary_form}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${adjective.dictionary_form} (${adjective.reading}) - ${adjective.meaning}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${adjective.dictionary_form}:`, err);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successfully seeded: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${ALL_ADJECTIVES.length}\n`);

  // Verify by querying the database
  const { data: n5Adjectives } = await supabase
    .from('adjectives')
    .select('dictionary_form, jlpt_level')
    .eq('jlpt_level', 'N5');

  const { data: n4Adjectives } = await supabase
    .from('adjectives')
    .select('dictionary_form, jlpt_level')
    .eq('jlpt_level', 'N4');

  console.log(`✨ Verification:`);
  console.log(`   N5 adjectives in DB: ${n5Adjectives?.length || 0}`);
  console.log(`   N4 adjectives in DB: ${n4Adjectives?.length || 0}\n`);
}

seedAdjectives()
  .then(() => {
    console.log('🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
