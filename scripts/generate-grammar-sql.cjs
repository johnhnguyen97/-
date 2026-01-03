/**
 * Grammar SQL Generator
 *
 * Parses slugs from 20260101_import_grammar_topics.sql and generates
 * UPDATE statements to fix categories and JLPT levels.
 *
 * Usage: node scripts/generate-grammar-sql.cjs
 */

const fs = require('fs');
const path = require('path');

// Category mapping rules (order matters - first match wins)
const categoryRules = [
  // Particles
  { pattern: /^particle-/, category: 'particles' },
  { pattern: /^particles-/, category: 'particles' },

  // Verb forms
  { pattern: /^verb-/, category: 'verb-forms' },
  { pattern: /^te-/, category: 'verb-forms' },
  { pattern: /^ta-form/, category: 'verb-forms' },
  { pattern: /^tai-form/, category: 'verb-forms' },
  { pattern: /^masu-/, category: 'verb-forms' },
  { pattern: /^dictionary-form/, category: 'verb-forms' },
  { pattern: /^potential-/, category: 'verb-forms' },
  { pattern: /^imperative/, category: 'verb-forms' },
  { pattern: /^volitional/, category: 'verb-forms' },
  { pattern: /^passive/, category: 'verb-forms' },
  { pattern: /^causative/, category: 'verb-forms' },

  // Adjectives
  { pattern: /^adjective/, category: 'adjectives' },
  { pattern: /^i-adjective/, category: 'adjectives' },
  { pattern: /^na-adjective/, category: 'adjectives' },

  // Conditionals
  { pattern: /-conditional$/, category: 'conditionals' },
  { pattern: /^ba-form/, category: 'conditionals' },
  { pattern: /^nara$/, category: 'conditionals' },

  // Keigo (honorifics)
  { pattern: /^keigo/, category: 'keigo' },
  { pattern: /^honorific/, category: 'keigo' },
  { pattern: /^humble/, category: 'keigo' },
  { pattern: /^sonkeigo$/, category: 'keigo' },
  { pattern: /^kenjougo$/, category: 'keigo' },
  { pattern: /^teineigo$/, category: 'keigo' },
  { pattern: /^polite-/, category: 'keigo' },

  // Counters
  { pattern: /^counter-/, category: 'counters' },
  { pattern: /^counters/, category: 'counters' },

  // Expressions
  { pattern: /^greetings$/, category: 'expressions' },
  { pattern: /^farewells$/, category: 'expressions' },
  { pattern: /^apologies$/, category: 'expressions' },
  { pattern: /^congratulations$/, category: 'expressions' },
  { pattern: /^condolences$/, category: 'expressions' },
  { pattern: /^thanks$/, category: 'expressions' },
  { pattern: /^set-phrases/, category: 'expressions' },

  // Writing style
  { pattern: /^academic/, category: 'writing-style' },
  { pattern: /^business/, category: 'writing-style' },
  { pattern: /^email/, category: 'writing-style' },
  { pattern: /^letter/, category: 'writing-style' },
  { pattern: /^newspaper/, category: 'writing-style' },
  { pattern: /^dearu/, category: 'writing-style' },
  { pattern: /^formal-writing/, category: 'writing-style' },

  // Speech styles
  { pattern: /^casual-speech/, category: 'speech-styles' },
  { pattern: /^gender-speech/, category: 'speech-styles' },
  { pattern: /^age-speech/, category: 'speech-styles' },
  { pattern: /^dialects/, category: 'speech-styles' },
  { pattern: /^slang/, category: 'speech-styles' },
  { pattern: /^regional/, category: 'speech-styles' },

  // Question words
  { pattern: /^dare$/, category: 'question-words' },
  { pattern: /^doko$/, category: 'question-words' },
  { pattern: /^dou$/, category: 'question-words' },
  { pattern: /^nani$/, category: 'question-words' },
  { pattern: /^naze/, category: 'question-words' },
  { pattern: /^itsu$/, category: 'question-words' },
  { pattern: /^ikura$/, category: 'question-words' },
  { pattern: /^ikutsu$/, category: 'question-words' },
  { pattern: /^question-words$/, category: 'question-words' },
  { pattern: /^donata$/, category: 'question-words' },
  { pattern: /^dochira$/, category: 'question-words' },

  // Connectors
  { pattern: /^dakara$/, category: 'connectors' },
  { pattern: /^node$/, category: 'connectors' },
  { pattern: /^kara-reason/, category: 'connectors' },
  { pattern: /^kedo$/, category: 'connectors' },
  { pattern: /^shi$/, category: 'connectors' },
  { pattern: /^sorede$/, category: 'connectors' },
  { pattern: /^soshite$/, category: 'connectors' },
  { pattern: /^demo$/, category: 'connectors' },
  { pattern: /^shikashi$/, category: 'connectors' },
  { pattern: /^nazenara$/, category: 'connectors' },

  // Basics
  { pattern: /^da$/, category: 'basics' },
  { pattern: /^desu$/, category: 'basics' },
  { pattern: /^janai$/, category: 'basics' },
  { pattern: /^copula/, category: 'basics' },
  { pattern: /^noun-basics/, category: 'basics' },
  { pattern: /^parts-of-speech/, category: 'basics' },
  { pattern: /^sentence-structure/, category: 'basics' },

  // Pronouns
  { pattern: /^first-person$/, category: 'pronouns' },
  { pattern: /^second-person$/, category: 'pronouns' },
  { pattern: /^third-person$/, category: 'pronouns' },
  { pattern: /^personal-pronouns$/, category: 'pronouns' },
  { pattern: /^ko-so-a-do$/, category: 'pronouns' },
  { pattern: /^demonstratives$/, category: 'pronouns' },

  // Numbers & Time
  { pattern: /^numbers/, category: 'numbers-time' },
  { pattern: /^native-sino/, category: 'numbers-time' },
  { pattern: /^time-/, category: 'numbers-time' },
  { pattern: /^duration$/, category: 'numbers-time' },
  { pattern: /^frequency$/, category: 'numbers-time' },
  { pattern: /^ordinal/, category: 'numbers-time' },

  // Giving/Receiving
  { pattern: /^action-direction$/, category: 'giving-receiving' },
  { pattern: /^giving/, category: 'giving-receiving' },
  { pattern: /^receiving/, category: 'giving-receiving' },
  { pattern: /^kureru/, category: 'giving-receiving' },
  { pattern: /^ageru/, category: 'giving-receiving' },
  { pattern: /^morau/, category: 'giving-receiving' },

  // JLPT Reference
  { pattern: /^jlpt-/, category: 'jlpt-reference' },

  // Default: grammar-patterns (catch-all)
];

