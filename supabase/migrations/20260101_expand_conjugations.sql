-- Migration: Expand Verb Conjugation System
-- Date: 2026-01-01
-- Description: Adds support for 25+ conjugation forms with dictionary form, reading, and romaji

-- ============================================================================
-- 1. Add new columns to drill_sentences for enhanced display
-- ============================================================================

ALTER TABLE drill_sentences
ADD COLUMN IF NOT EXISTS dictionary_form TEXT,
ADD COLUMN IF NOT EXISTS reading TEXT,
ADD COLUMN IF NOT EXISTS romaji TEXT;

-- ============================================================================
-- 2. Update drill_prompts to include new phase values (1-8)
-- ============================================================================

-- First, modify the phase column to accept values up to 8
ALTER TABLE drill_prompts
ALTER COLUMN phase TYPE INTEGER USING phase::integer;

-- ============================================================================
-- 3. Insert new drill prompts for expanded conjugation forms
-- ============================================================================

-- Phase 1: Basic Polite (ます) forms - already exist but add masu_ prefixed versions
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'masu_positive', 'Change to polite present', '丁寧な現在形に変えてください', 'Add ます to the verb stem', 'verb', 1),
('plain_positive', 'masu_negative', 'Change to polite negative', '丁寧な否定形に変えてください', 'Add ません to the verb stem', 'verb', 1),
('plain_positive', 'masu_past_positive', 'Change to polite past', '丁寧な過去形に変えてください', 'Add ました to the verb stem', 'verb', 1),
('plain_positive', 'masu_past_negative', 'Change to polite past negative', '丁寧な過去否定形に変えてください', 'Add ませんでした to the verb stem', 'verb', 1)
ON CONFLICT DO NOTHING;

-- Phase 2: Plain (dictionary) forms
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('masu_positive', 'plain_positive', 'Change to dictionary form', '辞書形に変えてください', 'This is the base form found in dictionaries', 'verb', 2),
('masu_positive', 'plain_negative', 'Change to plain negative', 'ない形に変えてください', 'Replace ます with ない (ichidan) or change to あ-row + ない (godan)', 'verb', 2),
('masu_positive', 'plain_past_positive', 'Change to plain past', 'た形に変えてください', 'Same as te-form but ends with た/だ instead of て/で', 'verb', 2),
('masu_positive', 'plain_past_negative', 'Change to plain past negative', 'なかった形に変えてください', 'Add なかった to the negative stem', 'verb', 2)
ON CONFLICT DO NOTHING;

-- Phase 3: Te-form and progressive
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'te_form', 'Change to te-form', 'て形に変えてください', 'Ichidan: る→て | Godan: う/つ/る→って, む/ぶ/ぬ→んで, く→いて, ぐ→いで, す→して', 'verb', 3),
('plain_positive', 'te_iru', 'Change to progressive form', 'ている形に変えてください', 'Make te-form and add いる to express ongoing action or state', 'verb', 3),
('masu_positive', 'te_form', 'Change to te-form', 'て形に変えてください', 'Ichidan: る→て | Godan: various sound changes', 'verb', 3),
('masu_positive', 'te_iru', 'Change to progressive form', 'ている形に変えてください', 'Te-form + いる', 'verb', 3)
ON CONFLICT DO NOTHING;

-- Phase 4: Desire (たい) and Volitional forms
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'tai_form', 'Change to "want to" form', 'たい形に変えてください', 'Add たい to the masu-stem', 'verb', 4),
('plain_positive', 'tai_negative', 'Change to "don''t want to" form', 'たくない形に変えてください', 'Add たくない to the masu-stem', 'verb', 4),
('plain_positive', 'tai_past', 'Change to "wanted to" form', 'たかった形に変えてください', 'Add たかった to the masu-stem', 'verb', 4),
('plain_positive', 'volitional', 'Change to volitional form', '意志形に変えてください', 'Ichidan: る→よう | Godan: change to お-row + う', 'verb', 4),
('plain_positive', 'volitional_polite', 'Change to polite volitional', 'ましょう形に変えてください', 'Add ましょう to the masu-stem', 'verb', 4),
('masu_positive', 'tai_form', 'Change to "want to" form', 'たい形に変えてください', 'Replace ます with たい', 'verb', 4),
('masu_positive', 'volitional_polite', 'Change to "let''s" form', 'ましょう形に変えてください', 'Replace ます with ましょう', 'verb', 4)
ON CONFLICT DO NOTHING;

