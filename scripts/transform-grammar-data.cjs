/**
 * Transform scraped practice-japanese.com data into organized topics.json format
 * Then merge with existing Tae Kim topics
 *
 * Enhanced for study-friendly chapter structure:
 * - Organized lessons with clear progression
 * - Key points and summaries
 * - Common mistakes
 * - Practice tips
 * - Chapter ordering for textbook-style learning
 */

const fs = require('fs');
const path = require('path');

const SCRAPED_DIR = path.join(__dirname, '../grammar-data/practice-japanese');
const TAEKIM_FILE = path.join(__dirname, '../grammar-data/topics.json');
const OUTPUT_FILE = path.join(__dirname, '../grammar-data/combined-topics.json');

// JLPT level assignment patterns (from generate-grammar-sql.cjs)
const JLPT_PATTERNS = {
  N5: [
    /^particle-(wa|ga|wo|ni|de|e|to|mo|no|ka)$/,
    /^particles-overview$/,
    /^desu$/,
    /^da$/,
    /^verb-(masu|basics)$/,
    /^adjective-basics$/,
    /^i-adjectives$/,
    /^na-adjectives$/,
    /^question-words$/,
    /^(nani|dare|doko|itsu|ikura|ikutsu|naze|doushite|dou)$/,
    /^greetings$/,
    /^thanks$/,
    /^apologies$/,
    /^counters-basics$/,
    /^first-person$/,
    /^second-person$/,
    /^third-person$/,
    /^sentence-structure$/,
    /^parts-of-speech$/,
  ],
  N4: [
    /^te-(form|iru|ita|aru|oku|shimau|miru|kudasai|mo|kara|ageru|kureru|morau|hoshii)$/,
    /^te-(iku|kuru|moraemasu-ka|kuremasu-ka|itadakemasu-ka|naranai|wa-ikenai|wa-dame|mo-ii)$/,
    /^(tara|to)-conditional$/,
    /^verb-(potential|nai-form|ta-form|te-form|dictionary|negation|nakatta|groups)$/,
    /^potential-(form|vs-ability)$/,
    /^ko-so-a-do$/,
    /^(hoshii|tai|hou-ga-ii)$/,
    /^(node|nazenara)$/,
    /^casual-speech$/,
    /^(duration|frequency)$/,
    /^action-direction$/,
    /^janai$/,
    /^particle-(kara|made|ya|ne|yo|yone|zo)$/,
    /^te-aru-detail$/,
    /^te-iru-(transitive|vs-te-aru)$/,
    /^te-(iku|kuru)-change$/,
    /^te-(oku|shimau)-detail$/,
  ],
  N3: [
    /^verb-(ba|nara|tara|to)-conditional$/,
    /^verb-(causative|passive|causative-passive|volitional|imperative|negative-imperative)$/,
    /^(causative|passive)-(formation|keigo|relationships)$/,
    /^causative-passive-detail$/,
    /^adjective-(adverb|comparison|equivalence|negation|negative|past|past-negative|present|superlative)$/,
    /^(i|na)-adjective-conjugation$/,
    /^(keigo-overview|teineigo|sonkeigo|kenjougo)$/,
    /^(sou-observation|sou-hearsay|rashii|mitai|you-da)$/,
    /^(beki|mono-da|tsumori|hazu-da|wake-da)$/,
    /^(noni|tame-ni|nagara)$/,
    /^(gender|age)-speech$/,
    /^comparing-conditionals$/,
    /^relative-clauses$/,
    /^compound-verbs$/,
    /^particle-(bakari|dake|hodo|kurai|nado|shika|yori)$/,
    /^(kachi-ga-aru|nai-dewa-irarenai)$/,
    /^(beki|hazu|noni|wake|you)-detail$/,
    /^(direct|indirect|adversity)-passive$/,
    /^(tame-ni|you-ni)-purpose$/,
  ],
  N2: [
    /^(honorific|humble)-verbs$/,
    /^honorific-prefixes$/,
    /^business-(keigo|writing)$/,
    /^(dake|bakari|hodo|kurai|mama|noni|wake)-(detail|extent|comparison)$/,
    /^counter-(hai|hiki|hon|kai|mai|nin|tou|tsu)$/,
    /^counter-kai-times$/,
    /^(dakara|shi|sorede|soshite)$/,
    /^(condolences|congratulations|farewells|set-phrases)$/,
    /^(giving|receiving)-verbs$/,
    /^kureru-kudasaru$/,
    /^(native-sino-numbers|numbers-overview|time-adverbs|time-words)$/,
    /^(demonstratives|personal-pronouns)$/,
    /^(letter-writing|email-etiquette)$/,
    /^(kamoshirenai|ni-chigainai)(-detail)?$/,
    /^(buru|kaneru|sae|sura|perspective|prenoun-adjectivals|proverbs|sentence-adverbs|service-language|when-use-keigo|yojijukugo)$/,
  ],
  N1: [
    /^(academic-writing|dearu-style|de-aru|classical-grammar|nu-negative|ni-ataisuru)$/,
    /^dialects-overview$/,
    /^newspaper-japanese$/,
    /^jlpt-n[1-5]-grammar$/,
  ],
};

