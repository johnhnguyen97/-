/**
 * Process JMdict and Kanjidic into optimized JSON files for the API
 *
 * Creates:
 * - public/data/kanji.json - Individual kanji with readings, meanings, JLPT level
 * - public/data/vocab.json - Vocabulary with kanji, readings, meanings
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process Kanjidic
function processKanjidic() {
  console.log('Processing Kanjidic...');
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'kanjidic2-en-3.6.1.json'), 'utf8'));

  const kanji = raw.characters.map(char => {
    const readings = char.readingMeaning?.groups?.[0]?.readings || [];
    const meanings = char.readingMeaning?.groups?.[0]?.meanings || [];

    // Get on'yomi (katakana) and kun'yomi (hiragana)
    const onyomi = readings
      .filter(r => r.type === 'ja_on')
      .map(r => r.value);
    const kunyomi = readings
      .filter(r => r.type === 'ja_kun')
      .map(r => r.value);

    // Get English meanings
    const meaningEn = meanings
      .filter(m => m.lang === 'en')
      .map(m => m.value);

    // Get radical number (classical)
    const radicalNum = char.radicals?.find(r => r.type === 'classical')?.value;

    return {
      c: char.literal,                           // character
      s: char.misc?.strokeCounts?.[0] || 0,      // stroke count
      g: char.misc?.grade || null,               // grade level
      j: char.misc?.jlptLevel || null,           // JLPT level (1-4, where 1 is hardest)
      f: char.misc?.frequency || null,           // frequency rank
      r: radicalNum || null,                     // radical number
      o: onyomi.length > 0 ? onyomi : null,      // on'yomi
      k: kunyomi.length > 0 ? kunyomi : null,    // kun'yomi
      m: meaningEn,                              // meanings
      n: char.readingMeaning?.nanori || null,    // name readings
    };
  });

  // Sort by frequency (most common first), then by stroke count
  kanji.sort((a, b) => {
    if (a.f && b.f) return a.f - b.f;
    if (a.f) return -1;
    if (b.f) return 1;
    return a.s - b.s;
  });

  console.log(`  Processed ${kanji.length} kanji`);

  // Write compact JSON (no pretty printing to save space)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji.json'),
    JSON.stringify({ version: '3.6.1', count: kanji.length, data: kanji })
  );

  const stats = fs.statSync(path.join(OUTPUT_DIR, 'kanji.json'));
  console.log(`  Output: ${(stats.size / 1024).toFixed(1)} KB`);

  return kanji;
}

// Process JMdict vocabulary
function processJMdict() {
  console.log('Processing JMdict...');
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'jmdict-eng-common-3.6.1.json'), 'utf8'));

  const vocab = raw.words.map(word => {
    // Get primary kanji form (common preferred)
    const kanjiForm = word.kanji?.find(k => k.common)?.text || word.kanji?.[0]?.text || null;

    // Get primary kana reading (common preferred)
    const kanaForm = word.kana?.find(k => k.common)?.text || word.kana?.[0]?.text || '';

    // Get parts of speech and meanings from first sense
    const sense = word.sense?.[0] || {};
    const pos = sense.partOfSpeech || [];
    const glosses = sense.gloss?.map(g => g.text) || [];

    // Get additional meanings from other senses
    const allMeanings = word.sense?.flatMap(s =>
      s.gloss?.map(g => g.text) || []
    ) || [];

    // Deduplicate meanings
    const uniqueMeanings = [...new Set(allMeanings)].slice(0, 5); // Max 5 meanings

    return {
      id: word.id,
      k: kanjiForm,                              // kanji form
      r: kanaForm,                               // reading (kana)
      p: pos.length > 0 ? pos : null,            // parts of speech
      m: uniqueMeanings,                         // meanings
    };
  });

  console.log(`  Processed ${vocab.length} vocabulary entries`);

  // Write compact JSON
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vocab.json'),
    JSON.stringify({ version: '3.6.1', count: vocab.length, data: vocab })
  );

  const stats = fs.statSync(path.join(OUTPUT_DIR, 'vocab.json'));
  console.log(`  Output: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  return vocab;
}

// Create a smaller JLPT-focused kanji file for quick loading
function createJLPTKanji(allKanji) {
  console.log('Creating JLPT kanji subset...');

  // Filter to only JLPT kanji (levels 1-4)
  const jlptKanji = allKanji.filter(k => k.j !== null);

  // Group by JLPT level
  const byLevel = {
    5: jlptKanji.filter(k => k.j === 4 || k.j === 5), // N5 (easiest, ~100 kanji)
    4: jlptKanji.filter(k => k.j === 3 || k.j === 4), // N4 (~300 kanji)
    3: jlptKanji.filter(k => k.j === 2 || k.j === 3), // N3 (~600 kanji)
    2: jlptKanji.filter(k => k.j === 1 || k.j === 2), // N2 (~1000 kanji)
    1: jlptKanji.filter(k => k.j === 1),              // N1 (hardest)
  };

  console.log(`  N5: ${byLevel[5].length}, N4: ${byLevel[4].length}, N3: ${byLevel[3].length}, N2: ${byLevel[2].length}, N1: ${byLevel[1].length}`);
  console.log(`  Total JLPT kanji: ${jlptKanji.length}`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji-jlpt.json'),
    JSON.stringify({ version: '3.6.1', count: jlptKanji.length, data: jlptKanji })
  );

  const stats = fs.statSync(path.join(OUTPUT_DIR, 'kanji-jlpt.json'));
  console.log(`  Output: ${(stats.size / 1024).toFixed(1)} KB`);
}

// Main
console.log('=== Dictionary Processing ===\n');

const kanji = processKanjidic();
console.log('');

const vocab = processJMdict();
console.log('');

createJLPTKanji(kanji);
console.log('');

console.log('=== Done! ===');
console.log(`Output files in: ${OUTPUT_DIR}`);
