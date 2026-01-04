/**
 * JLPT Level Fix Migration Script v2
 *
 * This script:
 * 1. Promotes verbs that have N5 example sentences to N5
 * 2. Demotes fake N5 verbs (slang, compound expressions) to N3
 *
 * Run with: npx ts-node scripts/fix-jlpt-levels-v2.ts
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

// Patterns that indicate a verb is NOT a basic N5 verb
const FAKE_N5_PATTERNS = [
  // Compound expressions with particles
  /を.+る$/,  // ~をXXる patterns like いちゃもんを付ける
  /が.+く$/,  // ~がXXく patterns
  // Katakana slang/loanwords
  /^[ァ-ヺー]+る$/,  // Pure katakana verbs like ググる, コピる
  /^[ァ-ヺー]+する$/,  // Katakana + suru
  // Obscure compound verbs
  /っ.{2,}る$/,  // Colloquial っ forms like くっちゃべる
  /ぶっ.+る$/,  // ぶっ prefix verbs
  /おっ.+る$/,  // おっ prefix verbs
];

// Known fake N5 verbs to demote (explicitly listed)
const FAKE_N5_VERBS = [
  'ググる', 'コピる', 'コピーする', 'テンパる', 'チクる',
  'いちゃもんを付ける', 'エンジンを吹かす', 'ギプスを嵌める',
  'ケリが付く', 'ケリを付ける', 'スパートを掛ける', 'タバコを止める',
  'プレッシャーを掛ける', 'ピンを撥ねる', 'はたきを掛ける',
  'アイロンを掛ける', 'のしを付ける',
  'おっ始める', 'おっ魂消る', 'ぶっ魂消る', 'ぶっち切る',
  'くっちゃべる', 'はっちゃける', 'ふて腐れる',
  'しゃしゃり出る', 'たらし込む', 'へばる',
  'くず折れる', 'かき暮れる', 'しな垂れかかる', 'しな垂れる',
  'べた付く', 'こじ付ける', 'どやし付ける',
  'パチ放く', 'ブー垂れる', 'し吹く',
  'で御座る', 'てる', 'たげる',
  'しろと言う', 'せよと言う',
  'とっ捕まえる', 'ふん捕まえる',
  'はめ倒す',
];

// Additional common N5 verbs to promote (based on example_sentences data)
const ADDITIONAL_N5_VERBS = [
  // Existence/State (kanji variants)
  '有る', '居る', '出来る', '成る',
  // Common daily verbs
  '降る', '見える', '死ぬ', '遅れる', '過ぎる', '眠る', '笑う',
  '住む', '出かける', '急ぐ', '着く', '手伝う', '始まる', '開く',
  '泣く', '止める', '起こる', '探す', '信じる', '上がる', '間違う',
  '戻る', '続く', '近づく', '怒る', '楽しむ', '間に合う', '登る',
  '生きる', '驚く', '考える', '吹く', '痛む', '晴れる', '受ける',
  '消える', '勝つ', '鳴る', '呼ぶ', '燃える', '聞こえる', '慣れる',
  '決める', '決まる', '負ける', '残る', '触る', '逃げる', '捨てる',
  '拾う', '試す', '調べる', '選ぶ', '集める', '集まる', '比べる',
  '似る', '足りる', '増える', '減る', '通る', '通う', '動く',
  '働く', '光る', '輝く', '響く', '揺れる', '震える', '飛ぶ',
  '投げる', '受け取る', '届く', '届ける', '預ける', '預かる',
  // である is special - keep at N3 as it's more formal
];

async function fixJlptLevels(): Promise<void> {
  console.log('🔧 JLPT Level Fix Migration v2');
  console.log('==============================\n');

  // Stats tracking
  let promoted = 0;
  let demoted = 0;
  const promotedList: string[] = [];
  const demotedList: string[] = [];

  // =========================================================================
  // STEP 1: Demote fake N5 verbs to N3
  // =========================================================================
  console.log('📉 Step 1: Demoting fake N5 verbs...\n');

  for (const verb of FAKE_N5_VERBS) {
    const { data, error } = await supabase
      .from('verbs')
      .select('id, dictionary_form, jlpt_level')
      .eq('dictionary_form', verb)
      .eq('jlpt_level', 'N5')
      .single();

    if (!error && data) {
      const { error: updateError } = await supabase
        .from('verbs')
        .update({ jlpt_level: 'N3' })
        .eq('id', data.id);

      if (!updateError) {
        demoted++;
        demotedList.push(verb);
        console.log(`   ${verb}: N5 → N3`);
      }
    }
  }

  // Also demote pattern-matching fake N5s
  const { data: currentN5 } = await supabase
    .from('verbs')
    .select('id, dictionary_form')
    .eq('jlpt_level', 'N5');

  if (currentN5) {
    for (const verb of currentN5) {
      const matchesFakePattern = FAKE_N5_PATTERNS.some(pattern =>
        pattern.test(verb.dictionary_form)
      );

      if (matchesFakePattern && !FAKE_N5_VERBS.includes(verb.dictionary_form)) {
        const { error: updateError } = await supabase
          .from('verbs')
          .update({ jlpt_level: 'N3' })
          .eq('id', verb.id);

        if (!updateError) {
          demoted++;
          demotedList.push(verb.dictionary_form);
          console.log(`   ${verb.dictionary_form}: N5 → N3 (pattern match)`);
        }
      }
    }
  }

  // =========================================================================
  // STEP 2: Promote verbs with N5 sentences
  // =========================================================================
  console.log('\n📈 Step 2: Promoting verbs with N5 sentences...\n');

  for (const verb of ADDITIONAL_N5_VERBS) {
    const { data, error } = await supabase
      .from('verbs')
      .select('id, dictionary_form, jlpt_level')
      .eq('dictionary_form', verb)
      .neq('jlpt_level', 'N5')
      .single();

    if (!error && data) {
      // Verify it has N5 sentences
      const { count } = await supabase
        .from('example_sentences')
        .select('id', { count: 'exact', head: true })
        .eq('word_key', verb)
        .eq('jlpt_level', 'N5');

      if (count && count > 0) {
        const { error: updateError } = await supabase
          .from('verbs')
          .update({ jlpt_level: 'N5' })
          .eq('id', data.id);

        if (!updateError) {
          promoted++;
          promotedList.push(`${verb} (${data.jlpt_level}→N5, ${count} sentences)`);
          console.log(`   ${verb}: ${data.jlpt_level} → N5 (${count} N5 sentences)`);
        }
      }
    }
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n📊 Summary:');
  console.log(`   Promoted to N5: ${promoted}`);
  console.log(`   Demoted to N3: ${demoted}`);

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('\n🔍 Verification - N5 coverage after fix:');

  const { data: coverage } = await supabase.rpc('get_n5_coverage');

  // Manual coverage check
  const { count: totalN5 } = await supabase
    .from('verbs')
    .select('id', { count: 'exact', head: true })
    .eq('jlpt_level', 'N5');

  const { data: withSentences } = await supabase
    .from('verbs')
    .select('id')
    .eq('jlpt_level', 'N5')
    .not('id', 'is', null);

  // Count N5 verbs with example sentences
  const { data: n5VerbsWithSentences } = await supabase
    .rpc('count_verbs_with_sentences', { level: 'N5' });

  // Fallback: do a join count
  const { count: verbsWithSentenceCount } = await supabase
    .from('verbs')
    .select('id, example_sentences!inner(id)', { count: 'exact', head: true })
    .eq('jlpt_level', 'N5');

  console.log(`   Total N5 verbs: ${totalN5}`);
  console.log(`   With sentences: ${verbsWithSentenceCount || 'calculating...'}`);

  if (totalN5 && verbsWithSentenceCount) {
    const pct = ((verbsWithSentenceCount / totalN5) * 100).toFixed(1);
    console.log(`   Coverage: ${pct}%`);
  }

  // Sample check
  console.log('\n✓ Sample common N5 verbs:');
  const samples = ['食べる', '飲む', '行く', '見る', '有る', '居る', '出来る'];
  for (const s of samples) {
    const { data } = await supabase
      .from('verbs')
      .select('jlpt_level')
      .eq('dictionary_form', s)
      .single();
    console.log(`   ${s}: ${data?.jlpt_level || 'not found'}`);
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
