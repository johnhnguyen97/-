/**
 * Re-import grammar topics content from SQL file
 * Extracts sections/examples and updates existing records
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260101_import_grammar_topics.sql');
  const content = fs.readFileSync(sqlFile, 'utf8');

  // Parse INSERT statements to extract data
  // Pattern: INSERT INTO grammar_topics (slug, title, source_url, category, jlpt_level, sections, examples)
  // VALUES ('slug', 'title', 'url', 'category', NULL, '[...]'::jsonb, '[...]'::jsonb)

  const insertRegex = /INSERT INTO grammar_topics[^V]*VALUES\s*\(\s*'([^']+)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*)',\s*'([^']*)',\s*(NULL|'[^']*'),\s*'(\[[\s\S]*?\])'::jsonb,\s*'(\[[\s\S]*?\])'::jsonb\s*\)/g;

  const topics = [];
  let match;

  while ((match = insertRegex.exec(content)) !== null) {
    const [_, slug, title, source_url, category, jlpt_level, sectionsStr, examplesStr] = match;

    try {
      // Unescape SQL strings ('' -> ')
      const sections = JSON.parse(sectionsStr.replace(/''/g, "'"));
      const examples = JSON.parse(examplesStr.replace(/''/g, "'"));

      topics.push({
        slug,
        title: title.replace(/''/g, "'"),
        source_url,
        sections,
        examples
      });
    } catch (e) {
      console.error(`Failed to parse topic ${slug}:`, e.message);
    }
  }

  console.log(`Parsed ${topics.length} topics from SQL file`);

  // Update in batches
  let updated = 0;
  let errors = 0;

  for (const topic of topics) {
    const { error } = await supabase
      .from('grammar_topics')
      .update({
        sections: topic.sections,
        examples: topic.examples,
        source_url: topic.source_url,
        updated_at: new Date().toISOString()
      })
      .eq('slug', topic.slug);

    if (error) {
      console.error(`Error updating ${topic.slug}:`, error.message);
      errors++;
    } else {
      updated++;
      if (updated % 50 === 0) {
        console.log(`Updated ${updated} topics...`);
      }
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`);
}

main().catch(console.error);