// Category assignment patterns - order matters (more specific first)
const CATEGORY_PATTERNS = {
  'particles': /^particle-/,
  'verb-forms': /^verb-|^te-|^(causative|passive|potential|volitional|imperative|teiru|tai|nakereba)($|-)/,
  'adjectives': /^(adjective-|i-adjective|na-adjective)/,
  'counters': /^counter-|^counters-/,
  'question-words': /^(nani|dare|doko|itsu|ikura|ikutsu|naze|doushite|dou|question-words)$/,
  'keigo': /^(keigo|teineigo|sonkeigo|kenjougo|honorific|humble|business-keigo|service-language|when-use-keigo)/,
  'expressions': /^(greetings|thanks|apologies|condolences|congratulations|farewells|set-phrases)/,
  'basics': /^(desu|da|da-desu|janai|sentence-structure|parts-of-speech|particles-overview)$/,
  'pronouns': /^(first|second|third)-person|^(demonstratives|personal-pronouns|ko-so-a-do)/,
  'numbers-time': /^(counter-|counters-|native-sino-numbers|numbers-overview|time-adverbs|time-words|duration|frequency)/,
  'speech-styles': /^(casual-speech|gender-speech|age-speech|dialects)/,
  'writing-style': /^(academic-writing|dearu-style|business-writing|letter-writing|email-etiquette|newspaper-japanese)/,
  'connectors': /^(dakara|shi|sorede|soshite|node|nazenara|kara-reason|node-reason)$/,
  'conditionals': /^(tara|to|ba|nara)-conditional$|^conditionals-(ba|tara|to|nara|overview)$|^conditionals$|^comparing-conditionals$|^verb-(ba|nara|tara|to)-conditional$/,
  'giving-receiving': /^(giving|receiving)-verbs|^kureru-kudasaru|^te-(ageru|kureru|morau)/,
  'jlpt-reference': /^jlpt-n[1-5]-grammar/,
  // Catch patterns for grammar forms
  'grammar-patterns': /^(sou-|rashii|mitai|you-da|beki|mono-da|tsumori|hazu|wake|noni|tame-ni|nagara|relative-clauses|compound)/,
};

