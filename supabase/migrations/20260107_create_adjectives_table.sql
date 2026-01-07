-- Create adjectives table (similar to verbs table)
CREATE TABLE IF NOT EXISTS adjectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dictionary_form TEXT NOT NULL,
  reading TEXT NOT NULL,
  romaji TEXT NOT NULL,
  meaning TEXT NOT NULL,
  adjective_type TEXT NOT NULL CHECK (adjective_type IN ('i_adjective', 'na_adjective')),
  jlpt_level TEXT NOT NULL CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  frequency INTEGER DEFAULT 5 CHECK (frequency >= 1 AND frequency <= 10),
  conjugations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dictionary_form, reading)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_adjectives_jlpt ON adjectives(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_adjectives_type ON adjectives(adjective_type);
CREATE INDEX IF NOT EXISTS idx_adjectives_frequency ON adjectives(frequency DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE adjectives ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read adjectives
CREATE POLICY "Public read access for adjectives"
  ON adjectives FOR SELECT
  TO public
  USING (true);
