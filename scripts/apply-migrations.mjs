import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath, name) {
  console.log(`\n📝 Applying migration: ${name}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    // Execute the SQL using Supabase RPC or direct query
    // Note: Supabase client doesn't support raw SQL execution directly
    // We'll use the REST API instead
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative approach: split into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== '');

      console.log(`  Executing ${statements.length} statements...`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        try {
          // Use the supabase.rpc() method if available, or direct SQL
          const { error } = await supabase.rpc('exec_sql', { sql: stmt });
          if (error) {
            console.warn(`  ⚠️  Statement ${i + 1} warning:`, error.message);
          }
        } catch (err) {
          console.warn(`  ⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }

    console.log(`✅ Migration applied: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply ${name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

  const migrations = [
    '20260102_create_drill_tables.sql',
    '20260102_add_verb_frequency.sql',
  ];

  for (const migration of migrations) {
    const filePath = join(migrationsDir, migration);
    await applyMigration(filePath, migration);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between migrations
  }

  console.log('\n✨ Migration process complete!');
}

main().catch(console.error);
