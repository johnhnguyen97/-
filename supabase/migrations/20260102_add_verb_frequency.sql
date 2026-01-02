-- Add frequency/commonness field to verbs table
-- Frequency scale: 1-10 (10 = most common daily use, 1 = rare/formal)

ALTER TABLE verbs ADD COLUMN IF NOT EXISTS frequency INTEGER DEFAULT 5 CHECK (frequency >= 1 AND frequency <= 10);
CREATE INDEX IF NOT EXISTS idx_verbs_frequency ON verbs(frequency);

-- Update N5 verbs with frequency weights based on daily usage
-- Source: Wiktionary 1000 basic Japanese words, JLPT N5 core vocabulary

-- Frequency 10: Essential daily verbs (top 50)
UPDATE verbs SET frequency = 10 WHERE dictionary_form IN (
  'する',      -- to do
  'ある',      -- to exist (inanimate)
  'いる',      -- to exist (animate)
  'なる',      -- to become
  'いう',      -- to say
  '行く',      -- to go
  'くる',      -- to come
  '見る',      -- to see/watch
  '食べる',    -- to eat
  '飲む',      -- to drink
  '話す',      -- to speak
  '聞く',      -- to listen/hear
  '書く',      -- to write
  '読む',      -- to read
  '買う',      -- to buy
  '売る',      -- to sell
  '思う',      -- to think
  '知る',      -- to know
  '分かる',    -- to understand
  '会う'       -- to meet
);

-- Frequency 9: Very common daily verbs (top 100)
UPDATE verbs SET frequency = 9 WHERE dictionary_form IN (
  '起きる',    -- to wake up
  '寝る',      -- to sleep
  '働く',      -- to work
  '勉強する',  -- to study
  '帰る',      -- to return/go home
  '入る',      -- to enter
  '出る',      -- to exit/leave
  '乗る',      -- to ride
  '降りる',    -- to get off
  '歩く',      -- to walk
  '走る',      -- to run
  '立つ',      -- to stand
  '座る',      -- to sit
  '住む',      -- to live/reside
  '待つ',      -- to wait
  '使う',      -- to use
  '作る',      -- to make
  '開ける',    -- to open
  '閉める',    -- to close
  '始める'     -- to begin
);

-- Frequency 8: Common daily verbs (top 200)
UPDATE verbs SET frequency = 8 WHERE dictionary_form IN (
  '教える',    -- to teach
  '習う',      -- to learn
  '遊ぶ',      -- to play
  '休む',      -- to rest
  '終わる',    -- to end
  '持つ',      -- to hold/have
  '取る',      -- to take
  'もらう',    -- to receive
  'あげる',    -- to give
  '借りる',    -- to borrow
  '貸す',      -- to lend
  '消す',      -- to turn off/erase
  'つける',    -- to turn on/attach
  '切る',      -- to cut
  '洗う',      -- to wash
  '着る',      -- to wear
  '脱ぐ',      -- to take off
  '泳ぐ',      -- to swim
  '歌う',      -- to sing
  '踊る'       -- to dance
);

-- Frequency 7: Commonly used verbs (top 300)
UPDATE verbs SET frequency = 7 WHERE dictionary_form IN (
  '答える',    -- to answer
  '送る',      -- to send
  '届く',      -- to reach/arrive
  '置く',      -- to put/place
  '並ぶ',      -- to line up
  '選ぶ',      -- to choose
  '決める',    -- to decide
  '変える',    -- to change
  '直す',      -- to fix
  '困る',      -- to be troubled
  '笑う',      -- to laugh
  '泣く',      -- to cry
  '怒る',      -- to get angry
  '喜ぶ',      -- to be glad
  '驚く'       -- to be surprised
) AND frequency = 5;  -- Only update if not already set

-- Frequency 6: Moderately common (top 500)
UPDATE verbs SET frequency = 6 WHERE dictionary_form IN (
  '増える',    -- to increase
  '減る',      -- to decrease
  '続く',      -- to continue
  '止まる',    -- to stop
  '進む',      -- to advance
  '戻る',      -- to return/go back
  '残る',      -- to remain
  '消える',    -- to disappear
  '現れる',    -- to appear
  '比べる'     -- to compare
) AND frequency = 5;

-- Note: Verbs not explicitly set will remain at default frequency = 5
-- This represents neutral/standard usage frequency

COMMENT ON COLUMN verbs.frequency IS 'Commonness in daily conversation: 10=most common, 1=rare/formal. Based on JLPT core vocab and frequency lists.';
