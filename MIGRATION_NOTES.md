# Pattern Game Improvements - Migration Notes

## Changes Made

### 1. **Weighted Randomization Algorithm** ✅
- Implemented frequency-based verb selection that prioritizes common daily-use words
- Algorithm scales by JLPT level:
  - **N5**: 3x multiplier for common words (strong bias)
  - **N4**: 2x multiplier (moderate bias)
  - **N3-N1**: 1.5-1.1x multiplier (lighter bias for variety)

### 2. **Verb Frequency System** ✅
- Added `frequency` field to verbs table (scale: 1-10)
- **Frequency 10**: Top 20 essential verbs (する, ある, 行く, 食べる, etc.)
- **Frequency 9**: Top 100 very common verbs (起きる, 寝る, 働く, etc.)
- **Frequency 8**: Top 200 common verbs
- Based on Wiktionary 1000 basic Japanese words + JLPT core vocabulary

### 3. **Random Conjugation Form Selection** ✅
- **OLD**: Always showed same forms (e.g., only polite present)
- **NEW**: Randomly selects 1-2 forms per phase each session
- Phase 1 now gives: ます, ません, ました, ませんでした (randomly)

### 4. **Example Sentences for Sentence Mode** ✅
- Created `example_sentences` table with 15 N5 sentences
- Sentence mode now shows real Japanese sentences with the verb in context
- Auto-fetches sentences matching the current verb

### 5. **Database Tables Created** ✅
- `drill_sentences`: Stores drill content
- `drill_prompts`: Conjugation prompts and explanations
- `example_sentences`: Real Japanese sentences for context

---

## Applying the Migrations

### Option 1: Supabase CLI (Recommended)
```bash
# Make sure you have SUPABASE_DB_PASSWORD in .env
npm run db:push
```

### Option 2: Manual SQL Execution
Go to Supabase Dashboard → SQL Editor and run these files in order:

1. `/supabase/migrations/20260102_create_drill_tables.sql`
2. `/supabase/migrations/20260102_add_verb_frequency.sql`
3. `/supabase/migrations/20260101_expand_conjugations.sql` (if not already applied)

---

## How the Algorithm Works

### Weighted Random Selection
```typescript
// Example: N5 practice session
verbs = [
  { dictionary_form: 'する', frequency: 10 },  // Weight: 10^3 = 1000
  { dictionary_form: '食べる', frequency: 10 }, // Weight: 10^3 = 1000
  { dictionary_form: '比べる', frequency: 6 },  // Weight: 6^3 = 216
]

// Probability of selecting 'する' or '食べる': ~31% each
// Probability of selecting '比べる': ~7%
```

Common words appear **4-5x more often** than rare words in N5 practice!

### Form Randomization
```typescript
// Phase 1 (Basic Polite) has 4 forms:
forms = ['masu', 'masen', 'mashita', 'masen_deshita']

// Each session randomly selects 1-2 forms:
Session 1: ['masu', 'mashita']         // 70% chance of 1 form
Session 2: ['masen']                    // 30% chance of 2 forms
Session 3: ['masu', 'masen_deshita']
```

---

## Testing

After applying migrations, test with:

1. **Word Mode** → Should see varied verb forms (not just ます)
2. **Sentence Mode** → Should show example sentences
3. **N5 Level** → Should heavily favor common verbs (する, ある, 行く)
4. **N3 Level** → Should show more variety

---

## Files Modified

### New Files
- `/supabase/migrations/20260102_create_drill_tables.sql`
- `/supabase/migrations/20260102_add_verb_frequency.sql`
- `/scripts/apply-migrations.mjs` (helper script)

### Modified Files
- `/api/drill.ts` - Added weighted randomization + example sentences
- `/home/user/gojun/api/drill.ts`:
  - Added `PHASE_FORMS` mapping
  - Added `weightedShuffle()` and `weightedRandomSelect()` functions
  - Modified `buildValidCombinations()` to use weighted selection
  - Modified `generateQuestionsFromCombinations()` to fetch example sentences
  - Made question generation async

---

## What Users Will Notice

### Before:
- ❌ Always same forms: 食べます, 食べます, 食べます...
- ❌ Rare verbs appeared as often as common ones
- ❌ Sentence mode showed nothing

### After:
- ✅ Variety: 食べます, 食べない, 食べました, 食べなかった...
- ✅ Common verbs (する, 行く, 食べる) appear 4-5x more often
- ✅ Sentence mode shows: "私は毎日寿司を食べます" (I eat sushi every day)
- ✅ More practical daily conversation practice

---

## Next Steps

1. Apply migrations (see above)
2. Test the pattern game
3. Add more example sentences if needed (currently 15 N5 sentences)
4. Consider expanding frequency data to N4-N1 verbs
