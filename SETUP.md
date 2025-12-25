# Gojun Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

## 2. Set Up the Database

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create the `user_api_keys` table

## 3. Get Your Supabase Credentials

From your Supabase dashboard, go to Settings > API and copy:
- **Project URL** (e.g., `https://xxxxx.supabase.co`)
- **anon public key** (safe for frontend)
- **service_role key** (keep secret, for backend only)

## 4. Generate an Encryption Secret

Generate a secure random string for encrypting API keys:

```bash
openssl rand -base64 32
```

Or use any secure password generator (at least 32 characters).

## 5. Configure Environment Variables

### For Local Development

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_SECRET=your-32-character-secret
```

### For Vercel Production

In your Vercel dashboard, go to Settings > Environment Variables and add:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_URL` | Your Supabase project URL (same as above) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ENCRYPTION_SECRET` | Your encryption secret |

## 6. Deploy to Vercel

```bash
vercel --prod
```

## Security Notes

- **API keys are encrypted** using AES-256-GCM before storage
- **Row Level Security** ensures users can only access their own data
- **Service role key** is only used server-side and never exposed to the frontend
- **User sessions** are managed by Supabase Auth with secure JWT tokens

## Getting an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to Settings > API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)
6. Add it in the Gojun Settings page after logging in
