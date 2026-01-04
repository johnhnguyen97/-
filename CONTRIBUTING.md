# Contributing to Gojun

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/johnhnguyen97/gojun.git
cd gojun
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env
```

Ask a maintainer for the development credentials, or set up your own Supabase project.

### 4. Start Development Server

```bash
npm run dev
```

## Project Overview

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/components/` | React components |
| `src/components/PatternDrill/` | Verb conjugation drill feature |
| `api/` | Vercel serverless API endpoints |
| `scripts/` | Database migrations and data import scripts |
| `supabase/` | Supabase schema migrations |

### Key Files

| File | Purpose |
|------|---------|
| `api/drill.ts` | Pattern drill API (SRS algorithm, question generation) |
| `src/services/drillApi.ts` | Frontend API client for drills |
| `CLAUDE.md` | AI assistant instructions (design patterns, conventions) |

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring

### Commit Messages

Use conventional commits:

```
feat(pattern-drill): add sentence mode support
fix(api): correct JLPT level filtering
refactor(components): extract DrillAnswer component
docs(readme): update setup instructions
```

### Pull Requests

1. Create a branch from `master`
2. Make your changes
3. Test locally with `npm run dev`
4. Push and create a PR
5. Describe what changes were made and why

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define interfaces in `src/types/`
- Avoid `any` - use proper types

### React

- Functional components with hooks
- Use Tailwind CSS for styling
- Follow existing component patterns

### API Endpoints

- Located in `api/` directory
- Use Supabase client for database access
- Return proper error responses

## Database Changes

### Adding Migrations

1. Create SQL in `supabase/migrations/`
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Test locally before pushing

### Running Migrations

```bash
npm run db:push
```

### Data Scripts

Data import/fix scripts go in `scripts/`:

```bash
npx ts-node scripts/your-script.ts
```

## Testing

Currently manual testing. Run the dev server and test features:

```bash
npm run dev
```

## Common Tasks

### Add a New API Endpoint

1. Create `api/your-endpoint.ts`
2. Export a default handler function
3. Add to `vercel.json` if needed

### Add a New Component

1. Create in `src/components/`
2. Use TypeScript interfaces for props
3. Follow existing styling patterns

### Fix Database Data

1. Create script in `scripts/`
2. Test with limited data first
3. Run against production carefully

## Questions?

- Check existing code for patterns
- Read `CLAUDE.md` for design guidelines
- Ask in PR comments

## Code of Conduct

Be respectful and constructive. We're all learning!
