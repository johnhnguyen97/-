/**
 * Import grammar data from both sources:
 * 1. grammar-data/grammar-complete.json (Tae Kim's guide - 32 topics)
 * 2. practice-japanese data folder (392 detailed topic files)
 *
 * Run with: npx ts-node scripts/import-grammar-complete.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface GrammarSection {
  heading?: string;
  content?: string;
  examples?: Array<{
    japanese: string;
    english: string;
    reading?: string;
  }>;
}

interface GrammarTopic {
  slug: string;
  title: string;
  url: string | null;
  category: string;
  jlpt_level: string | null;
  sections: GrammarSection[];
  raw_content: string | null;
}

// Extract slug from filename
function extractSlug(filename: string): string {
  // Remove prefix and extension
  return filename
    .replace('practice-japanese.com_docs_', '')
    .replace('.json', '')
    .replace(/\./g, '-');
}

// Determine category from content or slug
function determineCategory(slug: string, title: string, content: string): string {
  const lowerSlug = slug.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Particles
  if (lowerSlug.startsWith('particle-') || lowerTitle.includes('particle')) {
    return 'particles';
  }

  // Verb forms and conjugation
  if (lowerSlug.includes('verb') || lowerSlug.includes('conjugat') ||
      lowerSlug.includes('te-form') || lowerSlug.includes('ta-form') ||
      lowerSlug.includes('masu') || lowerSlug.includes('potential') ||
      lowerSlug.includes('passive') || lowerSlug.includes('causative') ||
      lowerSlug.includes('imperative') || lowerSlug.includes('volitional') ||
      lowerTitle.includes('verb') || lowerTitle.includes('conjugat')) {
    return 'verb-conjugation';
  }

  // Conditionals
  if (lowerSlug.includes('conditional') || lowerSlug.includes('-ba') ||
      lowerSlug.includes('tara') || lowerSlug.includes('nara') ||
      lowerSlug.includes('-to-') || lowerTitle.includes('conditional') ||
      lowerTitle.includes('if ')) {
    return 'conditionals';
  }

  // Adjectives
  if (lowerSlug.includes('adjective') || lowerSlug.includes('i-adj') ||
      lowerSlug.includes('na-adj') || lowerTitle.includes('adjective')) {
    return 'adjectives';
  }

  // Expressions and patterns
  if (lowerSlug.includes('express') || lowerSlug.includes('pattern') ||
      lowerContent.includes('expression') || lowerContent.includes('grammar pattern')) {
    return 'expressions';
  }

  // Keigo / Honorifics
  if (lowerSlug.includes('keigo') || lowerSlug.includes('honorif') ||
      lowerSlug.includes('humble') || lowerSlug.includes('polite') ||
      lowerTitle.includes('keigo') || lowerTitle.includes('honorific')) {
    return 'keigo';
  }

  // Questions
  if (lowerSlug.includes('question') || lowerTitle.includes('question')) {
    return 'questions';
  }

  // Copula
  if (lowerSlug.includes('copula') || lowerSlug.includes('desu') ||
      lowerSlug.includes('-da') || lowerTitle.includes('copula')) {
    return 'copula';
  }

  return 'grammar';
}

// Determine JLPT level from content
function determineLevel(content: string, title: string): string | null {
  const text = (content + ' ' + title).toLowerCase();

  if (text.includes('n1') || text.includes('advanced') || text.includes('jlpt 1')) {
    return 'N1';
  }
  if (text.includes('n2') || text.includes('upper intermediate')) {
    return 'N2';
  }
  if (text.includes('n3') || text.includes('intermediate')) {
    return 'N3';
  }
  if (text.includes('n4') || text.includes('elementary')) {
    return 'N4';
  }
  if (text.includes('n5') || text.includes('beginner') || text.includes('basic')) {
    return 'N5';
  }

  // Default based on complexity heuristics
  return 'N5';
}

// Parse practice-japanese format to sections
function parsePracticeJapaneseFormat(data: any): { sections: GrammarSection[], rawContent: string } {
  const sections: GrammarSection[] = [];
  let rawContent = '';

  if (!data.data?.sections) {
    return { sections, rawContent };
  }

  for (const section of data.data.sections) {
    const grammarSection: GrammarSection = {
      heading: section.heading || undefined,
      content: section.content || undefined,
      examples: [],
    };

    // Extract examples from content (Japanese sentences with English translations)
    if (section.content) {
      rawContent += (section.heading ? `## ${section.heading}\n` : '') + section.content + '\n\n';

      // Parse examples from content (format: "Japanese "English"" or tables)
      const exampleMatches = section.content.matchAll(/([ぁ-んァ-ン一-龯、。！？]+(?:[a-zA-Z]*[ぁ-んァ-ン一-龯、。！？]*)*)\s*[「""]([^「」""]+)[」""]/g);
      for (const match of exampleMatches) {
        grammarSection.examples?.push({
          japanese: match[1].trim(),
          english: match[2].trim(),
        });
      }
    }

    // Process children sections
    if (section.children) {
      for (const child of section.children) {
        const childSection: GrammarSection = {
          heading: child.heading || undefined,
          content: child.content || undefined,
          examples: [],
        };

        if (child.content) {
          rawContent += (child.heading ? `### ${child.heading}\n` : '') + child.content + '\n\n';

          // Parse examples
          const childExamples = child.content.matchAll(/([ぁ-んァ-ン一-龯、。！？]+(?:[a-zA-Z]*[ぁ-んァ-ン一-龯、。！？]*)*)\s*[「""]([^「」""]+)[」""]/g);
          for (const match of childExamples) {
            childSection.examples?.push({
              japanese: match[1].trim(),
              english: match[2].trim(),
            });
          }
        }

        if (childSection.content || (childSection.examples && childSection.examples.length > 0)) {
          sections.push(childSection);
        }
      }
    }

    if (grammarSection.content || (grammarSection.examples && grammarSection.examples.length > 0)) {
      sections.push(grammarSection);
    }
  }

  return { sections, rawContent };
}

// Parse Tae Kim format
function parseTaeKimFormat(topic: any): { sections: GrammarSection[], rawContent: string } {
  const sections: GrammarSection[] = [];
  let rawContent = '';

  // Description section
  if (topic.description) {
    sections.push({
      heading: 'Description',
      content: topic.description,
    });
    rawContent += `## Description\n${topic.description}\n\n`;
  }

  // Usage section
  if (topic.usage) {
    sections.push({
      heading: 'Usage',
      content: topic.usage,
    });
    rawContent += `## Usage\n${topic.usage}\n\n`;
  }

  // Examples section
  if (topic.examples && topic.examples.length > 0) {
    sections.push({
      heading: 'Examples',
      content: '',
      examples: topic.examples.map((ex: any) => ({
        japanese: ex.japanese,
        english: ex.english,
        reading: ex.reading,
      })),
    });
    rawContent += `## Examples\n`;
    for (const ex of topic.examples) {
      rawContent += `${ex.japanese} (${ex.reading}) - ${ex.english}\n`;
    }
    rawContent += '\n';
  }

  // Notes section
  if (topic.notes) {
    sections.push({
      heading: 'Notes',
      content: topic.notes,
    });
    rawContent += `## Notes\n${topic.notes}\n\n`;
  }

  return { sections, rawContent };
}

async function importGrammarData() {
  console.log('Starting grammar import...\n');

  const topicsToUpsert: GrammarTopic[] = [];

  // 1. Import from Tae Kim's grammar-complete.json
  console.log('Loading Tae Kim grammar data...');
  const taeKimPath = path.join(__dirname, '../grammar-data/grammar-complete.json');

  if (fs.existsSync(taeKimPath)) {
    const taeKimData = JSON.parse(fs.readFileSync(taeKimPath, 'utf-8'));
    console.log(`Found ${taeKimData.topics?.length || 0} topics from Tae Kim's guide`);

    for (const topic of taeKimData.topics || []) {
      const { sections, rawContent } = parseTaeKimFormat(topic);

      topicsToUpsert.push({
        slug: topic.id,
        title: `${topic.pattern} - ${topic.name}`,
        url: null,
        category: topic.category || 'grammar',
        jlpt_level: topic.level || 'N5',
        sections,
        raw_content: rawContent,
      });
    }
  }

  // 2. Import from practice-japanese data
  console.log('\nLoading practice-japanese grammar data...');
  const practiceJapanesePath = 'C:/Users/jnguyen/Documents/Project/web-scraper/data/practice-japanese';

  if (fs.existsSync(practiceJapanesePath)) {
    const files = fs.readdirSync(practiceJapanesePath).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} grammar files`);

    let processed = 0;
    for (const file of files) {
      try {
        const filePath = path.join(practiceJapanesePath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const slug = extractSlug(file);
        const title = data.data?.metadata?.title || slug.replace(/-/g, ' ');
        const { sections, rawContent } = parsePracticeJapaneseFormat(data);

        // Skip if no meaningful content
        if (sections.length === 0 && !rawContent) {
          continue;
        }

        const category = determineCategory(slug, title, rawContent);
        const level = determineLevel(rawContent, title);

        // Check if this slug already exists from Tae Kim
        const existingIndex = topicsToUpsert.findIndex(t => t.slug === slug);

        if (existingIndex >= 0) {
          // Merge: prefer practice-japanese for more detailed content
          if (sections.length > topicsToUpsert[existingIndex].sections.length) {
            topicsToUpsert[existingIndex].sections = sections;
            topicsToUpsert[existingIndex].raw_content = rawContent;
          }
        } else {
          topicsToUpsert.push({
            slug,
            title,
            url: data.url || null,
            category,
            jlpt_level: level,
            sections,
            raw_content: rawContent,
          });
        }

        processed++;
        if (processed % 50 === 0) {
          console.log(`  Processed ${processed}/${files.length} files...`);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }

  console.log(`\nTotal topics to import: ${topicsToUpsert.length}`);

  // 3. Clear existing data and insert new
  console.log('\nClearing existing grammar_topics...');
  const { error: deleteError } = await supabase
    .from('grammar_topics')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Error clearing existing data:', deleteError);
  }

  // 4. Insert in batches
  console.log('Inserting new grammar topics...');
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < topicsToUpsert.length; i += batchSize) {
    const batch = topicsToUpsert.slice(i, i + batchSize);

    const { error } = await supabase
      .from('grammar_topics')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      inserted += batch.length;
      console.log(`  Inserted ${inserted}/${topicsToUpsert.length} topics...`);
    }
  }

  console.log(`\n✅ Import complete! Inserted ${inserted} grammar topics.`);

  // 5. Verify
  const { count } = await supabase
    .from('grammar_topics')
    .select('*', { count: 'exact', head: true });

  console.log(`\nVerification: ${count} topics in database`);

  // Show category breakdown
  const { data: categories } = await supabase
    .from('grammar_topics')
    .select('category')
    .order('category');

  if (categories) {
    const breakdown: Record<string, number> = {};
    for (const row of categories) {
      breakdown[row.category] = (breakdown[row.category] || 0) + 1;
    }
    console.log('\nCategory breakdown:');
    for (const [cat, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
  }
}

importGrammarData().catch(console.error);