// Chapter structure for textbook-style learning progression
// Each chapter has an order, title, and list of topic patterns
const CHAPTERS = [
  {
    id: 'ch01-foundations',
    order: 1,
    title: 'Foundations',
    titleJapanese: '基礎',
    description: 'Essential building blocks of Japanese',
    patterns: [/^sentence-structure$/, /^parts-of-speech$/, /^desu$/, /^da$/, /^da-desu$/]
  },
  {
    id: 'ch02-particles-basic',
    order: 2,
    title: 'Basic Particles',
    titleJapanese: '助詞の基本',
    description: 'Core particles that form the backbone of Japanese sentences',
    patterns: [/^particles-overview$/, /^particle-wa$/, /^particle-ga$/, /^particle-wo$/, /^particle-ni$/, /^particle-de$/, /^particle-e$/, /^particle-to$/, /^particle-mo$/, /^particle-no$/, /^particle-ka$/]
  },
  {
    id: 'ch03-verbs-basic',
    order: 3,
    title: 'Verb Basics',
    titleJapanese: '動詞の基本',
    description: 'Introduction to Japanese verbs and conjugation',
    patterns: [/^verb-basics$/, /^verb-groups$/, /^verb-masu$/, /^verb-dictionary$/, /^verb-negation$/, /^verb-te-form$/, /^verb-ta-form$/]
  },
  {
    id: 'ch04-adjectives',
    order: 4,
    title: 'Adjectives',
    titleJapanese: '形容詞',
    description: 'い-adjectives and な-adjectives',
    patterns: [/^adjective/, /^i-adjective/, /^na-adjective/]
  },
  {
    id: 'ch05-questions',
    order: 5,
    title: 'Questions & Pronouns',
    titleJapanese: '疑問詞と代名詞',
    description: 'Question words and personal pronouns',
    patterns: [/^question-words$/, /^nani$/, /^dare$/, /^doko$/, /^itsu$/, /^naze$/, /^dou$/, /^first-person$/, /^second-person$/, /^third-person$/, /^personal-pronouns$/, /^demonstratives$/, /^ko-so-a-do$/]
  },
  {
    id: 'ch06-expressions',
    order: 6,
    title: 'Common Expressions',
    titleJapanese: '日常表現',
    description: 'Greetings, thanks, and everyday phrases',
    patterns: [/^greetings$/, /^thanks$/, /^apologies$/, /^farewells$/, /^set-phrases$/]
  },
  {
    id: 'ch07-te-form',
    order: 7,
    title: 'て-Form & Connections',
    titleJapanese: 'て形',
    description: 'The versatile て-form and its many uses',
    patterns: [/^te-/]
  },
  {
    id: 'ch08-particles-advanced',
    order: 8,
    title: 'Advanced Particles',
    titleJapanese: '助詞（上級）',
    description: 'More nuanced particle usage',
    patterns: [/^particle-(kara|made|ya|ne|yo|yone|zo|bakari|dake|hodo|kurai|nado|shika|yori)$/]
  },
  {
    id: 'ch09-verb-forms',
    order: 9,
    title: 'Verb Forms',
    titleJapanese: '動詞活用',
    description: 'Potential, volitional, imperative, and more',
    patterns: [/^verb-(potential|volitional|imperative|nai-form|nakatta|negative-imperative)$/, /^potential/, /^volitional$/, /^causative/, /^passive/, /^teiru$/, /^tai$/, /^nakereba$/]
  },
  {
    id: 'ch10-conditionals',
    order: 10,
    title: 'Conditionals',
    titleJapanese: '条件形',
    description: 'If/when expressions: たら、と、ば、なら',
    patterns: [/conditional/, /^comparing-conditionals$/]
  },
  {
    id: 'ch11-giving-receiving',
    order: 11,
    title: 'Giving & Receiving',
    titleJapanese: '授受表現',
    description: 'あげる、もらう、くれる and their uses',
    patterns: [/^giving/, /^receiving/, /^kureru-kudasaru$/]
  },
  {
    id: 'ch12-connectors',
    order: 12,
    title: 'Connecting Ideas',
    titleJapanese: '接続表現',
    description: 'Conjunctions and sentence connectors',
    patterns: [/^dakara$/, /^shi$/, /^sorede$/, /^soshite$/, /^node$/, /^nazenara$/, /^kara-reason$/, /^node-reason$/]
  },
  {
    id: 'ch13-expressions-grammar',
    order: 13,
    title: 'Grammar Expressions',
    titleJapanese: '文法表現',
    description: 'Common grammar patterns and expressions',
    patterns: [/^sou-/, /^rashii$/, /^mitai$/, /^you-da$/, /^beki$/, /^mono-da$/, /^tsumori$/, /^hazu/, /^wake/, /^noni/, /^tame-ni/, /^nagara$/]
  },
  {
    id: 'ch14-keigo',
    order: 14,
    title: 'Honorific Language',
    titleJapanese: '敬語',
    description: 'Polite, respectful, and humble speech',
    patterns: [/^keigo/, /^teineigo$/, /^sonkeigo$/, /^kenjougo$/, /^honorific/, /^humble/, /^service-language$/, /^when-use-keigo$/]
  },
  {
    id: 'ch15-counters',
    order: 15,
    title: 'Counters & Numbers',
    titleJapanese: '助数詞',
    description: 'Counting things in Japanese',
    patterns: [/^counter/, /^counters-basics$/, /^numbers-overview$/, /^native-sino-numbers$/]
  },
  {
    id: 'ch16-time',
    order: 16,
    title: 'Time & Duration',
    titleJapanese: '時間表現',
    description: 'Expressing time, duration, and frequency',
    patterns: [/^time-/, /^duration$/, /^frequency$/]
  },
  {
    id: 'ch17-speech-styles',
    order: 17,
    title: 'Speech Styles',
    titleJapanese: '話し方',
    description: 'Casual, formal, and situational speech',
    patterns: [/^casual-speech$/, /^gender-speech$/, /^age-speech$/, /^dialects/]
  },
  {
    id: 'ch18-writing',
    order: 18,
    title: 'Writing Styles',
    titleJapanese: '文体',
    description: 'Academic, business, and formal writing',
    patterns: [/^academic-writing$/, /^dearu-style$/, /^business-writing$/, /^letter-writing$/, /^email-etiquette$/, /^newspaper-japanese$/]
  },
  {
    id: 'ch19-advanced',
    order: 19,
    title: 'Advanced Grammar',
    titleJapanese: '上級文法',
    description: 'Complex patterns and literary expressions',
    patterns: [/^relative-clauses$/, /^compound/, /^classical-grammar$/, /^de-aru$/, /^nu-negative$/]
  },
  {
    id: 'ch20-jlpt',
    order: 20,
    title: 'JLPT Reference',
    titleJapanese: 'JLPT参考',
    description: 'Grammar organized by JLPT level',
    patterns: [/^jlpt-n[1-5]-grammar$/]
  }
];

