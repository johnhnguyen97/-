-- Kanji/Radical Learning System Tables
-- Migration: Create tables for radicals, kanji, and user progress

-- ============================================
-- Table: radicals
-- 214 Kangxi radicals (pre-populated via seed)
-- ============================================
CREATE TABLE IF NOT EXISTS radicals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  radical_number INTEGER NOT NULL UNIQUE,
  radical_character VARCHAR(4) NOT NULL,
  radical_name_en VARCHAR(100) NOT NULL,
  radical_name_jp VARCHAR(100),
  stroke_count INTEGER NOT NULL,
  meaning TEXT,
  position VARCHAR(50),  -- hen, tsukuri, kanmuri, ashi, tare, nyou, kamae, other
  sound_hint VARCHAR(100),
  svg_url TEXT,
  animation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for radicals
CREATE INDEX IF NOT EXISTS idx_radicals_number ON radicals(radical_number);
CREATE INDEX IF NOT EXISTS idx_radicals_stroke ON radicals(stroke_count);
CREATE INDEX IF NOT EXISTS idx_radicals_position ON radicals(position);

-- ============================================
-- Table: kanji
-- Cached kanji data from Kanji Alive API
-- ============================================
CREATE TABLE IF NOT EXISTS kanji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character VARCHAR(4) NOT NULL UNIQUE,
  unicode VARCHAR(10),
  stroke_count INTEGER NOT NULL,
  grade INTEGER,  -- school grade (1-6, 8=secondary, 9=jinmeiyo)
  jlpt_level VARCHAR(2),  -- N5, N4, N3, N2, N1
  meaning_en TEXT NOT NULL,
  onyomi TEXT,  -- comma-separated on readings (katakana)
  kunyomi TEXT,  -- comma-separated kun readings (hiragana)
  onyomi_romaji TEXT,
  kunyomi_romaji TEXT,
  radical_number INTEGER REFERENCES radicals(radical_number),
  radical_meaning VARCHAR(100),
  video_url TEXT,  -- Kanji Alive MP4 URL
  audio_onyomi_url TEXT,
  audio_kunyomi_url TEXT,
  stroke_order_images TEXT[],  -- Array of SVG URLs
  examples JSONB,  -- [{word, reading, meaning, audio_url}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for kanji
CREATE INDEX IF NOT EXISTS idx_kanji_character ON kanji(character);
CREATE INDEX IF NOT EXISTS idx_kanji_jlpt ON kanji(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_kanji_radical ON kanji(radical_number);
CREATE INDEX IF NOT EXISTS idx_kanji_stroke ON kanji(stroke_count);
CREATE INDEX IF NOT EXISTS idx_kanji_grade ON kanji(grade);

-- Full-text search on meaning
CREATE INDEX IF NOT EXISTS idx_kanji_meaning_fts ON kanji USING gin(to_tsvector('english', meaning_en));

-- ============================================
-- Table: kanji_radicals
-- Many-to-many: kanji can have multiple component radicals
-- ============================================
CREATE TABLE IF NOT EXISTS kanji_radicals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kanji_id UUID REFERENCES kanji(id) ON DELETE CASCADE,
  radical_id UUID REFERENCES radicals(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  position VARCHAR(50),  -- where it appears in the kanji
  UNIQUE(kanji_id, radical_id)
);

-- Indexes for kanji_radicals
CREATE INDEX IF NOT EXISTS idx_kanji_radicals_kanji ON kanji_radicals(kanji_id);
CREATE INDEX IF NOT EXISTS idx_kanji_radicals_radical ON kanji_radicals(radical_id);

-- ============================================
-- Table: user_kanji_progress
-- Track user's learning progress for each kanji
-- ============================================
CREATE TABLE IF NOT EXISTS user_kanji_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kanji_id UUID REFERENCES kanji(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'new',  -- new, learning, known, mastered
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  next_review TIMESTAMPTZ,  -- for SRS
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, kanji_id)
);

-- Indexes for user_kanji_progress
CREATE INDEX IF NOT EXISTS idx_user_kanji_user ON user_kanji_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kanji_status ON user_kanji_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_kanji_review ON user_kanji_progress(next_review);

-- ============================================
-- Table: user_saved_kanji
-- User's personal kanji collection (favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS user_saved_kanji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kanji_id UUID REFERENCES kanji(id) ON DELETE CASCADE,
  note TEXT,
  folder VARCHAR(100) DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, kanji_id)
);

