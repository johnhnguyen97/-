# Gojun (語順) - Japanese Word Order Learning App

A Japanese language learning app that teaches word order through interactive sentence translation exercises and verb conjugation drills.

## Features

- **Sentence Reorder Game**: Drag-and-drop Japanese words to learn SOV (Subject-Object-Verb) word order
- **Pattern Drill**: Practice verb conjugations with SRS (Spaced Repetition System)
- **Grammar Guide**: Searchable grammar patterns with JLPT level filtering
- **Notes System**: Personal dictionary, favorites, and Notion-style notes
- **Kana Charts**: Hiragana & Katakana reference

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and Anthropic API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
gojun/
├── api/                    # Vercel serverless functions
│   ├── drill.ts           # Pattern drill API (SRS, questions)
│   ├── translate-sentence.ts
│   └── ...
├── src/
│   ├── components/        # React components
│   │   ├── PatternDrill/  # Verb conjugation practice
│   │   ├── GrammarGuide/  # Grammar reference
│   │   └── ...
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── services/          # API clients
│   ├── types/             # TypeScript interfaces
│   └── lib/               # Utilities (Supabase client)
├── scripts/               # Database migrations & imports
├── docs/                  # Documentation
│   ├── setup/            # Environment & setup guides
│   ├── development/      # Dev notes & migrations
│   └── reference/        # Grammar references
├── supabase/              # Supabase migrations
└── public/                # Static assets
```

## Environment Variables

Create a `.env` file with:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (for AI translations)
ANTHROPIC_API_KEY=your_api_key
```

See `docs/setup/` for detailed setup instructions.

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run Supabase migrations
npm run db:push
```

## Database

**Supabase Project**: `evqzqaqfanfuehavuxsr`

Key tables:
- `verbs` - Japanese verbs with conjugations and JLPT levels
- `example_sentences` - Tatoeba sentences for context
- `user_verb_progress` - SRS tracking per user
- `grammar_topics` - Grammar patterns and explanations
- `user_favorites` - Saved words

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Guidelines

1. Create a feature branch from `master`
2. Make changes with clear commit messages
3. Test locally with `npm run dev`
4. Submit a PR with description of changes

## Deployment

- **Hosting**: Vercel (auto-deploys from `master` branch)
- **Database**: Supabase hosted PostgreSQL

## License

MIT License - see [LICENSE](LICENSE)

## Links

- [Supabase Dashboard](https://supabase.com/dashboard/project/evqzqaqfanfuehavuxsr)
- [Vercel Dashboard](https://vercel.com)