/**
 * Get chapter info for a topic slug
 */
function getChapterInfo(slug) {
  for (const chapter of CHAPTERS) {
    for (const pattern of chapter.patterns) {
      if (pattern.test(slug)) {
        return {
          chapterId: chapter.id,
          chapterOrder: chapter.order,
          chapterTitle: chapter.title,
          chapterTitleJapanese: chapter.titleJapanese
        };
      }
    }
  }
  // Default to grammar-patterns chapter
  return {
    chapterId: 'ch13-expressions-grammar',
    chapterOrder: 13,
    chapterTitle: 'Grammar Expressions',
    chapterTitleJapanese: '文法表現'
  };
}

/**
 * Get JLPT level for a slug
 */
function getJlptLevel(slug) {
  for (const [level, patterns] of Object.entries(JLPT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(slug)) {
        return level;
      }
    }
  }
  return 'N3'; // Default to N3 for unmatched
}

/**
 * Get category for a slug
 */
function getCategory(slug) {
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(slug)) {
      return category;
    }
  }
  return 'grammar-patterns'; // Default category
}

/**
 * Extract Japanese pattern from title or content
 */
function extractPattern(title, sections) {
  // Try to extract from title like "は (wa) - Topic Marker" or "Te-form Conjugation"
  const titleMatch = title.match(/^([ぁ-んァ-ヶー一-龯]+)/);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Try to find pattern in first section
  if (sections && sections.length > 0) {
    const content = sections[0].content || '';
    // Look for Japanese characters at start of examples
    const jpMatch = content.match(/([ぁ-んァ-ヶー一-龯]+)/);
    if (jpMatch) {
      return jpMatch[1];
    }
  }

  return '';
}

/**
 * Extract examples from section content
 */