-- Phase 5: Potential forms
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'potential_positive', 'Change to potential form', '可能形に変えてください', 'Ichidan: る→られる | Godan: change to え-row + る | する→できる', 'verb', 5),
('plain_positive', 'potential_negative', 'Change to negative potential', '可能否定形に変えてください', 'Make potential form and negate: られる→られない, える→えない', 'verb', 5),
('masu_positive', 'potential_positive', 'Change to "can do" form', '可能形に変えてください', 'Express ability to do the action', 'verb', 5),
('masu_positive', 'potential_negative', 'Change to "cannot do" form', '可能否定形に変えてください', 'Express inability to do the action', 'verb', 5)
ON CONFLICT DO NOTHING;

-- Phase 6: Conditional forms
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'conditional_ba', 'Change to ば-conditional', 'ば形に変えてください', 'Ichidan: る→れば | Godan: change to え-row + ば', 'verb', 6),
('plain_positive', 'conditional_tara', 'Change to たら-conditional', 'たら形に変えてください', 'Make past form and add ら', 'verb', 6),
('plain_positive', 'conditional_to', 'Change to と-conditional', 'と形に変えてください', 'Keep dictionary form and add と', 'verb', 6),
('plain_positive', 'conditional_nara', 'Change to なら-conditional', 'なら形に変えてください', 'Add なら to the dictionary form', 'verb', 6),
('masu_positive', 'conditional_ba', 'Change to "if" form (ば)', 'ば形に変えてください', 'Express hypothetical condition', 'verb', 6),
('masu_positive', 'conditional_tara', 'Change to "if/when" form (たら)', 'たら形に変えてください', 'Express "when/if" condition', 'verb', 6)
ON CONFLICT DO NOTHING;

-- Phase 7: Passive and Causative forms
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'passive_positive', 'Change to passive form', '受身形に変えてください', 'Ichidan: る→られる | Godan: change to あ-row + れる', 'verb', 7),
('plain_positive', 'passive_negative', 'Change to negative passive', '受身否定形に変えてください', 'Make passive form and negate', 'verb', 7),
('plain_positive', 'causative_positive', 'Change to causative form', '使役形に変えてください', 'Ichidan: る→させる | Godan: change to あ-row + せる', 'verb', 7),
('plain_positive', 'causative_negative', 'Change to negative causative', '使役否定形に変えてください', 'Make causative form and negate', 'verb', 7),
('plain_positive', 'causative_passive', 'Change to causative-passive', '使役受身形に変えてください', 'Combine causative and passive: させられる', 'verb', 7),
('masu_positive', 'passive_positive', 'Change to passive form', '受身形に変えてください', 'Express receiving an action', 'verb', 7),
('masu_positive', 'causative_positive', 'Change to causative form', '使役形に変えてください', 'Express making/letting someone do', 'verb', 7)
ON CONFLICT DO NOTHING;

-- Phase 8: Imperative forms
INSERT INTO drill_prompts (from_form, to_form, prompt_en, prompt_jp, explanation, word_type, phase) VALUES
('plain_positive', 'imperative', 'Change to imperative form', '命令形に変えてください', 'Ichidan: る→ろ | Godan: change to え-row', 'verb', 8),
('plain_positive', 'imperative_negative', 'Change to negative command', '禁止形に変えてください', 'Keep dictionary form and add な', 'verb', 8),
('masu_positive', 'imperative', 'Change to command form', '命令形に変えてください', 'Express direct command (strong)', 'verb', 8),
('masu_positive', 'imperative_negative', 'Change to prohibition form', '禁止形に変えてください', 'Express "don''t do" command', 'verb', 8)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Update existing verbs with expanded conjugations
-- ============================================================================

