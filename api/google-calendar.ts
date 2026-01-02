import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// === Google OAuth Constants ===
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Hardcoded to match Google Cloud Console - don't use env var to avoid mismatch
const GOOGLE_REDIRECT_URI = 'https://gojun.vercel.app/api/google-calendar?action=callback';

// Scopes for Calendar and Tasks
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'openid',
  'email',
  'profile'
].join(' ');

// JLPT words for Word of the Day
const JLPT_WORDS: Record<string, { word: string; reading: string; meaning: string }[]> = {
  N5: [
    { word: '食べる', reading: 'たべる', meaning: 'to eat' },
    { word: '飲む', reading: 'のむ', meaning: 'to drink' },
    { word: '行く', reading: 'いく', meaning: 'to go' },
    { word: '来る', reading: 'くる', meaning: 'to come' },
    { word: '見る', reading: 'みる', meaning: 'to see' },
    { word: '聞く', reading: 'きく', meaning: 'to hear/listen' },
    { word: '読む', reading: 'よむ', meaning: 'to read' },
    { word: '書く', reading: 'かく', meaning: 'to write' },
    { word: '話す', reading: 'はなす', meaning: 'to speak' },
    { word: '買う', reading: 'かう', meaning: 'to buy' },
  ],
  N4: [
    { word: '届ける', reading: 'とどける', meaning: 'to deliver' },
    { word: '届く', reading: 'とどく', meaning: 'to arrive' },
    { word: '決める', reading: 'きめる', meaning: 'to decide' },
    { word: '調べる', reading: 'しらべる', meaning: 'to investigate' },
    { word: '育てる', reading: 'そだてる', meaning: 'to raise' },
    { word: '続ける', reading: 'つづける', meaning: 'to continue' },
    { word: '伝える', reading: 'つたえる', meaning: 'to convey' },
    { word: '慣れる', reading: 'なれる', meaning: 'to get used to' },
    { word: '増える', reading: 'ふえる', meaning: 'to increase' },
    { word: '減る', reading: 'へる', meaning: 'to decrease' },
  ],
  N3: [
    { word: '影響', reading: 'えいきょう', meaning: 'influence' },
    { word: '価値', reading: 'かち', meaning: 'value' },
    { word: '環境', reading: 'かんきょう', meaning: 'environment' },
    { word: '機会', reading: 'きかい', meaning: 'opportunity' },
    { word: '基本', reading: 'きほん', meaning: 'foundation' },
    { word: '現在', reading: 'げんざい', meaning: 'present time' },
    { word: '効果', reading: 'こうか', meaning: 'effect' },
    { word: '事実', reading: 'じじつ', meaning: 'fact' },
    { word: '状況', reading: 'じょうきょう', meaning: 'situation' },
    { word: '信じる', reading: 'しんじる', meaning: 'to believe' },
  ],
  N2: [
    { word: '維持', reading: 'いじ', meaning: 'maintenance' },
    { word: '印象', reading: 'いんしょう', meaning: 'impression' },
    { word: '解決', reading: 'かいけつ', meaning: 'solution' },
    { word: '改善', reading: 'かいぜん', meaning: 'improvement' },
    { word: '感動', reading: 'かんどう', meaning: 'emotion' },
    { word: '傾向', reading: 'けいこう', meaning: 'tendency' },
    { word: '責任', reading: 'せきにん', meaning: 'responsibility' },
    { word: '選択', reading: 'せんたく', meaning: 'selection' },
    { word: '実現', reading: 'じつげん', meaning: 'realization' },
    { word: '柔軟', reading: 'じゅうなん', meaning: 'flexible' },
  ],
  N1: [
    { word: '曖昧', reading: 'あいまい', meaning: 'ambiguous' },
    { word: '圧倒的', reading: 'あっとうてき', meaning: 'overwhelming' },
    { word: '概念', reading: 'がいねん', meaning: 'concept' },
    { word: '画期的', reading: 'かっきてき', meaning: 'groundbreaking' },
    { word: '寛容', reading: 'かんよう', meaning: 'tolerant' },
    { word: '脆弱', reading: 'ぜいじゃく', meaning: 'fragile' },
    { word: '洗練', reading: 'せんれん', meaning: 'refinement' },
    { word: '妥協', reading: 'だきょう', meaning: 'compromise' },
    { word: '徹底', reading: 'てってい', meaning: 'thoroughness' },
    { word: '把握', reading: 'はあく', meaning: 'grasp' },
  ],
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getWordOfTheDay(date: string, jlptLevel: string) {
  const words = JLPT_WORDS[jlptLevel] || JLPT_WORDS.N5;
  const index = hashCode(date + jlptLevel) % words.length;
  return words[index];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // === OAuth Actions (no auth required) ===
    switch (action) {
      case 'authorize':
        return handleAuthorize(req, res);
      case 'callback':
        return handleCallback(req, res, supabase);
    }

    // === Auth-required actions ===
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // === Auth status actions (don't need Google tokens) ===
    switch (action) {
      case 'status':
        return handleStatus(res, supabase, user.id);
      case 'disconnect':
        return handleDisconnect(req, res, supabase, user.id);
      case 'refresh':
        return handleRefresh(res, supabase, user.id);
    }

    // === Calendar actions (need Google tokens) ===
    const { data: tokenData } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (!tokenData) {
      return res.status(400).json({ error: 'Google not connected' });
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date()) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        return res.status(400).json({ error: 'Failed to refresh Google token' });
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      await supabase
        .from('user_google_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user.id);
    }

    switch (action) {
      case 'create-wotd-events':
        return createWordOfTheDayEvents(req, res, accessToken, supabase, user.id);
      case 'delete-wotd-events':
        return deleteWordOfTheDayEvents(req, res, accessToken);
      case 'create-task':
        return createTask(req, res, accessToken);
      case 'list-calendars':
        return listCalendars(res, accessToken);
      case 'list-events':
        return listEvents(res, accessToken);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Google Calendar error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ========== OAuth Handlers ==========

// Start OAuth flow - redirect to Google
function handleAuthorize(req: VercelRequest, res: VercelResponse) {
  const { state } = req.query;

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  if (state) authUrl.searchParams.set('state', state as string);

  return res.redirect(authUrl.toString());
}

// Handle OAuth callback from Google
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallback(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/?google_error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?google_error=no_code');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error('Token exchange failed:', err);
    return res.redirect('/?google_error=token_exchange_failed');
  }

  const tokens = await tokenResponse.json();

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const userInfo = await userInfoResponse.json();

  if (!state) {
    return res.redirect('/?google_error=no_state');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(state as string);
  if (authError || !user) {
    return res.redirect('/?google_error=invalid_session');
  }

  const { error: dbError } = await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      google_email: userInfo.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (dbError) {
    console.error('Failed to store tokens:', dbError);
    return res.redirect('/?google_error=storage_failed');
  }

  return res.redirect('/?google_connected=true');
}

// Check if user has Google connected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStatus(res: VercelResponse, supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_google_tokens')
    .select('google_email, expires_at')
    .eq('user_id', userId)
    .single();

  return res.status(200).json({
    connected: !!data,
    email: data?.google_email || null,
    expiresAt: data?.expires_at || null,
  });
}

// Disconnect Google account
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDisconnect(req: VercelRequest, res: VercelResponse, supabase: any, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: tokenData } = await supabase
    .from('user_google_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (tokenData?.access_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
      method: 'POST',
    });
  }

  await supabase
    .from('user_google_tokens')
    .delete()
    .eq('user_id', userId);

  return res.status(200).json({ success: true });
}