// COMPREHENSIVE JLPT level mappings - covers ALL 389 topics
const jlptMappings = {
  N5: [
    // Basic particles
    /^particle-(wa|ga|wo|ni|de|to|mo|ka|no|e|he)$/,
    /^particles-overview$/,
    // Basic copula
    /^desu$/,
    // Basic adjectives
    /^i-adjectives$/,
    /^na-adjectives$/,
    /^adjective-basics$/,
    // Basic verbs
    /^verb-masu$/,
    /^verb-basics$/,
    /^dictionary-form$/,
    // Expressions
    /^greetings$/,
    /^thanks$/,
    /^apologies$/,
    // Question words
    /^dare$/,
    /^doko$/,
    /^dou$/,
    /^nani$/,
    /^itsu$/,
    /^ikura$/,
    /^ikutsu$/,
    /^naze-doushite$/,
    /^question-words$/,
    // Counters basics
    /^counters-basics$/,
    /^counters-overview$/,
    /^common-counters$/,
    // Pronouns
    /^first-person$/,
    /^second-person$/,
    /^third-person$/,
    // Basics
    /^parts-of-speech$/,
    /^sentence-structure$/,
    /^noun-basics$/,
    /^copula-past$/,
    // Numbers
    /^numbers-basics$/,
    // NEW: N5 grammar patterns (foundational)
    /^adverb-formation$/,
    /^basic-patterns$/,
    /^before-after$/,
    /^choice-questions$/,
    /^common-expressions$/,
    /^contractions$/,
    /^direct-quotation$/,
    /^filler-words$/,
    /^frequency-adverbs$/,
    /^future$/,
    /^habitual-actions$/,
    /^how-to-use$/,
    /^ichiban$/,
    /^introduction$/,
    /^ka-questions$/,
    /^kitto$/,
    /^koto-ga-dekiru$/,
    /^koto-nominalization$/,
    /^ku-naru$/,
    /^ku-suru$/,
    /^manner-adverbs$/,
    /^nai-usage$/,
    /^negation-overview$/,
    /^ni-iku-kuru$/,
    /^ni-naru$/,
    /^ni-suru$/,
    /^no-questions$/,
    /^omitting-pronouns$/,
    /^onaji$/,
    /^past-tense$/,
    /^present-tense$/,
    /^pronunciation$/,
    /^topic-subject$/,
    /^transitive-intransitive$/,
    /^wa-vs-ga$/,
    /^word-order$/,
    /^writing-systems$/,
    /^yes-no-questions$/,
  ],
  N4: [
    // Te-form and related
    /^te-/,
    /^ta-form$/,
    /^tai-form$/,
    /^tai$/,
    // Conditionals
    /^tara-conditional$/,
    /^to-conditional$/,
    // Copula variants
    /^da$/,
    /^janai$/,
    // Demonstratives
    /^ko-so-a-do$/,
    // Time expressions
    /^duration$/,
    /^frequency$/,
    // Potential form
    /^potential-/,
    /^verb-potential$/,
    // Want/desire
    /^hoshii$/,
    /^hou-ga-ii$/,
    // Basic giving/receiving
    /^action-direction$/,
    /^ageru$/,
    /^morau$/,
    /^kureru$/,
    // Connectors
    /^nazenara$/,
    /^node$/,
    /^kara-reason$/,
    /^kara-because$/,
    // Speech styles
    /^casual-speech$/,
    // Comparisons
    /^comparison-/,
    /^yori$/,
    /^yori-than$/,
    // Particles (N4 level - basic limiting/extent)
    /^particle-kara$/,
    /^particle-made$/,
    /^particle-ya$/,
    /^particle-ne$/,
    /^particle-yo$/,
    /^particle-yone$/,
    /^particle-zo$/,
    // NEW: N4 grammar patterns (elementary)
    /^comparative-adjectives$/,
    /^conditionals-overview$/,
    /^degree-adverbs$/,
    /^e-vs-ni$/,
    /^masen-ka$/,
    /^mashou-ka$/,
    /^mashou$/,
    /^nakute-mo-ii$/,
    /^naide-kudasai$/,
    /^request-politeness$/,
    /^sentence-ending-particles$/,
    /^simultaneous-actions$/,
    /^sugiru$/,
    /^tabun$/,
    /^tari-tari$/,
    /^temo$/,
    /^to-list$/,
    /^ya-list$/,
    /^comparing-conditionals$/,
    /^dake-detail$/,
    /^dake-extent$/,
    /^darou-deshou$/,
    /^dasu$/,
    /^demo-shikashi$/,
    /^dono-kurai$/,
    /^ga-connector$/,
    /^ga-contrast$/,
    /^hajimeru$/,
    /^indirect-quotation$/,
    /^kedo-detail$/,
    /^kedo-keredo$/,
    /^kurai-degree$/,
    /^let-someone-do$/,
    /^machigaeru$/,
    /^make-someone-do$/,
    /^mama$/,
    /^nado-nanka$/,
    /^ni-vs-de$/,
    /^plain-form-noun$/,
    /^reporting-speech$/,
    /^ta-koto-ga-aru$/,
    /^ta-koto-ga-nai$/,
    /^tagaru$/,
    /^temo-detail$/,
    /^to-iu$/,
    /^to-omou$/,
    /^toka$/,
    /^tte-quotation$/,
    /^wasureru$/,
    /^while-during$/,
    /^yasui-detail$/,
    /^yasui$/,
    /^yotei$/,
    /^giving-verbs$/,
    /^receiving-verbs$/,
    /^kureru-kudasaru$/,
  ],
  N3: [
    // Passive/Causative
    /^verb-passive$/,
    /^passive$/,
    /^verb-causative$/,
    /^causative$/,
    /^causative-formation$/,
    /^causative-relationships$/,
    /^passive-keigo$/,
    // Keigo basics
    /^keigo-/,
    /^teineigo$/,
    // Grammar patterns
    /^you-ni/,
    /^you-da$/,
    /^koto-ga-aru$/,
    /^rashii$/,
    /^mitai$/,
    /^sou-/,
    /^beki/,
    /^kagiri/,
    /^mono-da$/,
    /^ppoi/,
    /^shika/,
    /^tame-ni/,
    /^tokoroga$/,
    /^tsumori$/,
    // Speech
    /^age-speech$/,
    /^gender-speech$/,
    // Advanced conditionals
    /^ba-form$/,
    /^ba-conditional$/,
    /^nara$/,
    /^nara-conditional$/,
    /^verb-ba-conditional$/,
    /^verb-nara-conditional$/,
    /^verb-tara-conditional$/,
    /^verb-to-conditional$/,
    // NEW: N3 grammar patterns (intermediate)
    /^compound-verbs$/,
    /^desu-ka-vs-darou-ka$/,
    /^double-negatives$/,
    /^embedded-questions$/,
    /^hazu-da$/,
    /^hazu-detail$/,
    /^hodo-comparison$/,
    /^hodo-extent$/,
    /^hou-ga-ii-advice$/,
    /^kara-vs-node$/,
    /^mo-ba-mo$/,
    /^nagara$/,
    /^nai-to-ikenai$/,
    /^nai-to$/,
    /^nakereba-naranai$/,
    /^nakya$/,
    /^naosu$/,
    /^no-da$/,
    /^no-hou-ga$/,
    /^no-nominalization$/,
    /^no-vs-koto$/,
    /^no-wa-da$/,
    /^owaru$/,
    /^relative-clauses$/,
    /^sorekara$/,
    /^soreni$/,
    /^to-ii$/,
    /^to-omotte-iru$/,
    /^toiu$/,
    /^tsuzukeru$/,
    /^adversity-passive$/,
    /^bakari-detail$/,
    /^dakara-connector$/,
    /^direct-passive$/,
    /^gachi$/,
    /^gatai$/,
    /^gimi$/,
    /^igai$/,
    /^kagiri-dewa$/,
    /^kai-ga-aru$/,
    /^kanenai$/,
    /^kara-miru-to$/,
    /^koso$/,
    /^monono$/,
    /^nagaramo$/,
    /^ni-kanshite$/,
    /^ni-koshita-koto-wa-nai$/,
    /^ni-totte$/,
    /^ni-tsuite$/,
    /^ni-yoru-to$/,
    /^nikui-detail$/,
    /^nikui$/,
    /^nimo-kakawarazu$/,
    /^noni-detail$/,
    /^noni$/,
    /^okage-de$/,
    /^ppanashi$/,
    /^ppoi-detail$/,
    /^sai$/,
    /^sei-de$/,
    /^shika-detail$/,
    /^sou-hearsay$/,
    /^tabi-ni$/,
    /^tame-ni-purpose$/,
    /^tara-dou$/,
    /^tatte$/,
    /^tsutsu$/,
    /^wake-da$/,
    /^wake-dewa-nai$/,
    /^wake-ga-nai$/,
    /^wake-ni-wa-ikanai$/,
    /^wo-nozoite$/,
    /^wo-towazu$/,
    /^zaru-wo-enai$/,
    /^zu-ni-wa-irarenai$/,
    /^zurai$/,
    // Adjective conjugations
    /^adjective-adverb$/,
    /^adjective-comparison$/,
    /^adjective-equivalence$/,
    /^adjective-negation$/,
    /^adjective-negative$/,
    /^adjective-past-negative$/,
    /^adjective-past$/,
    /^adjective-present$/,
    /^adjective-superlative$/,
    /^i-adjective-conjugation$/,
    /^na-adjective-conjugation$/,
    // Verb conjugations
    /^verb-dictionary$/,
    /^verb-groups$/,
    /^verb-imperative$/,
    /^verb-masen$/,
    /^verb-mashita$/,
    /^verb-nai-form$/,
    /^verb-nakatta$/,
    /^verb-negation$/,
    /^verb-negative-imperative$/,
    /^verb-pairs$/,
    /^verb-ta-form$/,
    /^verb-te-form$/,
    /^verb-volitional$/,
    /^verb-causative-passive$/,
    /^causative-passive-detail$/,
    // Connectors
    /^dakara$/,
    /^shi$/,
    /^sorede$/,
    /^soshite$/,
    // Particles (N3 level - advanced usage)
    /^particle-bakari$/,
    /^particle-dake$/,
    /^particle-hodo$/,
    /^particle-kurai$/,
    /^particle-nado$/,
    /^particle-shika$/,
    /^particle-yori$/,
    // Advanced expressions
    /^kachi-ga-aru$/,
    /^nai-dewa-irarenai$/,
  ],
  N2: [
    // Advanced patterns
    /^wake-/,
    /^bakari$/,
    /^causative-passive$/,
    /^ni-chigainai/,
    // Advanced keigo
    /^sonkeigo$/,
    /^kenjougo$/,
    /^honorific-/,
    /^humble-/,
    // Writing styles
    /^business-/,
    /^formal-writing/,
    /^email-etiquette$/,
    /^letter-writing$/,
    // Advanced grammar
    /^hodo-/,
    /^dake-/,
    // NEW: N2 grammar patterns (upper intermediate)
    /^buru$/,
    /^indirect-passive$/,
    /^kamoshirenai-detail$/,
    /^kamoshirenai$/,
    /^kaneru$/,
    /^perspective$/,
    /^prenoun-adjectivals$/,
    /^proverbs$/,
    /^sae$/,
    /^sentence-adverbs$/,
    /^service-language$/,
    /^when-use-keigo$/,
    /^yojijukugo$/,
    // Counters (more complex usage)
    /^counter-/,
    // Numbers/Time advanced
    /^native-sino-numbers$/,
    /^numbers-overview$/,
    /^time-adverbs$/,
    /^time-words$/,
    // Pronouns advanced
    /^demonstratives$/,
    /^personal-pronouns$/,
    // Expressions formal
    /^condolences$/,
    /^congratulations$/,
    /^farewells$/,
    /^set-phrases$/,
  ],
  N1: [
    // Literary/Academic
    /^classical-grammar$/,
    /^academic-/,
    /^literary/,
    /^dearu/,
    /^de-aru$/,
    /^newspaper/,
    // Very advanced patterns
    /^nu-negative$/,
    /^sura$/,
    /^ni-ataisuru$/,
    // Dialects (understanding)
    /^dialects/,
    /^slang/,
    /^regional/,
    // JLPT reference pages
    /^jlpt-/,
  ],
};

