import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET not set');
  }
  return scryptSync(secret, salt, KEY_LENGTH);
}

function decrypt(data: { encrypted: string; iv: string; authTag: string; salt: string }): string {
  const salt = Buffer.from(data.salt, 'base64');
  const key = getEncryptionKey(salt);
  const iv = Buffer.from(data.iv, 'base64');
  const authTag = Buffer.from(data.authTag, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

interface GrammarAtom {
  component: string;
  type: string;
  meaning?: string;
}

interface GrammarNote {
  atomicBreakdown?: GrammarAtom[];
}

interface WordEntry {
  english?: string;
  japanese?: string;
  reading?: string;
  romaji?: string;
  partOfSpeech?: string;
  role?: string;
}

interface TranslationResult {
  fullTranslation?: string;
  words?: WordEntry[];
  grammarNotes?: GrammarNote[];
  _validationWarnings?: string[];
  _qualityWarnings?: string[];
}

// Common Japanese words with correct readings - used to fix Llama's frequent mistakes
const COMMON_READINGS: Record<string, { reading: string; romaji: string }> = {
  // Pronouns
  '私': { reading: 'わたし', romaji: 'watashi' },
  '僕': { reading: 'ぼく', romaji: 'boku' },
  '彼': { reading: 'かれ', romaji: 'kare' },
  '彼女': { reading: 'かのじょ', romaji: 'kanojo' },
  '私たち': { reading: 'わたしたち', romaji: 'watashitachi' },
  // Common verbs
  '食べる': { reading: 'たべる', romaji: 'taberu' },
  '食べます': { reading: 'たべます', romaji: 'tabemasu' },
  '飲む': { reading: 'のむ', romaji: 'nomu' },
  '飲みます': { reading: 'のみます', romaji: 'nomimasu' },
  '行く': { reading: 'いく', romaji: 'iku' },
  '行きます': { reading: 'いきます', romaji: 'ikimasu' },
  '来る': { reading: 'くる', romaji: 'kuru' },
  '来ます': { reading: 'きます', romaji: 'kimasu' },
  '見る': { reading: 'みる', romaji: 'miru' },
  '見ます': { reading: 'みます', romaji: 'mimasu' },
  '読む': { reading: 'よむ', romaji: 'yomu' },
  '読みます': { reading: 'よみます', romaji: 'yomimasu' },
  '書く': { reading: 'かく', romaji: 'kaku' },
  '書きます': { reading: 'かきます', romaji: 'kakimasu' },
  '話す': { reading: 'はなす', romaji: 'hanasu' },
  '話します': { reading: 'はなします', romaji: 'hanashimasu' },
  '聞く': { reading: 'きく', romaji: 'kiku' },
  '聞きます': { reading: 'ききます', romaji: 'kikimasu' },
  '買う': { reading: 'かう', romaji: 'kau' },
  '買います': { reading: 'かいます', romaji: 'kaimasu' },
  '作る': { reading: 'つくる', romaji: 'tsukuru' },
  '作ります': { reading: 'つくります', romaji: 'tsukurimasu' },
  '使う': { reading: 'つかう', romaji: 'tsukau' },
  '使います': { reading: 'つかいます', romaji: 'tsukaimasu' },
  '勉強する': { reading: 'べんきょうする', romaji: 'benkyou suru' },
  '勉強します': { reading: 'べんきょうします', romaji: 'benkyou shimasu' },
  // Common nouns
  '日本': { reading: 'にほん', romaji: 'nihon' },
  '日本語': { reading: 'にほんご', romaji: 'nihongo' },
  '英語': { reading: 'えいご', romaji: 'eigo' },
  '本': { reading: 'ほん', romaji: 'hon' },
  '人': { reading: 'ひと', romaji: 'hito' },
  '友達': { reading: 'ともだち', romaji: 'tomodachi' },
  '先生': { reading: 'せんせい', romaji: 'sensei' },
  '学生': { reading: 'がくせい', romaji: 'gakusei' },
  '学校': { reading: 'がっこう', romaji: 'gakkou' },
  '会社': { reading: 'かいしゃ', romaji: 'kaisha' },
  '仕事': { reading: 'しごと', romaji: 'shigoto' },
  '家': { reading: 'いえ', romaji: 'ie' },
  '部屋': { reading: 'へや', romaji: 'heya' },
  '電車': { reading: 'でんしゃ', romaji: 'densha' },
  '駅': { reading: 'えき', romaji: 'eki' },
  '時間': { reading: 'じかん', romaji: 'jikan' },
  '今日': { reading: 'きょう', romaji: 'kyou' },
  '明日': { reading: 'あした', romaji: 'ashita' },
  '昨日': { reading: 'きのう', romaji: 'kinou' },
  '毎日': { reading: 'まいにち', romaji: 'mainichi' },
  '朝': { reading: 'あさ', romaji: 'asa' },
  '夜': { reading: 'よる', romaji: 'yoru' },
  '水': { reading: 'みず', romaji: 'mizu' },
  '食べ物': { reading: 'たべもの', romaji: 'tabemono' },
  '飲み物': { reading: 'のみもの', romaji: 'nomimono' },
  '寿司': { reading: 'すし', romaji: 'sushi' },
  '図書館': { reading: 'としょかん', romaji: 'toshokan' },
  // Common adjectives
  '大きい': { reading: 'おおきい', romaji: 'ookii' },
  '小さい': { reading: 'ちいさい', romaji: 'chiisai' },
  '新しい': { reading: 'あたらしい', romaji: 'atarashii' },
  '古い': { reading: 'ふるい', romaji: 'furui' },
  '高い': { reading: 'たかい', romaji: 'takai' },
  '安い': { reading: 'やすい', romaji: 'yasui' },
  '美味しい': { reading: 'おいしい', romaji: 'oishii' },
  '楽しい': { reading: 'たのしい', romaji: 'tanoshii' },
  '難しい': { reading: 'むずかしい', romaji: 'muzukashii' },
  '簡単': { reading: 'かんたん', romaji: 'kantan' },
  '元気': { reading: 'げんき', romaji: 'genki' },
  '好き': { reading: 'すき', romaji: 'suki' },
};

// Validate translation quality - catch common Llama errors
function validateTranslationQuality(result: TranslationResult): string[] {
  const warnings: string[] = [];

  // Check fullTranslation exists and contains Japanese
  if (!result.fullTranslation) {
    warnings.push('Missing fullTranslation field');
  } else if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(result.fullTranslation)) {
    warnings.push('fullTranslation does not contain Japanese characters');
  }

  // Check words array
  if (!result.words || !Array.isArray(result.words)) {
    warnings.push('Missing or invalid words array');
  } else {
    let hasVerb = false;
    result.words.forEach((word, index) => {
      // Check required fields
      if (!word.japanese) {
        warnings.push(`Word ${index}: missing japanese field`);
      }
      if (!word.reading) {
        warnings.push(`Word ${index}: missing reading field`);
      } else if (/[\u4E00-\u9FAF]/.test(word.reading)) {
        // Reading contains kanji - should be hiragana only
        warnings.push(`Word ${index}: reading "${word.reading}" contains kanji (should be hiragana)`);
      }
      if (!word.romaji) {
        warnings.push(`Word ${index}: missing romaji field`);
      } else if (/[^\x00-\x7F]/.test(word.romaji)) {
        // Romaji contains non-ASCII - should be ASCII only
        warnings.push(`Word ${index}: romaji "${word.romaji}" contains non-ASCII characters`);
      }

      // Check for verb
      if (word.partOfSpeech?.toLowerCase().includes('verb')) {
        hasVerb = true;
      }
    });

    // Most sentences should have at least one verb
    if (!hasVerb && result.words.length > 2) {
      warnings.push('No verb detected in translation (unusual for a complete sentence)');
    }
  }

  return warnings;
}

// Correct common reading errors using COMMON_READINGS dictionary
function correctReadings(result: TranslationResult): void {
  if (!result.words || !Array.isArray(result.words)) return;

  result.words.forEach(word => {
    if (!word.japanese) return;

    // Check if we have a correction for this word
    const correction = COMMON_READINGS[word.japanese];
    if (correction) {
      // Only correct if current reading seems wrong
      if (word.reading && /[\u4E00-\u9FAF]/.test(word.reading)) {
        // Reading contains kanji - definitely wrong
        word.reading = correction.reading;
        word.romaji = correction.romaji;
      } else if (!word.reading || word.reading === '') {
        // Missing reading
        word.reading = correction.reading;
        word.romaji = correction.romaji;
      }
      // Also ensure romaji is correct
      if (!word.romaji || /[^\x00-\x7F]/.test(word.romaji)) {
        word.romaji = correction.romaji;
      }
    }
  });
}

// Few-shot examples for Llama - complete input/output pairs
const LLAMA_FEW_SHOT_EXAMPLES = `
=== EXAMPLE 1: Simple sentence ===
Input: "I eat sushi"
Output:
{
  "fullTranslation": "寿司を食べます",
  "wordOrderDisplay": "Object → Verb",
  "words": [
    {"english": "sushi", "japanese": "寿司", "reading": "すし", "romaji": "sushi", "partOfSpeech": "noun", "role": "object"},
    {"english": "(object marker)", "japanese": "を", "reading": "を", "romaji": "o", "partOfSpeech": "particle", "role": "particle", "particleMeaning": "marks direct object"},
    {"english": "eat", "japanese": "食べます", "reading": "たべます", "romaji": "tabemasu", "partOfSpeech": "verb", "role": "predicate"}
  ],
  "grammarNotes": [
    {
      "title": "Polite Verb Form",
      "titleJapanese": "丁寧形",
      "explanation": "食べます uses the polite ます form. The subject 私 (I) is dropped as it's obvious from context.",
      "atomicBreakdown": [
        {"component": "食べ", "type": "verb stem", "meaning": "eat (stem of 食べる)"},
        {"component": "ます", "type": "polite suffix", "meaning": "polite present/future tense"}
      ]
    }
  ]
}

=== EXAMPLE 2: Progressive form with location ===
Input: "She is reading a book at the library"
Output:
{
  "fullTranslation": "彼女は図書館で本を読んでいます",
  "wordOrderDisplay": "Topic → Location → Object → Verb",
  "words": [
    {"english": "she", "japanese": "彼女", "reading": "かのじょ", "romaji": "kanojo", "partOfSpeech": "pronoun", "role": "topic"},
    {"english": "(topic marker)", "japanese": "は", "reading": "は", "romaji": "wa", "partOfSpeech": "particle", "role": "particle", "particleMeaning": "marks topic"},
    {"english": "library", "japanese": "図書館", "reading": "としょかん", "romaji": "toshokan", "partOfSpeech": "noun", "role": "location"},
    {"english": "(location of action)", "japanese": "で", "reading": "で", "romaji": "de", "partOfSpeech": "particle", "role": "particle", "particleMeaning": "marks where action happens"},
    {"english": "book", "japanese": "本", "reading": "ほん", "romaji": "hon", "partOfSpeech": "noun", "role": "object"},
    {"english": "(object marker)", "japanese": "を", "reading": "を", "romaji": "o", "partOfSpeech": "particle", "role": "particle", "particleMeaning": "marks direct object"},
    {"english": "is reading", "japanese": "読んでいます", "reading": "よんでいます", "romaji": "yonde imasu", "partOfSpeech": "verb", "role": "predicate"}
  ],
  "grammarNotes": [
    {
      "title": "Progressive Form (ている)",
      "titleJapanese": "進行形",
      "explanation": "読んでいます shows an ongoing action. Formed with te-form + います.",
      "atomicBreakdown": [
        {"component": "読む", "type": "verb (dictionary form)", "meaning": "to read"},
        {"component": "で", "type": "te-form ending", "meaning": "conjunctive (from 読む→読んで)"},
        {"component": "い", "type": "auxiliary stem", "meaning": "from いる (to exist)"},
        {"component": "ます", "type": "polite suffix", "meaning": "polite marker"}
      ]
    }
  ]
}

=== EXAMPLE 3: Desire form with direction ===
Input: "I want to go to Japan"
Output:
{
  "fullTranslation": "日本に行きたいです",
  "wordOrderDisplay": "Destination → Verb (desire)",
  "words": [
    {"english": "Japan", "japanese": "日本", "reading": "にほん", "romaji": "nihon", "partOfSpeech": "noun", "role": "destination"},
    {"english": "(direction)", "japanese": "に", "reading": "に", "romaji": "ni", "partOfSpeech": "particle", "role": "particle", "particleMeaning": "marks destination/direction"},
    {"english": "want to go", "japanese": "行きたいです", "reading": "いきたいです", "romaji": "ikitai desu", "partOfSpeech": "verb", "role": "predicate"}
  ],
  "grammarNotes": [
    {
      "title": "Desire Form (たい)",
      "titleJapanese": "願望形",
      "explanation": "行きたい expresses 'want to go'. Formed with verb stem + たい. です adds politeness.",
      "atomicBreakdown": [
        {"component": "行く", "type": "verb (dictionary form)", "meaning": "to go"},
        {"component": "たい", "type": "desire suffix", "meaning": "want to (attached to verb stem 行き)"},
        {"component": "です", "type": "copula (polite)", "meaning": "adds politeness"}
      ]
    }
  ]
}
`;

// Known patterns that should ALWAYS be broken down
const COMPOUND_PATTERNS = [
  'ています', 'てます', 'ました', 'ません', 'ませんでした',
  'たい', 'たくない', 'たかった',
  'すぎる', 'すぎた', 'すぎない',
  'やすい', 'にくい',
  'られる', 'られた', 'させる',
  // Conjecture/volitional auxiliaries
  'でしょう', 'だろう', 'ましょう', 'ないでしょう', 'たでしょう', 'ているでしょう'
];

function validateAtomicBreakdown(result: TranslationResult): string[] {
  const errors: string[] = [];

  if (!result.grammarNotes || result.grammarNotes.length === 0) {
    return errors;
  }

  result.grammarNotes.forEach((note, noteIndex) => {
    if (!note.atomicBreakdown || note.atomicBreakdown.length === 0) {
      return;
    }

    const breakdown = note.atomicBreakdown;

    // Check 1: Must have required fields
    breakdown.forEach((atom, atomIndex) => {
      if (!atom.component || !atom.type) {
        errors.push(`Note ${noteIndex}, atom ${atomIndex}: Missing required fields (component or type)`);
      }
    });

    // Check 2: Detect if components are still grouped (contain multiple morphemes)
    breakdown.forEach((atom, atomIndex) => {
      const comp = atom.component;

      // Check for known compound patterns that weren't broken down
      COMPOUND_PATTERNS.forEach(pattern => {
        if (comp.includes(pattern) && comp !== pattern) {
          errors.push(`Note ${noteIndex}, atom ${atomIndex}: "${comp}" appears to contain compound pattern "${pattern}" - should be broken into separate components`);
        }
      });

      // Check if component has multiple hiragana particles stuck together
      if (/[をがはにのでと]{2,}/.test(comp)) {
        errors.push(`Note ${noteIndex}, atom ${atomIndex}: "${comp}" appears to contain multiple particles - should be separated`);
      }

      // Warn if component is suspiciously long (likely not atomic)
      if (comp.length > 5 && atom.type.includes('verb')) {
        errors.push(`Note ${noteIndex}, atom ${atomIndex}: Verb "${comp}" is ${comp.length} characters - verify it's fully broken down`);
      }
    });

    // Check 3: If only 1 component, it's probably not broken down enough
    if (breakdown.length === 1 && breakdown[0].component.length > 3) {
      errors.push(`Note ${noteIndex}: Only 1 component "${breakdown[0].component}" - compound words should have multiple components`);
    }
  });

  return errors;
}

// Force split components that AI didn't break down properly
function forceAtomicSplit(result: TranslationResult): void {
  if (!result.grammarNotes) return;

  result.grammarNotes.forEach(note => {
    if (!note.atomicBreakdown || note.atomicBreakdown.length === 0) return;

    const newBreakdown: GrammarAtom[] = [];

    note.atomicBreakdown.forEach(atom => {
      const comp = atom.component;
      let wasSplit = false;

      // Split: には → に + は
      if (/には|では|とは|へは|から|まで/.test(comp) && comp.length > 1) {
        const match = comp.match(/(.*?)(には|では|とは|へは|から|まで)/);
        if (match && match[1]) {
          newBreakdown.push({ component: match[1], type: 'base', meaning: atom.meaning });
          newBreakdown.push({ component: match[2], type: 'particle compound', meaning: 'particle combination' });
          wasSplit = true;
        }
      }

      // Split: 年を → 年 + を
      if (!wasSplit && comp.length > 1 && /[をがにのへとでや]$/.test(comp)) {
        const particle = comp.slice(-1);
        const base = comp.slice(0, -1);
        newBreakdown.push({ component: base, type: 'noun', meaning: atom.meaning });
        newBreakdown.push({ component: particle, type: 'particle', meaning: getParticleMeaning(particle) });
        wasSplit = true;
      }

      // Split: こんなこと → こんな + こと
      if (!wasSplit && /^(こんな|そんな|あんな|どんな)(.+)/.test(comp)) {
        const match = comp.match(/^(こんな|そんな|あんな|どんな)(.+)/);
        if (match) {
          newBreakdown.push({ component: match[1], type: 'demonstrative adjective', meaning: 'this kind of / such' });
          newBreakdown.push({ component: match[2], type: 'noun', meaning: atom.meaning || 'thing' });
          wasSplit = true;
        }
      }

      // Split: 取りすぎた → 取る + すぎ + た
      if (!wasSplit && /すぎた$/.test(comp) && comp !== 'すぎた') {
        const base = comp.replace(/すぎた$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'すぎ', type: 'auxiliary verb', meaning: 'too much / excessively' });
        newBreakdown.push({ component: 'た', type: 'auxiliary (past tense)', meaning: 'past tense marker' });
        wasSplit = true;
      }

      // Split: 取りすぎる → 取る + すぎる
      if (!wasSplit && /すぎる$/.test(comp) && comp !== 'すぎる') {
        const base = comp.replace(/すぎる$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'すぎる', type: 'auxiliary verb', meaning: 'too much / excessively' });
        wasSplit = true;
      }

      // Split: できない/できません → でき + ない/ません (potential + negative)
      if (!wasSplit && /できない$/.test(comp)) {
        const base = comp.replace(/できない$/, '');
        if (base) {
          newBreakdown.push({ component: base, type: 'noun/verb stem', meaning: atom.meaning || 'base' });
        }
        newBreakdown.push({ component: 'でき', type: 'potential stem', meaning: 'can do / be able to' });
        newBreakdown.push({ component: 'ない', type: 'negative auxiliary', meaning: 'not / negation' });
        wasSplit = true;
      }

      // Split: Noun+する verbs → Noun + する (suru-verbs)
      if (!wasSplit && /する$/.test(comp) && comp.length > 2 && comp !== 'する') {
        const base = comp.replace(/する$/, '');
        newBreakdown.push({ component: base, type: 'verbal noun', meaning: atom.meaning || 'action noun' });
        newBreakdown.push({ component: 'する', type: 'verb (dictionary)', meaning: 'to do' });
        wasSplit = true;
      }

      // Split: Noun+した → Noun + し + た (past suru-verb)
      if (!wasSplit && /した$/.test(comp) && comp.length > 2 && comp !== 'した') {
        const base = comp.replace(/した$/, '');
        newBreakdown.push({ component: base, type: 'verbal noun', meaning: atom.meaning || 'action noun' });
        newBreakdown.push({ component: 'し', type: 'verb stem', meaning: 'do (stem)' });
        newBreakdown.push({ component: 'た', type: 'past auxiliary', meaning: 'past tense' });
        wasSplit = true;
      }

      // Split: ました → まし + た
      if (!wasSplit && /ました$/.test(comp) && comp.length > 3) {
        const base = comp.replace(/ました$/, '');
        newBreakdown.push({ component: base, type: 'verb stem', meaning: atom.meaning || 'verb stem' });
        newBreakdown.push({ component: 'まし', type: 'polite suffix', meaning: 'polite marker' });
        newBreakdown.push({ component: 'た', type: 'past auxiliary', meaning: 'past tense' });
        wasSplit = true;
      }

      // Split: ています/ていた → て + い + ます/た
      if (!wasSplit && /ています$/.test(comp) && comp !== 'ています') {
        const base = comp.replace(/ています$/, '');
        newBreakdown.push({ component: base, type: 'verb stem', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'て', type: 'te-form', meaning: 'conjunctive' });
        newBreakdown.push({ component: 'い', type: 'auxiliary stem', meaning: 'exist/be' });
        newBreakdown.push({ component: 'ます', type: 'polite suffix', meaning: 'polite present' });
        wasSplit = true;
      }

      // Split: いただく patterns → いただ + く
      if (!wasSplit && /いただく$/.test(comp) && comp.length > 4) {
        const base = comp.replace(/いただく$/, '');
        newBreakdown.push({ component: base, type: 'te-form', meaning: atom.meaning || 'action' });
        newBreakdown.push({ component: 'いただく', type: 'humble auxiliary', meaning: 'receive (humble)' });
        wasSplit = true;
      }

      // Split: ている → て + いる
      if (!wasSplit && /ている$/.test(comp) && comp !== 'ている') {
        const base = comp.replace(/ている$/, '');
        newBreakdown.push({ component: base, type: 'verb stem', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'て', type: 'te-form', meaning: 'conjunctive' });
        newBreakdown.push({ component: 'いる', type: 'auxiliary', meaning: 'progressive/state' });
        wasSplit = true;
      }

      // Split: ていた → て + い + た
      if (!wasSplit && /ていた$/.test(comp) && comp !== 'ていた') {
        const base = comp.replace(/ていた$/, '');
        newBreakdown.push({ component: base, type: 'verb stem', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'て', type: 'te-form', meaning: 'conjunctive' });
        newBreakdown.push({ component: 'い', type: 'auxiliary stem', meaning: 'exist/be' });
        newBreakdown.push({ component: 'た', type: 'past auxiliary', meaning: 'past tense' });
        wasSplit = true;
      }

      // Split: 複雑だった → 複雑 + だった (na-adj/noun + past copula)
      if (!wasSplit && /だった$/.test(comp) && comp !== 'だった' && comp.length > 3) {
        const base = comp.replace(/だった$/, '');
        newBreakdown.push({ component: base, type: 'na-adjective/noun', meaning: atom.meaning || 'base word' });
        newBreakdown.push({ component: 'だった', type: 'copula (past)', meaning: 'was (past tense of だ)' });
        wasSplit = true;
      }

      // Split: 複雑だ → 複雑 + だ (na-adj/noun + copula)
      if (!wasSplit && /だ$/.test(comp) && comp !== 'だ' && comp.length > 2) {
        const base = comp.replace(/だ$/, '');
        newBreakdown.push({ component: base, type: 'na-adjective/noun', meaning: atom.meaning || 'base word' });
        newBreakdown.push({ component: 'だ', type: 'copula', meaning: 'is/am/are' });
        wasSplit = true;
      }

      // Split: 過ごしていない → 過ごす + て + い + ない (progressive negative)
      if (!wasSplit && /ていない$/.test(comp) && comp !== 'ていない') {
        const base = comp.replace(/ていない$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'て', type: 'te-form', meaning: 'conjunctive' });
        newBreakdown.push({ component: 'い', type: 'auxiliary stem', meaning: 'exist/be' });
        newBreakdown.push({ component: 'ない', type: 'negative auxiliary', meaning: 'not' });
        wasSplit = true;
      }

      // Split: 過ごしてない → verb + て + ない (casual progressive negative)
      if (!wasSplit && /てない$/.test(comp) && comp !== 'てない') {
        const base = comp.replace(/てない$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'て', type: 'te-form', meaning: 'conjunctive' });
        newBreakdown.push({ component: 'ない', type: 'negative auxiliary', meaning: 'not (casual)' });
        wasSplit = true;
      }

      // Split: ただでさえ → ただ + で + さえ (compound adverb)
      if (!wasSplit && comp === 'ただでさえ') {
        newBreakdown.push({ component: 'ただ', type: 'adverb', meaning: 'just/only/ordinary' });
        newBreakdown.push({ component: 'で', type: 'particle', meaning: 'at/by' });
        newBreakdown.push({ component: 'さえ', type: 'particle', meaning: 'even' });
        wasSplit = true;
      }

      // Split: 静かでした → 静か + でした (na-adj/noun + polite past copula)
      if (!wasSplit && /でした$/.test(comp) && comp !== 'でした' && comp.length > 3) {
        const base = comp.replace(/でした$/, '');
        newBreakdown.push({ component: base, type: 'na-adjective/noun', meaning: atom.meaning || 'base word' });
        newBreakdown.push({ component: 'でした', type: 'copula (polite past)', meaning: 'was (polite)' });
        wasSplit = true;
      }

      // Split: 簡単ではない → 簡単 + では + ない (negative copula)
      if (!wasSplit && /ではない$/.test(comp) && comp !== 'ではない') {
        const base = comp.replace(/ではない$/, '');
        newBreakdown.push({ component: base, type: 'na-adjective/noun', meaning: atom.meaning || 'base word' });
        newBreakdown.push({ component: 'では', type: 'copula + topic', meaning: 'topic marker' });
        newBreakdown.push({ component: 'ない', type: 'negative', meaning: 'not' });
        wasSplit = true;
      }

      // Split: 簡単じゃない → 簡単 + じゃ + ない (casual negative copula)
      if (!wasSplit && /じゃない$/.test(comp) && comp !== 'じゃない') {
        const base = comp.replace(/じゃない$/, '');
        newBreakdown.push({ component: base, type: 'na-adjective/noun', meaning: atom.meaning || 'base word' });
        newBreakdown.push({ component: 'じゃ', type: 'copula (casual)', meaning: 'contraction of では' });
        newBreakdown.push({ component: 'ない', type: 'negative', meaning: 'not' });
        wasSplit = true;
      }

      // Split: なるでしょう → なる + でしょう (verb + conjecture auxiliary)
      if (!wasSplit && /でしょう$/.test(comp) && comp !== 'でしょう' && comp.length > 4) {
        const base = comp.replace(/でしょう$/, '');
        newBreakdown.push({ component: base, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'でしょう', type: 'auxiliary (conjecture)', meaning: 'probably/will likely' });
        wasSplit = true;
      }

      // Split: なるだろう → なる + だろう (verb + casual conjecture)
      if (!wasSplit && /だろう$/.test(comp) && comp !== 'だろう' && comp.length > 3) {
        const base = comp.replace(/だろう$/, '');
        newBreakdown.push({ component: base, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'だろう', type: 'auxiliary (conjecture)', meaning: 'probably/will likely (casual)' });
        wasSplit = true;
      }

      // Split: 行きましょう → 行く + ましょう (verb + volitional)
      if (!wasSplit && /ましょう$/.test(comp) && comp !== 'ましょう' && comp.length > 4) {
        const base = comp.replace(/ましょう$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'ましょう', type: 'auxiliary (volitional)', meaning: "let's / shall (polite)" });
        wasSplit = true;
      }

      // Split: 行かないでしょう → 行く + ない + でしょう (negative + conjecture)
      if (!wasSplit && /ないでしょう$/.test(comp) && comp !== 'ないでしょう') {
        const base = comp.replace(/ないでしょう$/, '');
        const dictForm = guessDictionaryForm(base, 'a');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'ない', type: 'negative auxiliary', meaning: 'not' });
        newBreakdown.push({ component: 'でしょう', type: 'auxiliary (conjecture)', meaning: 'probably' });
        wasSplit = true;
      }

      // Split: 行ったでしょう → 行く + た + でしょう (past + conjecture)
      if (!wasSplit && /たでしょう$/.test(comp) && comp !== 'たでしょう') {
        const base = comp.replace(/たでしょう$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'た', type: 'past auxiliary', meaning: 'past tense' });
        newBreakdown.push({ component: 'でしょう', type: 'auxiliary (conjecture)', meaning: 'probably' });
        wasSplit = true;
      }

      // Split: 食べているでしょう → 食べる + て + いる + でしょう (progressive + conjecture)
      if (!wasSplit && /ているでしょう$/.test(comp) && comp !== 'ているでしょう') {
        const base = comp.replace(/ているでしょう$/, '');
        newBreakdown.push({ component: base, type: 'verb stem', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'て', type: 'te-form', meaning: 'conjunctive' });
        newBreakdown.push({ component: 'いる', type: 'auxiliary', meaning: 'progressive/state' });
        newBreakdown.push({ component: 'でしょう', type: 'auxiliary (conjecture)', meaning: 'probably' });
        wasSplit = true;
      }

      // Split: 食べたい → 食べる + たい (desire form)
      if (!wasSplit && /たい$/.test(comp) && comp !== 'たい' && comp.length > 2) {
        const base = comp.replace(/たい$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'たい', type: 'desire suffix', meaning: 'want to' });
        wasSplit = true;
      }

      // Split: 食べたくない → 食べる + たく + ない (negative desire)
      if (!wasSplit && /たくない$/.test(comp) && comp !== 'たくない') {
        const base = comp.replace(/たくない$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'たく', type: 'desire suffix (adverbial)', meaning: 'want to (connective form)' });
        newBreakdown.push({ component: 'ない', type: 'negative', meaning: 'not' });
        wasSplit = true;
      }

      // Split: 食べたかった → 食べる + たかった (past desire)
      if (!wasSplit && /たかった$/.test(comp) && comp !== 'たかった') {
        const base = comp.replace(/たかった$/, '');
        const dictForm = guessDictionaryForm(base, 'i');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'たかった', type: 'desire suffix (past)', meaning: 'wanted to' });
        wasSplit = true;
      }

      // Split: 食べられる → 食べる + られる (potential/passive for ru-verbs)
      if (!wasSplit && /られる$/.test(comp) && comp !== 'られる' && comp.length > 3) {
        const base = comp.replace(/られる$/, '');
        newBreakdown.push({ component: base + 'る', type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'られる', type: 'potential/passive suffix', meaning: 'can do / is done' });
        wasSplit = true;
      }

      // Split: 書ける → 書く + える (potential for u-verbs)
      if (!wasSplit && /える$/.test(comp) && comp !== 'える' && comp.length > 2) {
        const base = comp.replace(/える$/, '');
        // Try to reconstruct dictionary form
        newBreakdown.push({ component: base + 'く', type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'える', type: 'potential suffix', meaning: 'can do' });
        wasSplit = true;
      }

      // Split: 食べさせる → 食べる + させる (causative for ru-verbs)
      if (!wasSplit && /させる$/.test(comp) && comp !== 'させる' && comp.length > 3) {
        const base = comp.replace(/させる$/, '');
        newBreakdown.push({ component: base + 'る', type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'させる', type: 'causative suffix', meaning: 'make/let someone do' });
        wasSplit = true;
      }

      // Split: 行かなければならない → 行く + なければ + ならない (must/have to)
      if (!wasSplit && /なければならない$/.test(comp) && comp !== 'なければならない') {
        const base = comp.replace(/なければならない$/, '');
        const dictForm = guessDictionaryForm(base, 'a');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'なければ', type: 'conditional negative', meaning: 'if not' });
        newBreakdown.push({ component: 'ならない', type: 'auxiliary', meaning: 'must not be (= must do)' });
        wasSplit = true;
      }

      // Split: 行かなきゃ → 行く + なきゃ (casual must)
      if (!wasSplit && /なきゃ$/.test(comp) && comp !== 'なきゃ' && comp.length > 3) {
        const base = comp.replace(/なきゃ$/, '');
        const dictForm = guessDictionaryForm(base, 'a');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'なきゃ', type: 'casual obligation', meaning: 'must (casual contraction)' });
        wasSplit = true;
      }

      // Split: 食べないで → 食べる + ないで (negative te-form / "without doing")
      if (!wasSplit && /ないで$/.test(comp) && comp !== 'ないで' && comp.length > 3) {
        const base = comp.replace(/ないで$/, '');
        const dictForm = guessDictionaryForm(base, 'a');
        newBreakdown.push({ component: dictForm, type: 'verb (dictionary form)', meaning: atom.meaning || 'verb' });
        newBreakdown.push({ component: 'ない', type: 'negative', meaning: 'not' });
        newBreakdown.push({ component: 'で', type: 'te-form particle', meaning: 'without doing / please don\'t' });
        wasSplit = true;
      }

      // Keep as is if no split needed
      if (!wasSplit) {
        newBreakdown.push(atom);
      }
    });

    note.atomicBreakdown = newBreakdown;
  });
}