function extractExamples(sections) {
  const examples = [];
  const seenSentences = new Set();

  function processContent(content) {
    if (!content) return;

    // Pattern: Japanese sentence followed by reading in parentheses and English
    // e.g., "私は学生です watashi wa gakusei desu \"I am a student\""
    // or "食べる → 食べて (tabete)"
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip footer/navigation content
      if (line.includes('About') || line.includes('Privacy') || line.includes('Terms')) continue;

      // Pattern 1: Japanese reading "English"
      const match1 = line.match(/([ぁ-んァ-ヶー一-龯、。！？]+)\s+([a-zA-Z\s]+)\s+"([^"]+)"/);
      if (match1 && !seenSentences.has(match1[1])) {
        seenSentences.add(match1[1]);
        examples.push({
          japanese: match1[1],
          reading: match1[2].trim(),
          english: match1[3]
        });
        continue;
      }

      // Pattern 2: Japanese - "English"
      const match2 = line.match(/([ぁ-んァ-ヶー一-龯、。！？]+)\s+-\s+"([^"]+)"/);
      if (match2 && !seenSentences.has(match2[1])) {
        seenSentences.add(match2[1]);
        examples.push({
          japanese: match2[1],
          reading: '',
          english: match2[2]
        });
        continue;
      }

      // Pattern 3: Japanese "English" (without dash)
      const match3 = line.match(/^([ぁ-んァ-ヶー一-龯、。！？]+)\s+"([^"]+)"$/);
      if (match3 && !seenSentences.has(match3[1])) {
        seenSentences.add(match3[1]);
        examples.push({
          japanese: match3[1],
          reading: '',
          english: match3[2]
        });
      }
    }
  }

  function processSections(secs) {
    for (const sec of secs) {
      processContent(sec.content);
      if (sec.children) {
        processSections(sec.children);
      }
    }
  }

  processSections(sections);

  // Limit to first 5 examples
  return examples.slice(0, 5);
}

/**
 * Extract description from sections
 */
function extractDescription(sections) {
  if (!sections || sections.length === 0) return '';

  // Get content from first 1-2 sections
  let desc = '';
  for (let i = 0; i < Math.min(2, sections.length); i++) {
    const content = sections[i].content;
    if (content) {
      // Get first paragraph
      const firstPara = content.split('\n\n')[0];
      if (firstPara && firstPara.length < 500) {
        desc += (desc ? ' ' : '') + firstPara;
      }
    }
  }

  // Clean up and truncate
  return desc.replace(/\s+/g, ' ').trim().slice(0, 300);
}

/**
 * Extract usage notes from sections
 */
function extractUsage(sections) {
  const usageKeywords = ['How to', 'Usage', 'When to use', 'Use this', 'Position', 'Main Uses'];

  for (const sec of sections) {
    if (usageKeywords.some(kw => sec.heading && sec.heading.includes(kw))) {
      const content = sec.content || '';
      if (sec.children && sec.children.length > 0) {
        // Combine children headings
        return sec.children.map(c => c.heading).filter(Boolean).join(', ');
      }
      return content.split('\n')[0];
    }
  }

  return '';
}

/**
 * Extract notes/key takeaways
 */
function extractNotes(sections) {
  for (const sec of sections) {
    if (sec.heading && (sec.heading.includes('Key Takeaways') || sec.heading.includes('Notes') || sec.heading.includes('Remember'))) {
      let content = sec.content || '';
      // Clean up checkmarks and formatting
      content = content.replace(/[✓✗⚠️]/g, '').replace(/\s+/g, ' ').trim();
      return content.slice(0, 300);
    }
  }
  return '';
}

/**
 * Extract key points as an array for study cards
 */
function extractKeyPoints(sections) {
  const keyPoints = [];

  for (const sec of sections) {
    if (sec.heading && (sec.heading.includes('Key Takeaways') || sec.heading.includes('Key Points') || sec.heading.includes('Summary'))) {
      const content = sec.content || '';
      // Split by checkmarks or bullet-like patterns
      const points = content.split(/[✓✗•\n]/).filter(p => p.trim().length > 5);
      keyPoints.push(...points.map(p => p.replace(/\s+/g, ' ').trim()).slice(0, 8));
    }
  }

  return keyPoints;
}

/**
 * Extract common mistakes section
 */
