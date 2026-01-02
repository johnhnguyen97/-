# Gojun Grammar Engine

The core grammar system that all games and AI must follow.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      USER/GAME                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AI GENERATION                        │
│  - Creates natural sentences                            │
│  - Chooses context-appropriate words                    │
│  - Suggests based on user level                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               GRAMMAR ENGINE (VALIDATOR)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Conjugation Algorithm                          │   │
│  │  - Godan rules (う→って, む→んで, etc.)          │   │
│  │  - Ichidan rules (る→て)                        │   │
│  │  - Irregular (する→して, 来る→来て)              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Verb Database                                   │   │
│  │  - All verbs with group classification           │   │
│  │  - Pre-computed conjugations (cached)            │   │
│  │  - Readings, meanings, JLPT level               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Grammar Rules                                   │   │
│  │  - Particle usage (は, が, を, に, で, etc.)     │   │
│  │  - Sentence patterns                             │   │
│  │  - Adjective conjugations                        │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Example Sentences                               │   │
│  │  - Organized by context (business, food, etc.)  │   │
│  │  - Multiple difficulty levels                    │   │
│  │  - Pre-validated, ready to use                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   VALIDATED OUTPUT                      │
│  - Guaranteed correct conjugations                      │
│  - Proper particle usage                                │
│  - Natural, contextual sentences                        │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. AI Generates
AI creates a sentence based on context, user level, topic.

### 2. Engine Validates
Every verb conjugation is checked against our algorithm:
- Look up verb in database → get group (Godan/Ichidan/Irregular)
- Apply conjugation rules for that group
- Compare AI output vs expected output
- If mismatch → correct it

### 3. Games Use Validated Data
Pattern Drill, Word Order, and future games all use the same validated sentences.

## Contexts/Topics

Sentences are organized by real-life situations:
- Daily Life (朝の routine, 夜の routine)
- Food & Dining (レストラン, 料理, 食べ物)
- Travel (空港, ホテル, 観光)
- Business (会議, メール, 電話)
- Family (家族, 親戚)
- Health & Exercise (運動, 病院)
- Shopping (買い物, 服)
- School (学校, 勉強)
- Hobbies (趣味, スポーツ)
- Weather (天気)
- Emotions (感情)

## Extensibility

Add new content anytime:
1. Add verbs → algorithm auto-generates all conjugations
2. Add grammar topics → scraped data or manual entry
3. Add sentences → validated before storage
4. Add contexts → new categories for sentences

## Files

```
src/lib/grammar-engine/
├── index.ts                 # Main exports
├── types.ts                 # TypeScript types
├── conjugator.ts            # Core conjugation algorithm
├── validator.ts             # Validates AI output
├── rules/
│   ├── godan.ts             # Godan verb rules
│   ├── ichidan.ts           # Ichidan verb rules
│   ├── irregular.ts         # する, 来る rules
│   ├── i-adjective.ts       # い-adjective rules
│   └── na-adjective.ts      # な-adjective rules
└── utils/
    ├── kana.ts              # Hiragana/Katakana utilities
    └── helpers.ts           # Common helpers
```