-- Indexes for user_saved_kanji
CREATE INDEX IF NOT EXISTS idx_saved_kanji_user ON user_saved_kanji(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_kanji_folder ON user_saved_kanji(folder);

-- ============================================
-- Table: radical_drill_accuracy
-- Track user's drill accuracy per question type
-- ============================================
CREATE TABLE IF NOT EXISTS radical_drill_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drill_type VARCHAR(50) NOT NULL,  -- identify_radical, find_kanji, sound_pattern, etc.
  correct_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, drill_type)
);

-- Index for radical_drill_accuracy
CREATE INDEX IF NOT EXISTS idx_drill_accuracy_user ON radical_drill_accuracy(user_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on user tables
ALTER TABLE user_kanji_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_kanji ENABLE ROW LEVEL SECURITY;
ALTER TABLE radical_drill_accuracy ENABLE ROW LEVEL SECURITY;

-- user_kanji_progress policies
DROP POLICY IF EXISTS "Users can view own kanji progress" ON user_kanji_progress;
CREATE POLICY "Users can view own kanji progress"
  ON user_kanji_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own kanji progress" ON user_kanji_progress;
CREATE POLICY "Users can insert own kanji progress"
  ON user_kanji_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own kanji progress" ON user_kanji_progress;
CREATE POLICY "Users can update own kanji progress"
  ON user_kanji_progress FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own kanji progress" ON user_kanji_progress;
CREATE POLICY "Users can delete own kanji progress"
  ON user_kanji_progress FOR DELETE
  USING (auth.uid() = user_id);

-- user_saved_kanji policies
DROP POLICY IF EXISTS "Users can view own saved kanji" ON user_saved_kanji;
CREATE POLICY "Users can view own saved kanji"
  ON user_saved_kanji FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved kanji" ON user_saved_kanji;
CREATE POLICY "Users can insert own saved kanji"
  ON user_saved_kanji FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved kanji" ON user_saved_kanji;
CREATE POLICY "Users can update own saved kanji"
  ON user_saved_kanji FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved kanji" ON user_saved_kanji;
CREATE POLICY "Users can delete own saved kanji"
  ON user_saved_kanji FOR DELETE
  USING (auth.uid() = user_id);

-- radical_drill_accuracy policies
DROP POLICY IF EXISTS "Users can view own drill accuracy" ON radical_drill_accuracy;
CREATE POLICY "Users can view own drill accuracy"
  ON radical_drill_accuracy FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own drill accuracy" ON radical_drill_accuracy;
CREATE POLICY "Users can insert own drill accuracy"
  ON radical_drill_accuracy FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own drill accuracy" ON radical_drill_accuracy;
CREATE POLICY "Users can update own drill accuracy"
  ON radical_drill_accuracy FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read access for radicals and kanji (reference data)
ALTER TABLE radicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanji ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanji_radicals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read radicals" ON radicals;
CREATE POLICY "Anyone can read radicals"
  ON radicals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read kanji" ON kanji;
CREATE POLICY "Anyone can read kanji"
  ON kanji FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read kanji_radicals" ON kanji_radicals;
CREATE POLICY "Anyone can read kanji_radicals"
  ON kanji_radicals FOR SELECT
  USING (true);

-- Service role can insert/update reference data
DROP POLICY IF EXISTS "Service role can insert radicals" ON radicals;
CREATE POLICY "Service role can insert radicals"
  ON radicals FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update radicals" ON radicals;
CREATE POLICY "Service role can update radicals"
  ON radicals FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert kanji" ON kanji;
CREATE POLICY "Service role can insert kanji"
  ON kanji FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update kanji" ON kanji;
CREATE POLICY "Service role can update kanji"
  ON kanji FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert kanji_radicals" ON kanji_radicals;
CREATE POLICY "Service role can insert kanji_radicals"
  ON kanji_radicals FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_kanji_updated_at ON kanji;
CREATE TRIGGER update_kanji_updated_at
  BEFORE UPDATE ON kanji
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_kanji_progress_updated_at ON user_kanji_progress;
CREATE TRIGGER update_user_kanji_progress_updated_at
  BEFORE UPDATE ON user_kanji_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_saved_kanji_updated_at ON user_saved_kanji;
CREATE TRIGGER update_user_saved_kanji_updated_at
  BEFORE UPDATE ON user_saved_kanji
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_radical_drill_accuracy_updated_at ON radical_drill_accuracy;
CREATE TRIGGER update_radical_drill_accuracy_updated_at
  BEFORE UPDATE ON radical_drill_accuracy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