function getParticleMeaning(particle: string): string {
  const meanings: Record<string, string> = {
    'を': 'direct object marker',
    'が': 'subject marker',
    'に': 'direction/location/time',
    'の': 'possessive/modifier',
    'へ': 'direction',
    'と': 'and/with/quote',
    'で': 'location of action/means',
    'や': 'and (non-exhaustive)'
  };
  return meanings[particle] || 'particle';
}

function guessDictionaryForm(stem: string, type: string): string {
  // Try to convert i-stem back to dictionary form
  // 取り → 取る
  if (type === 'i' && stem.endsWith('り')) {
    return stem.slice(0, -1) + 'る';
  }
  if (type === 'i' && stem.endsWith('い')) {
    return stem.slice(0, -1) + 'う';
  }
  if (type === 'i' && stem.endsWith('き')) {
    return stem.slice(0, -1) + 'く';
  }
  if (type === 'i' && stem.endsWith('ぎ')) {
    return stem.slice(0, -1) + 'ぐ';
  }
  if (type === 'i' && stem.endsWith('し')) {
    return stem.slice(0, -1) + 'す';
  }
  if (type === 'i' && stem.endsWith('ち')) {
    return stem.slice(0, -1) + 'つ';
  }
  if (type === 'i' && stem.endsWith('に')) {
    return stem.slice(0, -1) + 'ぬ';
  }
  if (type === 'i' && stem.endsWith('び')) {
    return stem.slice(0, -1) + 'ぶ';
  }
  if (type === 'i' && stem.endsWith('み')) {
    return stem.slice(0, -1) + 'む';
  }
  // Default: add る
  return stem + 'る';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check env vars
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase config' });
    }

    if (!process.env.ENCRYPTION_SECRET) {
      return res.status(500).json({ error: 'Server configuration error: Missing encryption secret' });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { sentence, parsedWords, provider } = req.body || {};

    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    // Get user's encrypted API key (optional)
    const { data: keyData } = await supabaseAdmin
      .from('user_api_keys')
      .select('encrypted_key, iv, auth_tag, salt')
      .eq('user_id', user.id)
      .single();

    let content: string;

    // Use specified provider, or default based on key availability
    const useProvider = provider || (keyData?.encrypted_key ? 'claude' : 'groq');

    // Use Claude if requested AND user has a key
    if (useProvider === 'claude' && keyData?.encrypted_key) {
      // User has their own Anthropic key - use Claude with original prompt
      const prompt = buildTranslationPrompt(sentence, parsedWords);

      let apiKey: string;
      try {
        apiKey = decrypt({
          encrypted: keyData.encrypted_key,
          iv: keyData.iv,
          authTag: keyData.auth_tag,
          salt: keyData.salt,
        });
      } catch (decryptError) {
        console.error('Decrypt error:', decryptError);
        return res.status(500).json({ error: 'Failed to decrypt API key' });
      }

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.json().catch(() => ({}));
        console.error('Anthropic API error:', anthropicResponse.status, errorData);

        if (anthropicResponse.status === 401) {
          return res.status(400).json({ error: 'Invalid API key. Please update your API key in Settings.' });
        }

        return res.status(500).json({ error: 'Failed to get translation from AI: ' + (errorData.error?.message || anthropicResponse.status) });
      }

      const data = await anthropicResponse.json();
      content = data.content[0]?.text;
    } else {
      // No user key - use Groq (free fallback) with optimized Llama prompt
      const prompt = buildLlamaPrompt(sentence);

      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.status(400).json({
          error: 'No API key configured. Please add your Anthropic API key in Settings, or contact the admin to enable the free tier.'
        });
      }

      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        console.error('Groq API error:', groqResponse.status, errorData);
        return res.status(500).json({ error: 'Failed to get translation from AI: ' + (errorData.error?.message || groqResponse.status) });
      }

      const data = await groqResponse.json();
      content = data.choices?.[0]?.message?.content;
    }

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON response from AI
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Invalid AI response - no JSON found:', content);
      return res.status(500).json({ error: 'Invalid response format from AI' });
    }

    let translationResult;
    try {
      // Try parsing as-is first
      translationResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Try to fix common JSON issues from LLMs
      let fixedJson = jsonMatch[0];

      // Remove trailing commas before } or ]
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

      // Fix unescaped newlines in strings
      fixedJson = fixedJson.replace(/(?<!\\)\\n/g, '\\n');

      // Try again with fixed JSON
      try {
        translationResult = JSON.parse(fixedJson);
      } catch (secondError) {
        console.error('JSON parse error after fixes:', secondError);
        console.error('Original content:', jsonMatch[0].substring(0, 1000));
        console.error('Fixed content:', fixedJson.substring(0, 1000));
        return res.status(500).json({ error: 'Failed to parse AI response as JSON' });
      }
    }

    // Step 1: Validate translation quality (catch common Llama errors)
    const qualityWarnings = validateTranslationQuality(translationResult);
    if (qualityWarnings.length > 0) {
      console.warn('Translation quality warnings:', qualityWarnings);
      translationResult._qualityWarnings = qualityWarnings;
    }

    // Step 2: Correct common reading errors using dictionary
    correctReadings(translationResult);

    // Step 3: Force split components that AI didn't break down properly
    forceAtomicSplit(translationResult);

    // Step 4: Validate atomic breakdown structure
    const validationErrors = validateAtomicBreakdown(translationResult);
    if (validationErrors.length > 0) {
      console.warn('Atomic breakdown validation warnings:', validationErrors);
      translationResult._validationWarnings = validationErrors;
    }

    return res.status(200).json(translationResult);

  } catch (error) {
    console.error('Translation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal server error: ' + message });
  }
}

