-- Create drill_sentences table
CREATE TABLE IF NOT EXISTS drill_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  japanese_base TEXT NOT NULL,
  english TEXT NOT NULL,
  word_type TEXT NOT NULL CHECK (word_type IN ('verb', 'adjective')),
  verb_group TEXT CHECK (verb_group IN ('group1', 'group2', 'group3')),
  adjective_type TEXT CHECK (adjective_type IN ('i_adjective', 'na_adjective')),
  jlpt_level TEXT CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  conjugations JSONB NOT NULL DEFAULT '{}',
  dictionary_form TEXT,
  reading TEXT,
  romaji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drill_prompts table
CREATE TABLE IF NOT EXISTS drill_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_form TEXT NOT NULL,
  to_form TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  prompt_jp TEXT NOT NULL,
  explanation TEXT NOT NULL,
  word_type TEXT NOT NULL CHECK (word_type IN ('verb', 'adjective', 'both')),
  phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_form, to_form, word_type)
);

-- Create example_sentences table (Tatoeba-based)
CREATE TABLE IF NOT EXISTS example_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  japanese TEXT NOT NULL,
  english TEXT NOT NULL,
  word_key TEXT NOT NULL,          -- The verb in dictionary form
  word_reading TEXT NOT NULL,       -- Hiragana reading
  tatoeba_id INTEGER,               -- Original Tatoeba sentence ID (if applicable)
  jlpt_level TEXT CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drill_sentences_word_type ON drill_sentences(word_type);
CREATE INDEX IF NOT EXISTS idx_drill_sentences_jlpt ON drill_sentences(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_drill_prompts_phase ON drill_prompts(phase);
CREATE INDEX IF NOT EXISTS idx_drill_prompts_word_type ON drill_prompts(word_type);
CREATE INDEX IF NOT EXISTS idx_example_sentences_word_key ON example_sentences(word_key);
CREATE INDEX IF NOT EXISTS idx_example_sentences_jlpt ON example_sentences(jlpt_level);

-- Insert basic example sentences for N5 verbs
INSERT INTO example_sentences (japanese, english, word_key, word_reading, jlpt_level) VALUES
('私は毎日寿司を食べます', 'I eat sushi every day', '食べる', 'たべる', 'N5'),
('昨日映画を見ました', 'I watched a movie yesterday', '見る', 'みる', 'N5'),
('夜12時に寝ます', 'I sleep at 12 at night', '寝る', 'ねる', 'N5'),
('朝7時に起きます', 'I wake up at 7 in the morning', '起きる', 'おきる', 'N5'),
('窓を開けてください', 'Please open the window', '開ける', 'あける', 'N5'),
('本を買いました', 'I bought a book', '買う', 'かう', 'N5'),
('友達と話します', 'I talk with friends', '話す', 'はなす', 'N5'),
('日本語を勉強します', 'I study Japanese', '勉強する', 'べんきょうする', 'N5'),
('学校に行きます', 'I go to school', '行く', 'いく', 'N5'),
('水を飲みます', 'I drink water', '飲む', 'のむ', 'N5'),
('音楽を聞きます', 'I listen to music', '聞く', 'きく', 'N5'),
('手紙を書きます', 'I write a letter', '書く', 'かく', 'N5'),
('家に帰ります', 'I return home', '帰る', 'かえる', 'N5'),
('ドアを閉めます', 'I close the door', '閉める', 'しめる', 'N5'),
('テレビを見ます', 'I watch TV', '見る', 'みる', 'N5')
ON CONFLICT DO NOTHING;