// Refresh access token
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefresh(res: VercelResponse, supabase: any, userId: string) {
  const { data: tokenData } = await supabase
    .from('user_google_tokens')
    .select('refresh_token')
    .eq('user_id', userId)
    .single();

  if (!tokenData?.refresh_token) {
    return res.status(400).json({ error: 'No refresh token' });
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    return res.status(400).json({ error: 'Failed to refresh token' });
  }

  const tokens = await tokenResponse.json();

  await supabase
    .from('user_google_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return res.status(200).json({ success: true });
}

// ========== Calendar Handlers ==========

// Create Word of the Day events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createWordOfTheDayEvents(req: VercelRequest, res: VercelResponse, accessToken: string, supabase: any, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    jlptLevel = 'N5',
    reminderTime = '09:00',
    startDate,
    endDate,
    days = 30
  } = req.body || {};

  const { data: settings } = await supabase
    .from('user_calendar_settings')
    .select('jlpt_level')
    .eq('user_id', userId)
    .single();

  const level = settings?.jlpt_level || jlptLevel;

  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    start = new Date();
    end = new Date();
    end.setDate(end.getDate() + days);
  }

  const [hours, minutes] = reminderTime.split(':').map(Number);
  const reminderMinutes = (24 * 60) - (hours * 60 + minutes);

  const createdEvents: string[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const word = getWordOfTheDay(dateStr, level);

    const event = {
      summary: `📚 Word of the Day: ${word.word} (${word.reading})`,
      description: `Japanese: ${word.word}\nReading: ${word.reading}\nMeaning: ${word.meaning}\nJLPT Level: ${level}\n\nPowered by Gojun 語順`,
      start: { date: dateStr },
      end: { date: dateStr },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: reminderMinutes }],
      },
      extendedProperties: {
        private: { createdBy: 'gojun', type: 'wotd' }
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (response.ok) {
      const data = await response.json();
      createdEvents.push(data.id);
    } else {
      const error = await response.json();
      console.error('Failed to create event:', error);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return res.status(200).json({
    success: true,
    eventsCreated: createdEvents.length,
    jlptLevel: level,
    dateRange: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
    reminderTime,
  });
}

// Delete all Word of the Day events
async function deleteWordOfTheDayEvents(req: VercelRequest, res: VercelResponse, accessToken: string) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${maxDate.toISOString()}&q=${encodeURIComponent('Word of the Day')}&maxResults=250`;

  const listResponse = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!listResponse.ok) {
    return res.status(400).json({ error: 'Failed to list events' });
  }

  const listData = await listResponse.json();
  const events = listData.items || [];

  const gojunEvents = events.filter((e: { summary?: string }) =>
    e.summary?.includes('Word of the Day') && e.summary?.includes('📚')
  );

  let deletedCount = 0;
  const errors: string[] = [];

  for (const event of gojunEvents) {
    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (deleteResponse.ok || deleteResponse.status === 204) {
      deletedCount++;
    } else {
      errors.push(`Failed to delete event ${event.id}`);
    }
  }

  return res.status(200).json({
    success: true,
    eventsDeleted: deletedCount,
    totalFound: gojunEvents.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// List user's Google calendars
async function listCalendars(res: VercelResponse, accessToken: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return res.status(400).json({ error: 'Failed to list calendars' });
  }

  const data = await response.json();
  return res.status(200).json({
    calendars: data.items?.map((c: { id: string; summary: string; primary?: boolean; backgroundColor?: string }) => ({
      id: c.id,
      name: c.summary,
      primary: c.primary || false,
      color: c.backgroundColor,
    })) || [],
  });
}

// Create a task for a learned word
async function createTask(req: VercelRequest, res: VercelResponse, accessToken: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word, reading, meaning } = req.body || {};

  if (!word || !meaning) {
    return res.status(400).json({ error: 'Word and meaning required' });
  }

  const listResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const lists = await listResponse.json();
  let gojunList = lists.items?.find((l: { title: string }) => l.title === 'Gojun - Japanese Words');

  if (!gojunList) {
    const createListResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Gojun - Japanese Words' }),
    });
    gojunList = await createListResponse.json();
  }

  const task = {
    title: `Review: ${word} (${reading})`,
    notes: `Meaning: ${meaning}\n\nReview this word!`,
  };

  const taskResponse = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${gojunList.id}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!taskResponse.ok) {
    const error = await taskResponse.json();
    return res.status(400).json({ error: 'Failed to create task', details: error });
  }

  const createdTask = await taskResponse.json();
  return res.status(200).json({ success: true, taskId: createdTask.id });
}

// List upcoming events
async function listEvents(res: VercelResponse, accessToken: string) {
  const now = new Date().toISOString();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${maxDate.toISOString()}&q=Word%20of%20the%20Day&maxResults=30`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    return res.status(400).json({ error: 'Failed to fetch events' });
  }

  const data = await response.json();
  return res.status(200).json({
    events: data.items?.map((e: { id: string; summary: string; start: { date?: string; dateTime?: string } }) => ({
      id: e.id,
      summary: e.summary,
      date: e.start.date || e.start.dateTime,
    })) || [],
  });
}