// Grammar reference data (loaded once)
const GRAMMAR_RULES = {
  particles: {
    'は': { name: 'Topic Marker', usage: 'Marks the topic of sentence. Read as "wa".' },
    'が': { name: 'Subject Marker', usage: 'Identifies subject, emphasizes new info.' },
    'を': { name: 'Object Marker', usage: 'Marks direct object. Read as "o".' },
    'に': { name: 'Target/Location/Time', usage: 'Direction, time, indirect object.' },
    'で': { name: 'Context Marker', usage: 'Location of action, means, reason.' },
    'へ': { name: 'Direction', usage: 'Direction of movement. Read as "e".' },
    'と': { name: 'And/With/Quote', usage: 'Exhaustive listing, companion, quotation.' },
    'も': { name: 'Also/Too', usage: 'Replaces は/が to mean "also".' },
    'の': { name: 'Possessive/Nominalizer', usage: 'Possession or turns verbs to nouns.' },
    'か': { name: 'Question', usage: 'Question marker or "or".' },
    'ね': { name: 'Confirmation', usage: 'Seeks agreement, like "right?"' },
    'よ': { name: 'Emphasis', usage: 'Emphasizes info listener may not know.' },
  },
  verbForms: {
    'ます': { name: 'Polite Form', formation: 'Verb stem + ます' },
    'ません': { name: 'Polite Negative', formation: 'Verb stem + ません' },
    'ました': { name: 'Polite Past', formation: 'Verb stem + ました' },
    'て': { name: 'Te-form', formation: 'Various rules by verb type' },
    'た': { name: 'Plain Past', formation: 'Same changes as te-form, て→た' },
    'ない': { name: 'Plain Negative', formation: 'u→a + ない (u-verb), drop る + ない (ru-verb)' },
    'たい': { name: 'Want to', formation: 'Verb stem + たい' },
    'ている': { name: 'Progressive/State', formation: 'Te-form + いる' },
    'られる': { name: 'Potential/Passive', formation: 'Ru-verb: られる, U-verb: える' },
    'させる': { name: 'Causative', formation: 'Ru-verb: させる, U-verb: a + せる' },
  },
  patterns: {
    'から': { name: 'Because', usage: 'Clause + から = reason' },
    'ので': { name: 'Because (softer)', usage: 'More polite than から' },
    'のに': { name: 'Despite', usage: 'Although, even though' },
    'たら': { name: 'Conditional', usage: 'Ta-form + ら = if/when' },
    'ば': { name: 'Conditional', usage: 'Hypothetical if' },
    'なければならない': { name: 'Must', usage: 'Negative stem + なければならない' },
    'すぎる': { name: 'Too much', usage: 'Verb stem/adj stem + すぎる' },
  }
};

