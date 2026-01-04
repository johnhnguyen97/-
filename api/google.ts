import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// === Google OAuth Constants ===
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = 'https://gojun.vercel.app/api/google?action=callback';

// Google Tasks API base URL
const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

// Gojun task list name for organizing tasks
const GOJUN_TASK_LIST_NAME = 'Gojun 語順 - Japanese Learning';

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

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
}

interface LocalTask {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
  google_task_id?: string;
  google_task_list_id?: string;
  google_updated_at?: string;
  sync_status: string;
  updated_at: string;
  created_at: string;
}

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

    // === Calendar & Tasks actions (need Google tokens) ===
    const { data: tokenData } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (!tokenData) {
      return res.status(400).json({ error: 'Google not connected', code: 'GOOGLE_NOT_CONNECTED' });
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date()) {
      const refreshResult = await refreshGoogleToken(tokenData.refresh_token, supabase, user.id);
      if (!refreshResult.success) {
        return res.status(400).json({ error: 'Failed to refresh Google token' });
      }
      accessToken = refreshResult.accessToken;
    }

    // === Calendar Actions ===
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
    }

    // === Tasks Sync Actions ===
    switch (action) {
      case 'tasks-ensure-list':
        return handleTasksEnsureList(res, supabase, user.id, accessToken);
      case 'tasks-push':
        return handleTasksPush(req, res, supabase, user.id, accessToken);
      case 'tasks-pull':
        return handleTasksPull(res, supabase, user.id, accessToken);
      case 'tasks-sync':
        return handleTasksSync(res, supabase, user.id, accessToken);
      case 'tasks-delete':
        return handleTasksDelete(req, res, supabase, user.id, accessToken);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Google API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ========== Token Management ==========

async function refreshGoogleToken(
  refreshToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<{ success: boolean; accessToken: string }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    return { success: false, accessToken: '' };
  }

  const tokens = await response.json();

  await supabase
    .from('user_google_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('user_id', userId);

  return { success: true, accessToken: tokens.access_token };
}

// ========== OAuth Handlers ==========

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallback(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/settings?google_error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/settings?google_error=no_code');
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
    return res.redirect('/settings?google_error=token_exchange_failed');
  }

  const tokens = await tokenResponse.json();

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const userInfo = await userInfoResponse.json();

  if (!state) {
    return res.redirect('/settings?google_error=no_state');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(state as string);
  if (authError || !user) {
    return res.redirect('/settings?google_error=invalid_session');
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
    return res.redirect('/settings?google_error=storage_failed');
  }

  return res.redirect('/settings?google_connected=true');
}

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

  const result = await refreshGoogleToken(tokenData.refresh_token, supabase, userId);
  if (!result.success) {
    return res.status(400).json({ error: 'Failed to refresh token' });
  }

  return res.status(200).json({ success: true });
}

// ========== Calendar Handlers ==========

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

