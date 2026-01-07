-- Insert example sentences for i-adjectives

-- N5 adjectives
INSERT INTO example_sentences (japanese, english, word_key, word_reading, jlpt_level) VALUES
-- Basic descriptive
('このケーキはおいしいです', 'This cake is delicious', 'おいしい', 'おいしい', 'N5'),
('今日はいい天気です', 'Today is good weather', 'いい', 'いい', 'N5'),
('この問題は悪いです', 'This problem is bad', '悪い', 'わるい', 'N5'),
('東京は大きい都市です', 'Tokyo is a big city', '大きい', 'おおきい', 'N5'),
('小さい犬がいます', 'There is a small dog', '小さい', 'ちいさい', 'N5'),

-- Price & size
('このバッグは高いです', 'This bag is expensive', '高い', 'たかい', 'N5'),
('その店は安いです', 'That store is cheap', '安い', 'やすい', 'N5'),
('天井が低いです', 'The ceiling is low', '低い', 'ひくい', 'N5'),

-- Temperature
('夏は暑いです', 'Summer is hot', '暑い', 'あつい', 'N5'),
('冬は寒いです', 'Winter is cold', '寒い', 'さむい', 'N5'),
('春は暖かいです', 'Spring is warm', '暖かい', 'あたたかい', 'N5'),
('秋は涼しいです', 'Autumn is cool', '涼しい', 'すずしい', 'N5'),

-- New & old
('新しい車を買いました', 'I bought a new car', '新しい', 'あたらしい', 'N5'),
('古い家に住んでいます', 'I live in an old house', '古い', 'ふるい', 'N5'),

-- Taste
('このラーメンはまずいです', 'This ramen tastes bad', 'まずい', 'まずい', 'N5'),
('甘いお菓子が好きです', 'I like sweet snacks', '甘い', 'あまい', 'N5'),

-- Emotions
('プレゼントをもらって嬉しいです', 'I''m happy to receive a present', '嬉しい', 'うれしい', 'N5'),
('映画が終わって悲しいです', 'I''m sad the movie ended', '悲しい', 'かなしい', 'N5'),
('パーティーは楽しいです', 'The party is fun', '楽しい', 'たのしい', 'N5'),
('この本はつまらないです', 'This book is boring', 'つまらない', 'つまらない', 'N5'),
('このゲームは面白いです', 'This game is interesting', '面白い', 'おもしろい', 'N5'),
('お化けが怖いです', 'I''m scared of ghosts', '怖い', 'こわい', 'N5'),
('人前で話すのは恥ずかしいです', 'Speaking in public is embarrassing', '恥ずかしい', 'はずかしい', 'N5'),
('今とても眠いです', 'I''m very sleepy now', '眠い', 'ねむい', 'N5'),

-- Physical sensations
('頭が痛いです', 'My head hurts', '痛い', 'いたい', 'N5'),

-- Appearance
('この猫はかわいいです', 'This cat is cute', 'かわいい', 'かわいい', 'N5'),
('部屋が明るいです', 'The room is bright', '明るい', 'あかるい', 'N5'),
('夜は暗いです', 'It''s dark at night', '暗い', 'くらい', 'N5'),
('トイレが汚いです', 'The toilet is dirty', '汚い', 'きたない', 'N5'),

-- Size & dimensions
('公園は広いです', 'The park is spacious', '広い', 'ひろい', 'N5'),
('この部屋は狭いです', 'This room is cramped', '狭い', 'せまい', 'N5'),
('長い髪が好きです', 'I like long hair', '長い', 'ながい', 'N5'),
('短いスカートを履きます', 'I wear a short skirt', '短い', 'みじかい', 'N5'),

-- Difficulty
('この問題は易しいです', 'This problem is easy', '易しい', 'やさしい', 'N5'),
('日本語は難しいです', 'Japanese is difficult', '難しい', 'むずかしい', 'N5'),

-- Busy
('週末は忙しいです', 'I''m busy on weekends', '忙しい', 'いそがしい', 'N5'),

-- N4 adjectives
-- Speed
('彼は速い走者です', 'He is a fast runner', '速い', 'はやい', 'N4'),
('朝早く起きます', 'I wake up early in the morning', '早い', 'はやい', 'N4'),
('このバスは遅いです', 'This bus is slow', '遅い', 'おそい', 'N4'),

-- Weight & strength
('このカバンは重いです', 'This bag is heavy', '重い', 'おもい', 'N4'),
('軽い荷物を持っています', 'I''m carrying light luggage', '軽い', 'かるい', 'N4'),
('彼は強い人です', 'He is a strong person', '強い', 'つよい', 'N4'),
('弱い風が吹いています', 'A weak wind is blowing', '弱い', 'よわい', 'N4'),

-- Noise
('隣の部屋がうるさいです', 'The next room is noisy', 'うるさい', 'うるさい', 'N4'),

-- Taste & smell
('コーヒーは苦いです', 'Coffee is bitter', '苦い', 'にがい', 'N4'),
('レモンは酸っぱいです', 'Lemons are sour', '酸っぱい', 'すっぱい', 'N4'),
('この靴は臭いです', 'These shoes are smelly', '臭い', 'くさい', 'N4'),

-- Strictness & correctness
('先生は厳しいです', 'The teacher is strict', '厳しい', 'きびしい', 'N4'),
('あなたの答えは正しいです', 'Your answer is correct', '正しい', 'ただしい', 'N4'),

-- Desire & quantity
('新しいパソコンが欲しいです', 'I want a new computer', '欲しい', 'ほしい', 'N4'),
('東京には人が多いです', 'There are many people in Tokyo', '多い', 'おおい', 'N4'),
('時間が少ないです', 'There is little time', '少ない', 'すくない', 'N4')
ON CONFLICT DO NOTHING;