function buildGrammarReference(): string {
  let ref = '\n\n=== GRAMMAR REFERENCE (Follow these rules for breakdown) ===\n\n';

  ref += '【PARTICLES - Always separate, never combine with words】\n';
  for (const [p, info] of Object.entries(GRAMMAR_RULES.particles)) {
    ref += `  ${p} = ${info.name}: ${info.usage}\n`;
  }

  ref += '\n【VERB FORMS - Break into dictionary form + suffix】\n';
  for (const [form, info] of Object.entries(GRAMMAR_RULES.verbForms)) {
    ref += `  ${form} = ${info.name}: ${info.formation}\n`;
  }

  ref += '\n【GRAMMAR PATTERNS - Identify and explain】\n';
  for (const [pat, info] of Object.entries(GRAMMAR_RULES.patterns)) {
    ref += `  ${pat} = ${info.name}: ${info.usage}\n`;
  }

  ref += '\n=== END REFERENCE ===\n';
  return ref;
}

function buildTranslationPrompt(sentence: string, parsedWords: unknown[]): string {
  const grammarRef = buildGrammarReference();

  return `Translate to Japanese with word breakdown. Return ONLY valid JSON.
${grammarRef}

"${sentence}"

{"fullTranslation":"full sentence","wordOrderDisplay":"A → B → Verb","words":[{"english":"meaning","japanese":"日本語","reading":"ひらがな","romaji":"romaji","partOfSpeech":"noun","role":"subject","particleMeaning":""}],"grammarNotes":[{"title":"Point","titleJapanese":"ポイント","explanation":"Brief","atomicBreakdown":[{"component":"に","type":"particle","meaning":"direction/target"},{"component":"なる","type":"verb","meaning":"to become"}]}]}

Rules:
- NATURAL Japanese (drop obvious pronouns like 私)
- Particles as separate entries, role="particle"
- For complex sentences: break into main clauses, keep essential meaning
- Combine related words if needed to keep words array under 15 items
- grammarNotes: max 2 notes, keep explanations under 50 words each
- ATOMIC GRAMMAR BREAKDOWN: CRITICAL - Create a SEPARATE atomicBreakdown entry for EACH grammar pattern/verb/compound word

  DO NOT group things together! Each component must be a SEPARATE array item:

  WRONG: [{"component":"この手のこと","type":"phrase","meaning":"this kind of thing"}]
  CORRECT: [
    {"component":"この","type":"demonstrative","meaning":"this"},
    {"component":"手","type":"noun","meaning":"hand/type/kind"},
    {"component":"の","type":"particle","meaning":"possessive particle"},
    {"component":"こと","type":"noun","meaning":"thing/matter"}
  ]

  WRONG: [{"component":"取りすぎた","type":"verb","meaning":"took too much"}]
  CORRECT: [
    {"component":"取る","type":"verb (dictionary form)","meaning":"to take"},
    {"component":"すぎ","type":"auxiliary verb","meaning":"too much/excessively"},
    {"component":"た","type":"auxiliary verb (past tense)","meaning":"past tense marker"}
  ]

  WRONG: [{"component":"持っています","type":"verb","meaning":"have/am holding"}]
  CORRECT: [
    {"component":"持つ","type":"verb (dictionary form)","meaning":"to hold/have"},
    {"component":"て","type":"conjunctive particle","meaning":"te-form connector"},
    {"component":"います","type":"auxiliary verb","meaning":"present progressive (polite)"}
  ]

  MANDATORY RULES - DO NOT SKIP:
  1. NEVER combine multiple morphemes into one component entry
  2. ALWAYS show dictionary form first, then each suffix/particle separately
  3. EVERY particle (に、を、が、の、て、etc.) = separate entry
  4. EVERY verb suffix (た、ます、ない、たい、すぎる) = separate entry
  5. Label each component's grammatical type clearly
  6. This breakdown is the MOST IMPORTANT part for N5 learners

  ⚠️ VALIDATION - Your response will be automatically validated:
  - Components containing ています, すぎた, たい, etc. must be separated
  - Single-component breakdowns for words >3 chars will trigger warnings
  - Verbs >5 chars will be flagged for verification
  - Missing component/type fields will be rejected

- MUST be valid JSON - no trailing commas, escape quotes properly`;
}