function extractCommonMistakes(sections) {
  const mistakes = [];

  function findMistakes(secs) {
    for (const sec of secs) {
      if (sec.heading && (sec.heading.includes('Mistake') || sec.heading.includes('Common Error') || sec.heading.includes('Wrong'))) {
        const content = sec.content || '';
        // Look for wrong/right patterns
        const wrongMatch = content.match(/Wrong:\s*(.+?)(?:Right:|Correct:|✓|$)/s);
        const rightMatch = content.match(/(?:Right|Correct):\s*(.+?)(?:\n\n|$)/s);

        if (wrongMatch || rightMatch) {
          mistakes.push({
            wrong: wrongMatch ? wrongMatch[1].trim().split('\n')[0] : '',
            correct: rightMatch ? rightMatch[1].trim().split('\n')[0] : '',
            explanation: sec.heading.replace(/^Mistake \d+:\s*/, '')
          });
        }
      }
      if (sec.children) {
        findMistakes(sec.children);
      }
    }
  }

  findMistakes(sections);
  return mistakes.slice(0, 5);
}

/**
 * Extract practice tips
 */
function extractPracticeTips(sections) {
  const tips = [];

  for (const sec of sections) {
    if (sec.heading && (sec.heading.includes('Practice') || sec.heading.includes('Drill') || sec.heading.includes('Tips') || sec.heading.includes('Strategy'))) {
      const content = sec.content || '';
      if (content.length > 20) {
        tips.push(content.split('\n')[0].replace(/\s+/g, ' ').trim());
      }
    }
  }

  return tips.slice(0, 3);
}

/**
 * Extract conjugation rules if present
 */
function extractConjugationRules(sections) {
  const rules = [];

  function findRules(secs) {
    for (const sec of secs) {
      if (sec.heading && (sec.heading.includes('Conjugation') || sec.heading.includes('Pattern') || sec.heading.includes('Formation') || sec.heading.includes('Rule'))) {
        const content = sec.content || '';
        // Look for arrow patterns like "食べる → 食べて"
        const arrowMatches = content.match(/([ぁ-んァ-ヶー一-龯]+)\s*→\s*([ぁ-んァ-ヶー一-龯]+)/g);
        if (arrowMatches) {
          for (const match of arrowMatches.slice(0, 5)) {
            const parts = match.split('→').map(p => p.trim());
            if (parts.length === 2) {
              rules.push({ from: parts[0], to: parts[1] });
            }
          }
        }
      }
      if (sec.children) {
        findRules(sec.children);
      }
    }
  }

  findRules(sections);
  return rules.slice(0, 10);
}

/**
 * Extract related patterns
 */
function extractRelatedPatterns(sections) {
  const related = [];

  for (const sec of sections) {
    if (sec.heading && sec.heading.includes('Related')) {
      const content = sec.content || '';
      // Extract Japanese patterns
      const matches = content.match(/([ぁ-んァ-ヶー一-龯]+)/g);
      if (matches) {
        related.push(...matches.slice(0, 5));
      }
    }
  }

  return [...new Set(related)];
}

/**
 * Convert section hierarchy to flat content for database
 */
function sectionsToContent(sections, level = 0) {
  let result = [];

  for (const sec of sections) {
    if (sec.heading) {
      // Skip footer sections
      if (['Company', 'Legal'].includes(sec.heading)) continue;

      result.push({
        level: sec.level || (level + 2),
        heading: sec.heading,
        content: sec.content || ''
      });
    }

    if (sec.children && sec.children.length > 0) {
      result.push(...sectionsToContent(sec.children, level + 1));
    }
  }

  return result;
}

/**
 * Transform a scraped file to topic format
 */
function transformScrapedFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.data || !data.data.sections) {
      console.log(`  Skipping ${path.basename(filePath)} - no sections`);
      return null;
    }

    // Extract slug from URL or filename
    let slug = '';
    if (data.url) {
      const urlMatch = data.url.match(/\/docs\/([^/]+)\/?$/);
      if (urlMatch) {
        slug = urlMatch[1];
      }
    }
    if (!slug) {
      // Try from filename
      const fnMatch = path.basename(filePath).match(/practice-japanese\.com_docs_(.+)\.json$/);
      if (fnMatch) {
        slug = fnMatch[1];
      }
    }

    if (!slug) {
      console.log(`  Skipping ${path.basename(filePath)} - no slug`);
      return null;
    }

    const sections = data.data.sections;
    const title = data.data.metadata?.title || '';

    // Filter out footer sections
    const cleanSections = sections.filter(s =>
      !['Company', 'Legal'].includes(s.heading)
    );

    // Get chapter info
    const chapterInfo = getChapterInfo(slug);

    // Build topic object with study-friendly structure
    const topic = {
      id: slug,
      pattern: extractPattern(title, cleanSections),
      name: title.replace(/\s*-\s*$/, '').trim(),
      nameJapanese: '', // Will be filled if available
      category: getCategory(slug),
      level: getJlptLevel(slug),

      // Chapter info for textbook-style organization
      chapterId: chapterInfo.chapterId,
      chapterOrder: chapterInfo.chapterOrder,
      chapterTitle: chapterInfo.chapterTitle,
      chapterTitleJapanese: chapterInfo.chapterTitleJapanese,

      // Core content
      description: extractDescription(cleanSections),
      usage: extractUsage(cleanSections),

      // Study materials
      examples: extractExamples(cleanSections),
      keyPoints: extractKeyPoints(cleanSections),
      commonMistakes: extractCommonMistakes(cleanSections),
      practiceTips: extractPracticeTips(cleanSections),
      conjugationRules: extractConjugationRules(cleanSections),

      // Additional info
      notes: extractNotes(cleanSections),
      relatedPatterns: extractRelatedPatterns(cleanSections),

      // Full content for detailed study
      sections: sectionsToContent(cleanSections),
      sourceUrl: data.url || ''
    };

    return topic;

  } catch (err) {
    console.error(`  Error processing ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Grammar Data Transformation ===\n');

  // Load existing Tae Kim topics
  let taekimTopics = [];
  try {
    taekimTopics = JSON.parse(fs.readFileSync(TAEKIM_FILE, 'utf8'));
    console.log(`Loaded ${taekimTopics.length} Tae Kim topics from topics.json`);
  } catch (err) {
    console.log('No existing topics.json found, starting fresh');
  }

  // Create a map of existing topics by ID, fixing categories/levels and adding chapter info
  const topicsMap = new Map();
  for (const topic of taekimTopics) {
    // Fix category and level using computed values
    topic.category = getCategory(topic.id);
    topic.level = getJlptLevel(topic.id);

    // Add chapter info
    const chapterInfo = getChapterInfo(topic.id);
    topic.chapterId = chapterInfo.chapterId;
    topic.chapterOrder = chapterInfo.chapterOrder;
    topic.chapterTitle = chapterInfo.chapterTitle;
    topic.chapterTitleJapanese = chapterInfo.chapterTitleJapanese;

    // Initialize study fields if not present
    if (!topic.keyPoints) topic.keyPoints = [];
    if (!topic.commonMistakes) topic.commonMistakes = [];
    if (!topic.practiceTips) topic.practiceTips = [];
    if (!topic.conjugationRules) topic.conjugationRules = [];

    topicsMap.set(topic.id, topic);
  }

  // Process all scraped files
  const files = fs.readdirSync(SCRAPED_DIR).filter(f => f.endsWith('.json'));
  console.log(`\nProcessing ${files.length} scraped files...\n`);

  let added = 0;
  let merged = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(SCRAPED_DIR, file);
    const topic = transformScrapedFile(filePath);

    if (!topic) {
      skipped++;
      continue;
    }

    if (topicsMap.has(topic.id)) {
      // Merge: keep Tae Kim structure but add/enhance sections from scraped data
      const existing = topicsMap.get(topic.id);

      // Fix category and level using computed values (override old incorrect values)
      existing.category = getCategory(existing.id);
      existing.level = getJlptLevel(existing.id);

      // Add sections if not present
      if (!existing.sections || existing.sections.length === 0) {
        existing.sections = topic.sections;
      }

      // Add source URL
      if (!existing.sourceUrl && topic.sourceUrl) {
        existing.sourceUrl = topic.sourceUrl;
      }

      // Add more examples if we have fewer than 5
      if (existing.examples && existing.examples.length < 5 && topic.examples.length > 0) {
        const existingJp = new Set(existing.examples.map(e => e.japanese));
        for (const ex of topic.examples) {
          if (!existingJp.has(ex.japanese) && existing.examples.length < 5) {
            existing.examples.push(ex);
          }
        }
      }

      // Add study fields from scraped data if not present
      if ((!existing.keyPoints || existing.keyPoints.length === 0) && topic.keyPoints.length > 0) {
        existing.keyPoints = topic.keyPoints;
      }
      if ((!existing.commonMistakes || existing.commonMistakes.length === 0) && topic.commonMistakes.length > 0) {
        existing.commonMistakes = topic.commonMistakes;
      }
      if ((!existing.practiceTips || existing.practiceTips.length === 0) && topic.practiceTips.length > 0) {
        existing.practiceTips = topic.practiceTips;
      }
      if ((!existing.conjugationRules || existing.conjugationRules.length === 0) && topic.conjugationRules.length > 0) {
        existing.conjugationRules = topic.conjugationRules;
      }

      merged++;
    } else {
      // Add new topic
      topicsMap.set(topic.id, topic);
      added++;
    }
  }

  // Convert map to sorted array - sort by chapter order, then level, then name
  const allTopics = Array.from(topicsMap.values()).sort((a, b) => {
    // Primary sort: chapter order (for textbook progression)
    if (a.chapterOrder !== b.chapterOrder) return (a.chapterOrder || 99) - (b.chapterOrder || 99);
    // Secondary sort: JLPT level (N5 first)
    if (a.level !== b.level) return a.level.localeCompare(b.level);
    // Tertiary sort: name
    return a.name.localeCompare(b.name);
  });

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTopics, null, 2));

  console.log('\n=== Summary ===');
  console.log(`Total topics: ${allTopics.length}`);
  console.log(`  - From Tae Kim: ${taekimTopics.length}`);
  console.log(`  - Added from scraped: ${added}`);
  console.log(`  - Merged: ${merged}`);
  console.log(`  - Skipped: ${skipped}`);
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);

  // Show distributions
  const categoryCounts = {};
  const levelCounts = {};
  const chapterCounts = {};

  for (const topic of allTopics) {
    categoryCounts[topic.category] = (categoryCounts[topic.category] || 0) + 1;
    levelCounts[topic.level] = (levelCounts[topic.level] || 0) + 1;
    chapterCounts[topic.chapterTitle] = (chapterCounts[topic.chapterTitle] || 0) + 1;
  }

  console.log('\n=== Chapter Distribution (Textbook Order) ===');
  const sortedChapters = Object.entries(chapterCounts).sort((a, b) => {
    const orderA = CHAPTERS.find(c => c.title === a[0])?.order || 99;
    const orderB = CHAPTERS.find(c => c.title === b[0])?.order || 99;
    return orderA - orderB;
  });
  for (const [chapter, count] of sortedChapters) {
    const chapterInfo = CHAPTERS.find(c => c.title === chapter);
    const order = chapterInfo ? String(chapterInfo.order).padStart(2, '0') : '??';
    console.log(`  Ch.${order} ${chapter}: ${count} topics`);
  }

  console.log('\n=== JLPT Level Distribution ===');
  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
    console.log(`  ${level}: ${levelCounts[level] || 0}`);
  }

  console.log('\n=== Category Distribution ===');
  for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Count topics with study materials
  const withKeyPoints = allTopics.filter(t => t.keyPoints && t.keyPoints.length > 0).length;
  const withMistakes = allTopics.filter(t => t.commonMistakes && t.commonMistakes.length > 0).length;
  const withTips = allTopics.filter(t => t.practiceTips && t.practiceTips.length > 0).length;
  const withRules = allTopics.filter(t => t.conjugationRules && t.conjugationRules.length > 0).length;

  console.log('\n=== Study Materials ===');
  console.log(`  Topics with key points: ${withKeyPoints}`);
  console.log(`  Topics with common mistakes: ${withMistakes}`);
  console.log(`  Topics with practice tips: ${withTips}`);
  console.log(`  Topics with conjugation rules: ${withRules}`);
}

main().catch(console.error);