-- Update 食べる (taberu) - Ichidan verb
UPDATE drill_sentences SET
  dictionary_form = '食べる',
  reading = 'たべる',
  romaji = 'taberu',
  conjugations = conjugations || jsonb_build_object(
    'masu_positive', jsonb_build_object('japanese', '食べます', 'reading', 'たべます', 'romaji', 'tabemasu'),
    'masu_negative', jsonb_build_object('japanese', '食べません', 'reading', 'たべません', 'romaji', 'tabemasen'),
    'masu_past_positive', jsonb_build_object('japanese', '食べました', 'reading', 'たべました', 'romaji', 'tabemashita'),
    'masu_past_negative', jsonb_build_object('japanese', '食べませんでした', 'reading', 'たべませんでした', 'romaji', 'tabemasendeshita'),
    'plain_positive', jsonb_build_object('japanese', '食べる', 'reading', 'たべる', 'romaji', 'taberu'),
    'plain_negative', jsonb_build_object('japanese', '食べない', 'reading', 'たべない', 'romaji', 'tabenai'),
    'plain_past_positive', jsonb_build_object('japanese', '食べた', 'reading', 'たべた', 'romaji', 'tabeta'),
    'plain_past_negative', jsonb_build_object('japanese', '食べなかった', 'reading', 'たべなかった', 'romaji', 'tabenakatta'),
    'te_form', jsonb_build_object('japanese', '食べて', 'reading', 'たべて', 'romaji', 'tabete'),
    'te_iru', jsonb_build_object('japanese', '食べている', 'reading', 'たべている', 'romaji', 'tabeteiru'),
    'tai_form', jsonb_build_object('japanese', '食べたい', 'reading', 'たべたい', 'romaji', 'tabetai'),
    'tai_negative', jsonb_build_object('japanese', '食べたくない', 'reading', 'たべたくない', 'romaji', 'tabetakunai'),
    'tai_past', jsonb_build_object('japanese', '食べたかった', 'reading', 'たべたかった', 'romaji', 'tabetakatta'),
    'volitional', jsonb_build_object('japanese', '食べよう', 'reading', 'たべよう', 'romaji', 'tabeyou'),
    'volitional_polite', jsonb_build_object('japanese', '食べましょう', 'reading', 'たべましょう', 'romaji', 'tabemashou'),
    'potential_positive', jsonb_build_object('japanese', '食べられる', 'reading', 'たべられる', 'romaji', 'taberareru'),
    'potential_negative', jsonb_build_object('japanese', '食べられない', 'reading', 'たべられない', 'romaji', 'taberarenai'),
    'conditional_ba', jsonb_build_object('japanese', '食べれば', 'reading', 'たべれば', 'romaji', 'tabereba'),
    'conditional_tara', jsonb_build_object('japanese', '食べたら', 'reading', 'たべたら', 'romaji', 'tabetara'),
    'conditional_to', jsonb_build_object('japanese', '食べると', 'reading', 'たべると', 'romaji', 'taberuto'),
    'conditional_nara', jsonb_build_object('japanese', '食べるなら', 'reading', 'たべるなら', 'romaji', 'taberunara'),
    'passive_positive', jsonb_build_object('japanese', '食べられる', 'reading', 'たべられる', 'romaji', 'taberareru'),
    'passive_negative', jsonb_build_object('japanese', '食べられない', 'reading', 'たべられない', 'romaji', 'taberarenai'),
    'causative_positive', jsonb_build_object('japanese', '食べさせる', 'reading', 'たべさせる', 'romaji', 'tabesaseru'),
    'causative_negative', jsonb_build_object('japanese', '食べさせない', 'reading', 'たべさせない', 'romaji', 'tabesasenai'),
    'causative_passive', jsonb_build_object('japanese', '食べさせられる', 'reading', 'たべさせられる', 'romaji', 'tabesaserareru'),
    'imperative', jsonb_build_object('japanese', '食べろ', 'reading', 'たべろ', 'romaji', 'tabero'),
    'imperative_negative', jsonb_build_object('japanese', '食べるな', 'reading', 'たべるな', 'romaji', 'taberuna')
  )
WHERE japanese_base LIKE '%食べ%' OR conjugations::text LIKE '%食べ%';

