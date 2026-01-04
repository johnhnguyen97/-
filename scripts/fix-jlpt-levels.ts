/**
 * JLPT Level Fix Migration Script
 *
 * This script fixes incorrectly labeled JLPT levels in the verbs table.
 * Many common N5 verbs were mislabeled as N2, N3, or N4.
 *
 * Run with: npx ts-node scripts/fix-jlpt-levels.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Standard JLPT N5 verbs that need to be fixed
// These are core verbs that every N5 learner should know
const N5_VERBS: string[] = [
  // Existence & State
  'ある', 'いる', 'なる', 'できる',

  // Movement
  '行く', '来る', '帰る', '出る', '入る', '歩く', '走る', '泳ぐ',
  '乗る', '降りる', '立つ', '座る', '止まる', '曲がる', '渡る',

  // Actions - Daily Life
  '食べる', '飲む', '作る', '買う', '売る', '使う', '持つ', '取る',
  '置く', '入れる', '出す', '開ける', '閉める', '付ける', '消す',
  '切る', '押す', '引く', '洗う', '浴びる',

  // Communication & Senses
  '見る', '聞く', '読む', '書く', '話す', '言う', '教える', '習う',
  '勉強する', '歌う', '弾く', '撮る',

  // Cognition
  '分かる', '知る', '思う', '覚える', '忘れる',

  // Time & Schedule
  '起きる', '寝る', '休む', '働く', '遊ぶ', '待つ', '始める', '終わる',

  // Clothing
  '着る', '脱ぐ', '履く',

  // Giving & Receiving
  'あげる', 'もらう', 'くれる', '貸す', '借りる', '返す',
  '送る', '届く', '届ける', '払う', '見せる',

  // State Changes
  '上げる', '下げる', '変わる', '直す', '壊す', '壊れる',
  '落とす', '落ちる', '並ぶ', '並べる',

  // Emotions & Conditions
  '会う', '困る', '疲れる',

  // Other Common
  '要る', '違う', 'する', 'かかる', 'かける', 'つける',

  // Suru verbs commonly tested at N5
  '散歩する', '料理する', '掃除する', '洗濯する', '買い物する',
  '旅行する', '結婚する', '電話する', '運動する', '練習する',
];

interface VerbUpdate {
  dictionary_form: string;
  old_level: string;
  new_level: string;
}

async function fixJlptLevels(): Promise<void> {
  console.log('🔧 JLPT Level Fix Migration');
  console.log('===========================\n');

  const updates: VerbUpdate[] = [];
  const notFound: string[] = [];
  const alreadyN5: string[] = [];

  // Process each N5 verb
  for (const verb of N5_VERBS) {
    // Check current level
    const { data, error } = await supabase
      .from('verbs')
      .select('id, dictionary_form, jlpt_level')
      .eq('dictionary_form', verb)
      .single();

    if (error || !data) {
      notFound.push(verb);
      continue;
    }

    if (data.jlpt_level === 'N5') {
      alreadyN5.push(verb);
      continue;
    }

    // Update to N5
    const { error: updateError } = await supabase
      .from('verbs')
      .update({ jlpt_level: 'N5' })
      .eq('id', data.id);

    if (updateError) {
      console.error(`❌ Failed to update ${verb}:`, updateError.message);
    } else {
      updates.push({
        dictionary_form: verb,
        old_level: data.jlpt_level,
        new_level: 'N5',
      });
    }
  }

  // Print results
  console.log('✅ Updated verbs to N5:');
  if (updates.length === 0) {
    console.log('   (none)');
  } else {
    for (const u of updates) {
      console.log(`   ${u.dictionary_form}: ${u.old_level} → ${u.new_level}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updates.length}`);
  console.log(`   Already N5: ${alreadyN5.length}`);
  console.log(`   Not found: ${notFound.length}`);

  if (notFound.length > 0) {
    console.log(`\n⚠️ Verbs not found in database:`);
    console.log(`   ${notFound.join(', ')}`);
  }

  // Verify the fix
  console.log('\n🔍 Verification - Sample N5 verbs:');
  const sampleVerbs = ['食べる', '飲む', '行く', '来る', '見る', '聞く', '読む', '書く'];

  const { data: verification } = await supabase
    .from('verbs')
    .select('dictionary_form, jlpt_level')
    .in('dictionary_form', sampleVerbs);

  if (verification) {
    for (const v of verification) {
      const status = v.jlpt_level === 'N5' ? '✓' : '✗';
      console.log(`   ${status} ${v.dictionary_form}: ${v.jlpt_level}`);
    }
  }

  // Count N5 verbs with sentences
  const { count: n5WithSentences } = await supabase
    .from('verbs')
    .select('id', { count: 'exact' })
    .eq('jlpt_level', 'N5')
    .not('id', 'is', null);

  const { data: sentenceCoverage } = await supabase
    .rpc('count_n5_verbs_with_sentences');

  console.log(`\n📈 N5 Sentence Coverage:`);
  console.log(`   Total N5 verbs: ${n5WithSentences}`);

  if (sentenceCoverage) {
    console.log(`   With sentences: ${sentenceCoverage}`);
  }
}

// Run the migration
fixJlptLevels()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  });