async function createTask(req: VercelRequest, res: VercelResponse, accessToken: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word, reading, meaning } = req.body || {};

  if (!word || !meaning) {
    return res.status(400).json({ error: 'Word and meaning required' });
  }

  const listResponse = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const lists = await listResponse.json();
  let gojunList = lists.items?.find((l: { title: string }) => l.title === GOJUN_TASK_LIST_NAME);

  if (!gojunList) {
    const createListResponse = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: GOJUN_TASK_LIST_NAME }),
    });
    gojunList = await createListResponse.json();
  }

  const task = {
    title: `Review: ${word} (${reading})`,
    notes: `Meaning: ${meaning}\n\nReview this word!`,
  };

  const taskResponse = await fetch(`${TASKS_API_BASE}/lists/${gojunList.id}/tasks`, {
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

// ========== Tasks Sync Handlers ==========

// Get the default "My Tasks" list ID (first list returned by API)
async function getDefaultTaskListId(accessToken: string): Promise<{ listId: string | null; error?: string }> {
  const listResponse = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    return { listId: null, error: 'Failed to list task lists' };
  }

  const lists = await listResponse.json();
  // The first list is typically "My Tasks" (the default)
  const listId = lists.items?.[0]?.id || null;

  if (!listId) {
    return { listId: null, error: 'No task lists found' };
  }

  return { listId };
}

async function handleTasksEnsureList(
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _supabase: any,
  _userId: string,
  accessToken: string
) {
  const { listId, error } = await getDefaultTaskListId(accessToken);

  if (error || !listId) {
    return res.status(400).json({ error: error || 'No task list found' });
  }

  return res.status(200).json({ success: true, listId });
}

async function handleTasksPush(
  req: VercelRequest,
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId } = req.body || {};
  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  // Get the local task
  const { data: task, error: taskError } = await supabase
    .from('user_calendar_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (taskError || !task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Get default "My Tasks" list
  const { listId, error: listError } = await getDefaultTaskListId(accessToken);
  if (listError || !listId) {
    return res.status(400).json({ error: listError || 'Failed to get task list' });
  }

  // Build Google Task object
  const googleTask: Partial<GoogleTask> = {
    title: task.title,
    notes: task.notes || undefined,
    status: task.is_completed ? 'completed' : 'needsAction',
  };

  // Set due date - use task's due_date or default to today
  const dueDate = task.due_date ? new Date(task.due_date) : new Date();
  googleTask.due = dueDate.toISOString();

  let response: Response;
  let googleTaskData: GoogleTask;

  if (task.google_task_id) {
    // Update existing task
    response = await fetch(
      `${TASKS_API_BASE}/lists/${listId}/tasks/${task.google_task_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleTask),
      }
    );
  } else {
    // Create new task
    response = await fetch(`${TASKS_API_BASE}/lists/${listId}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleTask),
    });
  }

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to push task to Google:', error);

    await supabase
      .from('user_calendar_tasks')
      .update({ sync_status: 'sync_error' })
      .eq('id', taskId);

    return res.status(400).json({ error: 'Failed to push task to Google', details: error });
  }

  googleTaskData = await response.json();

  await supabase
    .from('user_calendar_tasks')
    .update({
      google_task_id: googleTaskData.id,
      google_task_list_id: listId,
      google_updated_at: googleTaskData.updated,
      sync_status: 'synced',
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  return res.status(200).json({
    success: true,
    googleTaskId: googleTaskData.id,
    syncStatus: 'synced',
  });
}

async function handleTasksPull(
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  // Get default "My Tasks" list
  const { listId, error: listError } = await getDefaultTaskListId(accessToken);
  if (listError || !listId) {
    return res.status(400).json({ error: listError || 'Failed to get task list' });
  }

  const response = await fetch(
    `${TASKS_API_BASE}/lists/${listId}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    return res.status(400).json({ error: 'Failed to fetch tasks from Google' });
  }

  const googleData = await response.json();
  const googleTasks: GoogleTask[] = googleData.items || [];

  const { data: localTasks } = await supabase
    .from('user_calendar_tasks')
    .select('*')
    .eq('user_id', userId);

  const localTasksByGoogleId = new Map<string, LocalTask>();
  (localTasks || []).forEach((t: LocalTask) => {
    if (t.google_task_id) {
      localTasksByGoogleId.set(t.google_task_id, t);
    }
  });

  let created = 0;
  let updated = 0;
  let deleted = 0;

  const googleTaskIds = new Set<string>();
  for (const gTask of googleTasks) {
    googleTaskIds.add(gTask.id);
    const localTask = localTasksByGoogleId.get(gTask.id);

    if (localTask) {
      const googleUpdated = new Date(gTask.updated);
      const localUpdated = localTask.google_updated_at
        ? new Date(localTask.google_updated_at)
        : new Date(0);

      if (googleUpdated > localUpdated) {
        await supabase
          .from('user_calendar_tasks')
          .update({
            title: gTask.title,
            notes: gTask.notes || null,
            is_completed: gTask.status === 'completed',
            completed_at: gTask.completed || null,
            due_date: gTask.due ? gTask.due.split('T')[0] : null,
            google_updated_at: gTask.updated,
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          })
          .eq('id', localTask.id);
        updated++;
      }
    } else {
      await supabase.from('user_calendar_tasks').insert({
        user_id: userId,
        title: gTask.title,
        notes: gTask.notes || null,
        task_type: 'custom',
        is_completed: gTask.status === 'completed',
        completed_at: gTask.completed || null,
        due_date: gTask.due ? gTask.due.split('T')[0] : null,
        google_task_id: gTask.id,
        google_task_list_id: listId,
        google_updated_at: gTask.updated,
        sync_status: 'synced',
        priority: 0,
      });
      created++;
    }
  }

  for (const localTask of localTasks || []) {
    if (localTask.google_task_id && !googleTaskIds.has(localTask.google_task_id)) {
      await supabase
        .from('user_calendar_tasks')
        .delete()
        .eq('id', localTask.id);
      deleted++;
    }
  }

  return res.status(200).json({
    success: true,
    pulled: googleTasks.length,
    created,
    updated,
    deleted,
  });
}

async function handleTasksSync(
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  // Get default "My Tasks" list
  const { listId, error: listError } = await getDefaultTaskListId(accessToken);
  if (listError || !listId) {
    return res.status(400).json({ error: listError || 'Failed to get task list' });
  }

  // Step 1: Push all pending local changes to Google
  const { data: pendingTasks } = await supabase
    .from('user_calendar_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('sync_status', ['local', 'pending_sync']);

  let pushed = 0;
  const pushErrors: string[] = [];

  for (const task of pendingTasks || []) {
    const googleTask: Partial<GoogleTask> = {
      title: task.title,
      notes: task.notes || undefined,
      status: task.is_completed ? 'completed' : 'needsAction',
    };

    // Set due date - use task's due_date or default to today
    const dueDate = task.due_date ? new Date(task.due_date) : new Date();
    googleTask.due = dueDate.toISOString();

    let response: Response;

    if (task.google_task_id) {
      // Update existing task
      response = await fetch(
        `${TASKS_API_BASE}/lists/${listId}/tasks/${task.google_task_id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleTask),
        }
      );
    } else {
      // Create new task
      response = await fetch(`${TASKS_API_BASE}/lists/${listId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleTask),
      });
    }

    if (response.ok) {
      const googleTaskData = await response.json();

      await supabase
        .from('user_calendar_tasks')
        .update({
          google_task_id: googleTaskData.id,
          google_task_list_id: listId,
          google_updated_at: googleTaskData.updated,
          sync_status: 'synced',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);
      pushed++;
    } else {
      pushErrors.push(`Failed to push task: ${task.title}`);
      await supabase
        .from('user_calendar_tasks')
        .update({ sync_status: 'sync_error' })
        .eq('id', task.id);
    }
  }

  // Step 2: Pull from Google
  const pullResponse = await fetch(
    `${TASKS_API_BASE}/lists/${listId}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!pullResponse.ok) {
    return res.status(400).json({
      error: 'Failed to pull from Google',
      pushed,
      pushErrors,
    });
  }

  const googleData = await pullResponse.json();
  const googleTasks: GoogleTask[] = googleData.items || [];

  const { data: localTasks } = await supabase
    .from('user_calendar_tasks')
    .select('*')
    .eq('user_id', userId);

  const localTasksByGoogleId = new Map<string, LocalTask>();
  (localTasks || []).forEach((t: LocalTask) => {
    if (t.google_task_id) {
      localTasksByGoogleId.set(t.google_task_id, t);
    }
  });

  let pulled = 0;
  let created = 0;
  let updated = 0;
  let deleted = 0;

  const googleTaskIds = new Set<string>();
  for (const gTask of googleTasks) {
    googleTaskIds.add(gTask.id);
    pulled++;

    const localTask = localTasksByGoogleId.get(gTask.id);

    if (localTask) {
      const googleUpdated = new Date(gTask.updated);
      const localUpdated = localTask.google_updated_at
        ? new Date(localTask.google_updated_at)
        : new Date(0);

      if (googleUpdated > localUpdated) {
        await supabase
          .from('user_calendar_tasks')
          .update({
            title: gTask.title,
            notes: gTask.notes || null,
            is_completed: gTask.status === 'completed',
            completed_at: gTask.completed || null,
            due_date: gTask.due ? gTask.due.split('T')[0] : null,
            google_updated_at: gTask.updated,
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          })
          .eq('id', localTask.id);
        updated++;
      }
    } else {
      await supabase.from('user_calendar_tasks').insert({
        user_id: userId,
        title: gTask.title,
        notes: gTask.notes || null,
        task_type: 'custom',
        is_completed: gTask.status === 'completed',
        completed_at: gTask.completed || null,
        due_date: gTask.due ? gTask.due.split('T')[0] : null,
        google_task_id: gTask.id,
        google_task_list_id: listId,
        google_updated_at: gTask.updated,
        sync_status: 'synced',
        priority: 0,
      });
      created++;
    }
  }

  for (const localTask of localTasks || []) {
    if (localTask.google_task_id && !googleTaskIds.has(localTask.google_task_id)) {
      await supabase
        .from('user_calendar_tasks')
        .delete()
        .eq('id', localTask.id);
      deleted++;
    }
  }

  return res.status(200).json({
    success: true,
    pushed,
    pulled,
    created,
    updated,
    deleted,
    errors: pushErrors.length > 0 ? pushErrors : undefined,
  });
}

async function handleTasksDelete(
  req: VercelRequest,
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { googleTaskId, listId } = req.body || {};
  if (!googleTaskId) {
    return res.status(400).json({ error: 'googleTaskId is required' });
  }

  let taskListId = listId;
  if (!taskListId) {
    const { data: settings } = await supabase
      .from('user_calendar_settings')
      .select('google_task_list_id')
      .eq('user_id', userId)
      .single();
    taskListId = settings?.google_task_list_id;
  }

  if (!taskListId) {
    return res.status(400).json({ error: 'Task list not found' });
  }

  const response = await fetch(
    `${TASKS_API_BASE}/lists/${taskListId}/tasks/${googleTaskId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    return res.status(400).json({ error: 'Failed to delete task from Google' });
  }

  return res.status(200).json({ success: true });
}