-- Update 書く (kaku) - Godan verb
UPDATE drill_sentences SET
  dictionary_form = '書く',
  reading = 'かく',
  romaji = 'kaku',
  conjugations = conjugations || jsonb_build_object(
    'masu_positive', jsonb_build_object('japanese', '書きます', 'reading', 'かきます', 'romaji', 'kakimasu'),
    'masu_negative', jsonb_build_object('japanese', '書きません', 'reading', 'かきません', 'romaji', 'kakimasen'),
    'masu_past_positive', jsonb_build_object('japanese', '書きました', 'reading', 'かきました', 'romaji', 'kakimashita'),
    'masu_past_negative', jsonb_build_object('japanese', '書きませんでした', 'reading', 'かきませんでした', 'romaji', 'kakimasendeshita'),
    'plain_positive', jsonb_build_object('japanese', '書く', 'reading', 'かく', 'romaji', 'kaku'),
    'plain_negative', jsonb_build_object('japanese', '書かない', 'reading', 'かかない', 'romaji', 'kakanai'),
    'plain_past_positive', jsonb_build_object('japanese', '書いた', 'reading', 'かいた', 'romaji', 'kaita'),
    'plain_past_negative', jsonb_build_object('japanese', '書かなかった', 'reading', 'かかなかった', 'romaji', 'kakanakatta'),
    'te_form', jsonb_build_object('japanese', '書いて', 'reading', 'かいて', 'romaji', 'kaite'),
    'te_iru', jsonb_build_object('japanese', '書いている', 'reading', 'かいている', 'romaji', 'kaiteiru'),
    'tai_form', jsonb_build_object('japanese', '書きたい', 'reading', 'かきたい', 'romaji', 'kakitai'),
    'volitional', jsonb_build_object('japanese', '書こう', 'reading', 'かこう', 'romaji', 'kakou'),
    'volitional_polite', jsonb_build_object('japanese', '書きましょう', 'reading', 'かきましょう', 'romaji', 'kakimashou'),
    'potential_positive', jsonb_build_object('japanese', '書ける', 'reading', 'かける', 'romaji', 'kakeru'),
    'potential_negative', jsonb_build_object('japanese', '書けない', 'reading', 'かけない', 'romaji', 'kakenai'),
    'conditional_ba', jsonb_build_object('japanese', '書けば', 'reading', 'かけば', 'romaji', 'kakeba'),
    'conditional_tara', jsonb_build_object('japanese', '書いたら', 'reading', 'かいたら', 'romaji', 'kaitara'),
    'passive_positive', jsonb_build_object('japanese', '書かれる', 'reading', 'かかれる', 'romaji', 'kakareru'),
    'causative_positive', jsonb_build_object('japanese', '書かせる', 'reading', 'かかせる', 'romaji', 'kakaseru'),
    'imperative', jsonb_build_object('japanese', '書け', 'reading', 'かけ', 'romaji', 'kake'),
    'imperative_negative', jsonb_build_object('japanese', '書くな', 'reading', 'かくな', 'romaji', 'kakuna')
  )
WHERE japanese_base LIKE '%書%' OR conjugations::text LIKE '%書%';

-- Update する (suru) - Irregular verb
UPDATE drill_sentences SET
  dictionary_form = 'する',
  reading = 'する',
  romaji = 'suru',
  conjugations = conjugations || jsonb_build_object(
    'masu_positive', jsonb_build_object('japanese', 'します', 'reading', 'します', 'romaji', 'shimasu'),
    'masu_negative', jsonb_build_object('japanese', 'しません', 'reading', 'しません', 'romaji', 'shimasen'),
    'masu_past_positive', jsonb_build_object('japanese', 'しました', 'reading', 'しました', 'romaji', 'shimashita'),
    'masu_past_negative', jsonb_build_object('japanese', 'しませんでした', 'reading', 'しませんでした', 'romaji', 'shimasendeshita'),
    'plain_positive', jsonb_build_object('japanese', 'する', 'reading', 'する', 'romaji', 'suru'),
    'plain_negative', jsonb_build_object('japanese', 'しない', 'reading', 'しない', 'romaji', 'shinai'),
    'plain_past_positive', jsonb_build_object('japanese', 'した', 'reading', 'した', 'romaji', 'shita'),
    'plain_past_negative', jsonb_build_object('japanese', 'しなかった', 'reading', 'しなかった', 'romaji', 'shinakatta'),
    'te_form', jsonb_build_object('japanese', 'して', 'reading', 'して', 'romaji', 'shite'),
    'te_iru', jsonb_build_object('japanese', 'している', 'reading', 'している', 'romaji', 'shiteiru'),
    'tai_form', jsonb_build_object('japanese', 'したい', 'reading', 'したい', 'romaji', 'shitai'),
    'volitional', jsonb_build_object('japanese', 'しよう', 'reading', 'しよう', 'romaji', 'shiyou'),
    'volitional_polite', jsonb_build_object('japanese', 'しましょう', 'reading', 'しましょう', 'romaji', 'shimashou'),
    'potential_positive', jsonb_build_object('japanese', 'できる', 'reading', 'できる', 'romaji', 'dekiru'),
    'potential_negative', jsonb_build_object('japanese', 'できない', 'reading', 'できない', 'romaji', 'dekinai'),
    'conditional_ba', jsonb_build_object('japanese', 'すれば', 'reading', 'すれば', 'romaji', 'sureba'),
    'conditional_tara', jsonb_build_object('japanese', 'したら', 'reading', 'したら', 'romaji', 'shitara'),
    'passive_positive', jsonb_build_object('japanese', 'される', 'reading', 'される', 'romaji', 'sareru'),
    'causative_positive', jsonb_build_object('japanese', 'させる', 'reading', 'させる', 'romaji', 'saseru'),
    'causative_passive', jsonb_build_object('japanese', 'させられる', 'reading', 'させられる', 'romaji', 'saserareru'),
    'imperative', jsonb_build_object('japanese', 'しろ', 'reading', 'しろ', 'romaji', 'shiro'),
    'imperative_negative', jsonb_build_object('japanese', 'するな', 'reading', 'するな', 'romaji', 'suruna')
  )
