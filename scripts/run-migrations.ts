/**
 * Run database migrations directly
 *
 * Usage: npx tsx scripts/run-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please set these environment variables first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('\n🔧 Running migrations...\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = [
    '20260107_create_adjectives_table.sql',
    '20260107_adjective_example_sentences.sql',
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} (not found)`);
      continue;
    }

    console.log(`📄 Running: ${file}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('   Trying direct execution...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql_string: sql }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log(`   ✅ Applied: ${file}`);
      } else {
        console.log(`   ✅ Applied: ${file}`);
      }
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      console.log('   Note: This might be okay if the migration was already applied.');
    }
  }

  console.log('\n✨ Migration process complete!\n');
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