// Read the SQL file and extract slugs
function extractSlugs(sqlContent) {
  const slugs = [];
  // Match: VALUES ( 'slug-name',
  const regex = /VALUES\s*\(\s*'([a-z0-9-]+)'/gi;
  let match;
  while ((match = regex.exec(sqlContent)) !== null) {
    slugs.push(match[1]);
  }
  return [...new Set(slugs)]; // Remove duplicates
}

// Determine category for a slug
function getCategory(slug) {
  for (const rule of categoryRules) {
    if (rule.pattern.test(slug)) {
      return rule.category;
    }
  }
  return 'grammar-patterns'; // Default catch-all
}

// Determine JLPT level for a slug
function getJlptLevel(slug) {
  for (const [level, patterns] of Object.entries(jlptMappings)) {
    for (const pattern of patterns) {
      if (pattern.test(slug)) {
        return level;
      }
    }
  }
  return null; // No specific level assigned
}

// Group slugs by category
function groupByCategory(slugs) {
  const groups = {};
  for (const slug of slugs) {
    const category = getCategory(slug);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(slug);
  }
  return groups;
}

// Group slugs by JLPT level
function groupByJlpt(slugs) {
  const groups = { N5: [], N4: [], N3: [], N2: [], N1: [], unassigned: [] };
  for (const slug of slugs) {
    const level = getJlptLevel(slug);
    if (level) {
      groups[level].push(slug);
    } else {
      groups.unassigned.push(slug);
    }
  }
  return groups;
}

// Generate SQL UPDATE statements
function generateSql(slugs) {
  const categoryGroups = groupByCategory(slugs);
  const jlptGroups = groupByJlpt(slugs);

  let sql = `-- ============================================
-- Grammar Topics Category & JLPT Level Fixes
-- Generated by scripts/generate-grammar-sql.cjs
-- Total topics: ${slugs.length}
-- ============================================

`;

  // Category updates
  sql += `-- ============================================
-- CATEGORY FIXES
-- ============================================

`;

  for (const [category, categorySlugs] of Object.entries(categoryGroups)) {
    if (categorySlugs.length === 0) continue;

    sql += `-- ${category} (${categorySlugs.length} topics)\n`;

    // Use IN clause for multiple slugs
    if (categorySlugs.length > 1) {
      const slugList = categorySlugs.map(s => `'${s}'`).join(', ');
      sql += `UPDATE grammar_topics SET category = '${category}' WHERE slug IN (${slugList});\n\n`;
    } else {
      sql += `UPDATE grammar_topics SET category = '${category}' WHERE slug = '${categorySlugs[0]}';\n\n`;
    }
  }

  // JLPT level updates
  sql += `-- ============================================
-- JLPT LEVEL FIXES
-- ============================================

`;

  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
    const levelSlugs = jlptGroups[level];
    if (levelSlugs.length === 0) continue;

    sql += `-- ${level} (${levelSlugs.length} topics)\n`;
    const slugList = levelSlugs.map(s => `'${s}'`).join(', ');
    sql += `UPDATE grammar_topics SET jlpt_level = '${level}' WHERE slug IN (${slugList});\n\n`;
  }

  // Report unassigned
  if (jlptGroups.unassigned.length > 0) {
    sql += `-- ============================================
-- UNASSIGNED JLPT LEVELS (${jlptGroups.unassigned.length} topics)
-- These topics need manual JLPT level assignment
-- ============================================
-- Slugs: ${jlptGroups.unassigned.slice(0, 20).join(', ')}${jlptGroups.unassigned.length > 20 ? '...' : ''}
`;
  }

  return sql;
}