// Optimized prompt for Llama models - uses few-shot examples and condensed grammar
function buildLlamaPrompt(sentence: string): string {
  return `You are an expert Japanese language teacher. Translate English sentences to Japanese and provide detailed word breakdowns for language learners.

=== CONDENSED GRAMMAR REFERENCE ===
PARTICLES (always separate words):
  は (wa) = topic marker | が (ga) = subject marker | を (o) = object marker
  に (ni) = direction/time/target | で (de) = location of action/means
  の (no) = possessive | へ (e) = direction | と (to) = and/with

VERB FORMS (break into dictionary form + suffix):
  ます = polite present | ました = polite past | ません = polite negative
  ている = progressive (-ing) | たい = want to | ない = negative

CRITICAL RULES:
1. Readings (reading field) must be HIRAGANA ONLY - never include kanji
2. Romaji must be ASCII only (a-z letters and spaces)
3. Break down ALL compound verbs into separate components
4. Particles are ALWAYS separate word entries
5. Drop obvious pronouns (私 for "I" when context is clear)
=== END REFERENCE ===

${LLAMA_FEW_SHOT_EXAMPLES}

=== YOUR TASK ===
Now translate this sentence following the EXACT same format as the examples above:

Input: "${sentence}"

IMPORTANT REMINDERS:
- Return ONLY valid JSON (no markdown, no explanation outside JSON)
- "reading" field = HIRAGANA ONLY (e.g., "たべます" not "食べます")
- "romaji" field = ASCII ONLY (e.g., "tabemasu" not "たべます")
- Each particle (は、が、を、に、で、の) = separate word entry
- atomicBreakdown: split compound verbs into dictionary form + each suffix
- Keep words array under 15 items
- Maximum 2 grammarNotes, each explanation under 50 words

Output:`;
}