WHERE japanese_base LIKE '%します%' OR conjugations::text LIKE '%します%';

-- Update 来る (kuru) - Irregular verb
UPDATE drill_sentences SET
  dictionary_form = '来る',
  reading = 'くる',
  romaji = 'kuru',
  conjugations = conjugations || jsonb_build_object(
    'masu_positive', jsonb_build_object('japanese', '来ます', 'reading', 'きます', 'romaji', 'kimasu'),
    'masu_negative', jsonb_build_object('japanese', '来ません', 'reading', 'きません', 'romaji', 'kimasen'),
    'masu_past_positive', jsonb_build_object('japanese', '来ました', 'reading', 'きました', 'romaji', 'kimashita'),
    'masu_past_negative', jsonb_build_object('japanese', '来ませんでした', 'reading', 'きませんでした', 'romaji', 'kimasendeshita'),
    'plain_positive', jsonb_build_object('japanese', '来る', 'reading', 'くる', 'romaji', 'kuru'),
    'plain_negative', jsonb_build_object('japanese', '来ない', 'reading', 'こない', 'romaji', 'konai'),
    'plain_past_positive', jsonb_build_object('japanese', '来た', 'reading', 'きた', 'romaji', 'kita'),
    'plain_past_negative', jsonb_build_object('japanese', '来なかった', 'reading', 'こなかった', 'romaji', 'konakatta'),
    'te_form', jsonb_build_object('japanese', '来て', 'reading', 'きて', 'romaji', 'kite'),
    'te_iru', jsonb_build_object('japanese', '来ている', 'reading', 'きている', 'romaji', 'kiteiru'),
    'tai_form', jsonb_build_object('japanese', '来たい', 'reading', 'きたい', 'romaji', 'kitai'),
    'volitional', jsonb_build_object('japanese', '来よう', 'reading', 'こよう', 'romaji', 'koyou'),
    'volitional_polite', jsonb_build_object('japanese', '来ましょう', 'reading', 'きましょう', 'romaji', 'kimashou'),
    'potential_positive', jsonb_build_object('japanese', '来られる', 'reading', 'こられる', 'romaji', 'korareru'),
    'potential_negative', jsonb_build_object('japanese', '来られない', 'reading', 'こられない', 'romaji', 'korarenai'),
    'conditional_ba', jsonb_build_object('japanese', '来れば', 'reading', 'くれば', 'romaji', 'kureba'),
    'conditional_tara', jsonb_build_object('japanese', '来たら', 'reading', 'きたら', 'romaji', 'kitara'),
    'passive_positive', jsonb_build_object('japanese', '来られる', 'reading', 'こられる', 'romaji', 'korareru'),
    'causative_positive', jsonb_build_object('japanese', '来させる', 'reading', 'こさせる', 'romaji', 'kosaseru'),
    'imperative', jsonb_build_object('japanese', '来い', 'reading', 'こい', 'romaji', 'koi'),
    'imperative_negative', jsonb_build_object('japanese', '来るな', 'reading', 'くるな', 'romaji', 'kuruna')
  )
WHERE japanese_base LIKE '%来ます%' OR conjugations::text LIKE '%来ます%';

-- ============================================================================
-- 5. Create index for faster lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_drill_prompts_phase ON drill_prompts(phase);
CREATE INDEX IF NOT EXISTS idx_drill_prompts_to_form ON drill_prompts(to_form);
CREATE INDEX IF NOT EXISTS idx_drill_sentences_verb_group ON drill_sentences(verb_group);
CREATE INDEX IF NOT EXISTS idx_drill_sentences_word_type ON drill_sentences(word_type);

-- ============================================================================
-- 6. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN drill_sentences.dictionary_form IS 'The dictionary form of the word (辞書形)';
COMMENT ON COLUMN drill_sentences.reading IS 'Hiragana reading of the dictionary form';
COMMENT ON COLUMN drill_sentences.romaji IS 'Romanized reading of the dictionary form';
COMMENT ON COLUMN drill_prompts.phase IS 'Learning phase 1-8: 1=Basic Polite, 2=Plain, 3=Te-form, 4=Desire/Volitional, 5=Potential, 6=Conditional, 7=Passive/Causative, 8=Imperative';