// Print summary
function printSummary(slugs) {
  const categoryGroups = groupByCategory(slugs);
  const jlptGroups = groupByJlpt(slugs);

  console.log('\n=== CATEGORY SUMMARY ===');
  for (const [category, categorySlugs] of Object.entries(categoryGroups).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${category}: ${categorySlugs.length} topics`);
  }

  console.log('\n=== JLPT LEVEL SUMMARY ===');
  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1', 'unassigned']) {
    console.log(`  ${level}: ${jlptGroups[level].length} topics`);
  }
}

// Main execution
function main() {
  const inputFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260101_import_grammar_topics.sql');
  const outputFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260102_update_grammar_content.sql');

  console.log('Reading:', inputFile);

  if (!fs.existsSync(inputFile)) {
    console.error('Error: Input file not found:', inputFile);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(inputFile, 'utf8');
  const slugs = extractSlugs(sqlContent);

  console.log(`Found ${slugs.length} unique slugs`);

  printSummary(slugs);

  const updateSql = generateSql(slugs);

  // Read existing file if it exists and append
  let existingContent = '';
  if (fs.existsSync(outputFile)) {
    existingContent = fs.readFileSync(outputFile, 'utf8');
    // Check if updates already exist
    if (existingContent.includes('CATEGORY FIXES')) {
      console.log('\nUpdates already exist in output file. Overwriting...');
      existingContent = '';
    }
  }

  fs.writeFileSync(outputFile, existingContent + updateSql);
  console.log('\nGenerated:', outputFile);
  console.log('Done!');
}

main();
