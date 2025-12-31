/**
 * Process JMdict, Kanjidic, and KRADFILE into optimized JSON files
 *
 * Creates comprehensive dictionary data with:
 * - Kanji by JLPT level (N5, N4, N3, N2, N1)
 * - Kanji by grade level (1-6, secondary)
 * - Kanji by stroke count
 * - Vocabulary by JLPT level
 * - Radical-to-kanji mappings
 * - Tag/category indexes
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================
// Process Kanjidic - Full kanji database
// ============================================
function processKanjidic() {
  console.log('Processing Kanjidic...');
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'kanjidic2-en-3.6.1.json'), 'utf8'));

  const kanji = raw.characters.map(char => {
    const readings = char.readingMeaning?.groups?.[0]?.readings || [];
    const meanings = char.readingMeaning?.groups?.[0]?.meanings || [];

    const onyomi = readings.filter(r => r.type === 'ja_on').map(r => r.value);
    const kunyomi = readings.filter(r => r.type === 'ja_kun').map(r => r.value);
    const meaningEn = meanings.filter(m => m.lang === 'en').map(m => m.value);
    const radicalNum = char.radicals?.find(r => r.type === 'classical')?.value;

    return {
      c: char.literal,
      s: char.misc?.strokeCounts?.[0] || 0,
      g: char.misc?.grade || null,
      j: char.misc?.jlptLevel || null,
      f: char.misc?.frequency || null,
      r: radicalNum || null,
      o: onyomi.length > 0 ? onyomi : null,
      k: kunyomi.length > 0 ? kunyomi : null,
      m: meaningEn,
      n: char.readingMeaning?.nanori?.length > 0 ? char.readingMeaning.nanori : null,
    };
  });

  // Sort by frequency
  kanji.sort((a, b) => {
    if (a.f && b.f) return a.f - b.f;
    if (a.f) return -1;
    if (b.f) return 1;
    return a.s - b.s;
  });

  console.log(`  Total kanji: ${kanji.length}`);

  // Write full kanji database
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji.json'),
    JSON.stringify({ version: '3.6.1', count: kanji.length, data: kanji })
  );
  console.log(`  kanji.json: ${(fs.statSync(path.join(OUTPUT_DIR, 'kanji.json')).size / 1024).toFixed(1)} KB`);

  return kanji;
}

// ============================================
// Create JLPT Kanji Subsets
// ============================================
function createJLPTKanjiSubsets(allKanji) {
  console.log('\nCreating JLPT kanji subsets...');

  // JLPT levels in kanjidic: 1 = N1 (hardest), 2 = N2, etc.
  // Some kanji have level 4 or 5 which maps to N4/N5
  const levels = {
    5: allKanji.filter(k => k.j === 5 || k.j === 4), // N5 (beginner)
    4: allKanji.filter(k => k.j === 4 || k.j === 3), // N4
    3: allKanji.filter(k => k.j === 3 || k.j === 2), // N3
    2: allKanji.filter(k => k.j === 2 || k.j === 1), // N2
    1: allKanji.filter(k => k.j === 1),              // N1 (advanced)
  };

  // Create individual JLPT files
  for (const [level, kanjiList] of Object.entries(levels)) {
    const filename = `kanji-n${level}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify({
        version: '3.6.1',
        level: `N${level}`,
        count: kanjiList.length,
        data: kanjiList
      })
    );
    console.log(`  ${filename}: ${kanjiList.length} kanji (${(fs.statSync(path.join(OUTPUT_DIR, filename)).size / 1024).toFixed(1)} KB)`);
  }

  // Create combined JLPT file with all levels
  const jlptKanji = allKanji.filter(k => k.j !== null);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji-jlpt.json'),
    JSON.stringify({
      version: '3.6.1',
      count: jlptKanji.length,
      levels: {
        N5: levels[5].length,
        N4: levels[4].length,
        N3: levels[3].length,
        N2: levels[2].length,
        N1: levels[1].length,
      },
      data: jlptKanji
    })
  );
  console.log(`  kanji-jlpt.json: ${jlptKanji.length} kanji total`);
}

// ============================================
// Create Grade Level Subsets
// ============================================
function createGradeSubsets(allKanji) {
  console.log('\nCreating grade level subsets...');

  // Grade levels: 1-6 = elementary, 8 = secondary/jouyou, 9 = jinmeiyou, 10 = variant
  const grades = {};
  for (let g = 1; g <= 10; g++) {
    grades[g] = allKanji.filter(k => k.g === g);
  }

  // Elementary school kanji (grades 1-6)
  const elementary = allKanji.filter(k => k.g >= 1 && k.g <= 6);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji-elementary.json'),
    JSON.stringify({
      version: '3.6.1',
      count: elementary.length,
      grades: {
        1: grades[1].length,
        2: grades[2].length,
        3: grades[3].length,
        4: grades[4].length,
        5: grades[5].length,
        6: grades[6].length,
      },
      data: elementary
    })
  );
  console.log(`  kanji-elementary.json: ${elementary.length} kanji (grades 1-6)`);

  // Individual grade files
  for (let g = 1; g <= 6; g++) {
    const filename = `kanji-grade${g}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify({
        version: '3.6.1',
        grade: g,
        count: grades[g].length,
        data: grades[g]
      })
    );
    console.log(`  ${filename}: ${grades[g].length} kanji`);
  }

  // Secondary school (jouyou)
  if (grades[8].length > 0) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'kanji-secondary.json'),
      JSON.stringify({
        version: '3.6.1',
        grade: 8,
        count: grades[8].length,
        data: grades[8]
      })
    );
    console.log(`  kanji-secondary.json: ${grades[8].length} kanji`);
  }
}

// ============================================
// Create Stroke Count Index
// ============================================
function createStrokeIndex(allKanji) {
  console.log('\nCreating stroke count index...');

  const byStroke = {};
  for (const k of allKanji) {
    const s = k.s;
    if (!byStroke[s]) byStroke[s] = [];
    byStroke[s].push(k.c); // Just store characters for index
  }

  // Create stroke count summary
  const strokeSummary = {};
  for (const [stroke, chars] of Object.entries(byStroke)) {
    strokeSummary[stroke] = chars.length;
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji-strokes.json'),
    JSON.stringify({
      version: '3.6.1',
      summary: strokeSummary,
      data: byStroke
    })
  );

  const maxStroke = Math.max(...Object.keys(byStroke).map(Number));
  console.log(`  kanji-strokes.json: 1-${maxStroke} strokes indexed`);
}

// ============================================
// Process KRADFILE - Radical mappings
// ============================================
function processKradfile(allKanji) {
  console.log('\nProcessing KRADFILE (radical mappings)...');

  const kradPath = path.join(DATA_DIR, 'kradfile-3.6.1.json');
  if (!fs.existsSync(kradPath)) {
    console.log('  KRADFILE not found, skipping...');
    return;
  }

  const raw = JSON.parse(fs.readFileSync(kradPath, 'utf8'));
  const kanjiToRadicals = raw.kanji;

  // Build reverse mapping: radical -> kanji list
  const radicalToKanji = {};
  for (const [kanji, radicals] of Object.entries(kanjiToRadicals)) {
    for (const rad of radicals) {
      if (!radicalToKanji[rad]) radicalToKanji[rad] = [];
      radicalToKanji[rad].push(kanji);
    }
  }

  // Sort kanji lists by frequency (using our kanji data)
  const kanjiFreq = {};
  for (const k of allKanji) {
    kanjiFreq[k.c] = k.f || 99999;
  }

  for (const rad of Object.keys(radicalToKanji)) {
    radicalToKanji[rad].sort((a, b) => (kanjiFreq[a] || 99999) - (kanjiFreq[b] || 99999));
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'radical-kanji.json'),
    JSON.stringify({
      version: '3.6.1',
      radicalCount: Object.keys(radicalToKanji).length,
      kanjiCount: Object.keys(kanjiToRadicals).length,
      radicalToKanji,
      kanjiToRadicals
    })
  );

  console.log(`  radical-kanji.json: ${Object.keys(radicalToKanji).length} radicals -> ${Object.keys(kanjiToRadicals).length} kanji`);
}

// ============================================
// Process JMdict - Vocabulary
// ============================================
function processJMdict() {
  console.log('\nProcessing JMdict (full vocabulary)...');

  // Try full first, fall back to common
  let rawPath = path.join(DATA_DIR, 'jmdict-eng-3.6.1.json');
  if (!fs.existsSync(rawPath)) {
    rawPath = path.join(DATA_DIR, 'jmdict-eng-common-3.6.1.json');
  }

  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const isCommonOnly = raw.commonOnly === true;

  console.log(`  Source: ${isCommonOnly ? 'common-only' : 'full'} dictionary`);
  console.log(`  Raw entries: ${raw.words.length}`);

  // Build tag descriptions
  const tagDescriptions = raw.tags || {};

  // Process vocabulary
  const vocab = raw.words.map(word => {
    const kanjiForm = word.kanji?.find(k => k.common)?.text || word.kanji?.[0]?.text || null;
    const kanaForm = word.kana?.find(k => k.common)?.text || word.kana?.[0]?.text || '';
    const isCommon = word.kanji?.some(k => k.common) || word.kana?.some(k => k.common);

    // Collect all parts of speech
    const allPos = new Set();
    const allFields = new Set();
    const allDialects = new Set();
    const allMisc = new Set();

    for (const sense of (word.sense || [])) {
      sense.partOfSpeech?.forEach(p => allPos.add(p));
      sense.field?.forEach(f => allFields.add(f));
      sense.dialect?.forEach(d => allDialects.add(d));
      sense.misc?.forEach(m => allMisc.add(m));
    }

    // Get meanings from all senses
    const allMeanings = word.sense?.flatMap(s =>
      s.gloss?.map(g => g.text) || []
    ) || [];
    const uniqueMeanings = [...new Set(allMeanings)].slice(0, 8);

    return {
      id: word.id,
      k: kanjiForm,
      r: kanaForm,
      c: isCommon ? 1 : 0,
      p: allPos.size > 0 ? [...allPos] : null,
      f: allFields.size > 0 ? [...allFields] : null,
      d: allDialects.size > 0 ? [...allDialects] : null,
      t: allMisc.size > 0 ? [...allMisc] : null,
      m: uniqueMeanings,
    };
  });

  // Sort: common first, then by ID
  vocab.sort((a, b) => {
    if (a.c !== b.c) return b.c - a.c;
    return a.id.localeCompare(b.id);
  });

  console.log(`  Processed: ${vocab.length} entries`);

  // Write full vocabulary
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vocab.json'),
    JSON.stringify({
      version: '3.6.1',
      count: vocab.length,
      commonOnly: isCommonOnly,
      tags: tagDescriptions,
      data: vocab
    })
  );
  console.log(`  vocab.json: ${(fs.statSync(path.join(OUTPUT_DIR, 'vocab.json')).size / 1024 / 1024).toFixed(2)} MB`);

  // Write common-only subset
  const commonVocab = vocab.filter(v => v.c === 1);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vocab-common.json'),
    JSON.stringify({
      version: '3.6.1',
      count: commonVocab.length,
      data: commonVocab
    })
  );
  console.log(`  vocab-common.json: ${commonVocab.length} entries (${(fs.statSync(path.join(OUTPUT_DIR, 'vocab-common.json')).size / 1024 / 1024).toFixed(2)} MB)`);

  return { vocab, tagDescriptions };
}

// ============================================
// Create Vocabulary by Category
// ============================================
function createVocabCategories(vocab, tagDescriptions) {
  console.log('\nCreating vocabulary categories...');

  // Group by part of speech
  const posCounts = {};
  for (const v of vocab) {
    for (const p of (v.p || [])) {
      posCounts[p] = (posCounts[p] || 0) + 1;
    }
  }

  // Create files for major categories
  const majorPos = {
    'n': 'nouns',
    'v1': 'ichidan-verbs',
    'v5': 'godan-verbs',
    'adj-i': 'i-adjectives',
    'adj-na': 'na-adjectives',
    'adv': 'adverbs',
    'exp': 'expressions',
  };

  for (const [posKey, filename] of Object.entries(majorPos)) {
    const filtered = vocab.filter(v => v.p?.some(p => p.startsWith(posKey) || p === posKey));
    if (filtered.length > 0) {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `vocab-${filename}.json`),
        JSON.stringify({
          version: '3.6.1',
          category: posKey,
          count: filtered.length,
          data: filtered.slice(0, 5000) // Limit to 5000 per category
        })
      );
      console.log(`  vocab-${filename}.json: ${Math.min(filtered.length, 5000)} entries`);
    }
  }

  // Create tag index
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vocab-tags.json'),
    JSON.stringify({
      version: '3.6.1',
      partOfSpeech: posCounts,
      descriptions: tagDescriptions
    })
  );
  console.log(`  vocab-tags.json: ${Object.keys(posCounts).length} POS tags`);
}

// ============================================
// Create Search Indexes
// ============================================
function createSearchIndexes(allKanji, vocab) {
  console.log('\nCreating search indexes...');

  // Kanji reading index (for fast lookup by reading)
  const readingIndex = {};
  for (const k of allKanji) {
    const readings = [...(k.o || []), ...(k.k || [])];
    for (const r of readings) {
      // Normalize reading (remove dots for okurigana)
      const normalized = r.replace(/\./g, '');
      if (!readingIndex[normalized]) readingIndex[normalized] = [];
      readingIndex[normalized].push(k.c);
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji-readings.json'),
    JSON.stringify({
      version: '3.6.1',
      count: Object.keys(readingIndex).length,
      data: readingIndex
    })
  );
  console.log(`  kanji-readings.json: ${Object.keys(readingIndex).length} readings indexed`);

  // Kanji meaning index (first word of each meaning)
  const meaningIndex = {};
  for (const k of allKanji) {
    for (const m of (k.m || [])) {
      const words = m.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length >= 3) { // Only index words 3+ chars
          if (!meaningIndex[word]) meaningIndex[word] = [];
          if (!meaningIndex[word].includes(k.c)) {
            meaningIndex[word].push(k.c);
          }
        }
      }
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'kanji-meanings.json'),
    JSON.stringify({
      version: '3.6.1',
      count: Object.keys(meaningIndex).length,
      data: meaningIndex
    })
  );
  console.log(`  kanji-meanings.json: ${Object.keys(meaningIndex).length} meaning words indexed`);
}

// ============================================
// Create Statistics Summary
// ============================================
function createStatsSummary(allKanji, vocab) {
  console.log('\nCreating statistics summary...');

  const stats = {
    version: '3.6.1',
    generatedAt: new Date().toISOString(),
    kanji: {
      total: allKanji.length,
      byJLPT: {
        N5: allKanji.filter(k => k.j === 5 || k.j === 4).length,
        N4: allKanji.filter(k => k.j === 4 || k.j === 3).length,
        N3: allKanji.filter(k => k.j === 3 || k.j === 2).length,
        N2: allKanji.filter(k => k.j === 2 || k.j === 1).length,
        N1: allKanji.filter(k => k.j === 1).length,
      },
      byGrade: {
        elementary: allKanji.filter(k => k.g >= 1 && k.g <= 6).length,
        secondary: allKanji.filter(k => k.g === 8).length,
        other: allKanji.filter(k => !k.g || k.g > 8).length,
      },
      withFrequency: allKanji.filter(k => k.f).length,
      avgStrokes: (allKanji.reduce((sum, k) => sum + k.s, 0) / allKanji.length).toFixed(1),
    },
    vocabulary: {
      total: vocab.length,
      common: vocab.filter(v => v.c === 1).length,
      withKanji: vocab.filter(v => v.k).length,
      kanaOnly: vocab.filter(v => !v.k).length,
    },
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );
  console.log(`  stats.json created`);

  return stats;
}

// ============================================
// Main
// ============================================
console.log('='.repeat(50));
console.log('Dictionary Processing - Comprehensive Build');
console.log('='.repeat(50));

const kanji = processKanjidic();
createJLPTKanjiSubsets(kanji);
createGradeSubsets(kanji);
createStrokeIndex(kanji);
processKradfile(kanji);

const { vocab, tagDescriptions } = processJMdict();
createVocabCategories(vocab, tagDescriptions);
createSearchIndexes(kanji, vocab);

const stats = createStatsSummary(kanji, vocab);

console.log('\n' + '='.repeat(50));
console.log('Build Complete!');
console.log('='.repeat(50));
console.log(`\nKanji: ${stats.kanji.total} total`);
console.log(`Vocabulary: ${stats.vocabulary.total} total (${stats.vocabulary.common} common)`);
console.log(`\nOutput directory: ${OUTPUT_DIR}`);

// List all generated files
const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
console.log(`\nGenerated ${files.length} files:`);
let totalSize = 0;
for (const file of files.sort()) {
  const size = fs.statSync(path.join(OUTPUT_DIR, file)).size;
  totalSize += size;
  console.log(`  ${file}: ${size > 1024*1024 ? (size/1024/1024).toFixed(2) + ' MB' : (size/1024).toFixed(1) + ' KB'}`);
}
console.log(`\nTotal size: ${(totalSize/1024/1024).toFixed(2)} MB`);
