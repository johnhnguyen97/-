import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Google Tasks API base URL
const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';
const GOJUN_TASK_LIST_NAME = 'Gojun - Japanese Words';

// Google OAuth constants (same as google-calendar.ts)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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

  // All actions require auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get Google tokens
  const { data: tokenData } = await supabase
    .from('user_google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .single();

  if (!tokenData) {
    return res.status(400).json({ error: 'Google not connected', code: 'GOOGLE_NOT_CONNECTED' });
  }

  // Refresh token if expired
  let accessToken = tokenData.access_token;
  if (new Date(tokenData.expires_at) < new Date()) {
    const refreshResult = await refreshGoogleToken(tokenData.refresh_token, supabase, user.id);
    if (!refreshResult.success) {
      return res.status(400).json({ error: 'Failed to refresh Google token' });
    }
    accessToken = refreshResult.accessToken;
  }

  try {
    switch (action) {
      case 'ensure-list':
        return handleEnsureList(res, supabase, user.id, accessToken);
      case 'push':
        return handlePush(req, res, supabase, user.id, accessToken);
      case 'pull':
        return handlePull(res, supabase, user.id, accessToken);
      case 'sync':
        return handleSync(res, supabase, user.id, accessToken);
      case 'delete':
        return handleDelete(req, res, supabase, user.id, accessToken);
      default:
        return res.status(400).json({ error: 'Invalid action. Use: ensure-list, push, pull, sync, delete' });
    }
  } catch (error) {
    console.error('Google Tasks error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Refresh Google access token
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

// Get or create the Gojun task list
async function getOrCreateTaskList(
  accessToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<{ listId: string | null; error?: string }> {
  // Check if we have a cached list ID
  const { data: settings } = await supabase
    .from('user_calendar_settings')
    .select('google_task_list_id')
    .eq('user_id', userId)
    .single();

  if (settings?.google_task_list_id) {
    // Verify the list still exists
    const verifyResponse = await fetch(
      `${TASKS_API_BASE}/users/@me/lists/${settings.google_task_list_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (verifyResponse.ok) {
      return { listId: settings.google_task_list_id };
    }
    // List was deleted, clear cache and continue to create new one
  }

  // List all task lists to find Gojun list
  const listResponse = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    return { listId: null, error: 'Failed to list task lists' };
  }

  const lists = await listResponse.json();
  let gojunList = lists.items?.find((l: { title: string }) => l.title === GOJUN_TASK_LIST_NAME);

  // Create list if it doesn't exist
  if (!gojunList) {
    const createResponse = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: GOJUN_TASK_LIST_NAME }),
    });

    if (!createResponse.ok) {
      return { listId: null, error: 'Failed to create task list' };
    }

    gojunList = await createResponse.json();
  }

  // Cache the list ID
  await supabase
    .from('user_calendar_settings')
    .upsert({
      user_id: userId,
      google_task_list_id: gojunList.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  return { listId: gojunList.id };
}

// Action: ensure-list - Get or create the Gojun task list
async function handleEnsureList(
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  const { listId, error } = await getOrCreateTaskList(accessToken, supabase, userId);

  if (error) {
    return res.status(400).json({ error });
  }

  return res.status(200).json({ success: true, listId });
}

// Action: push - Push a single task to Google
async function handlePush(
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

  // Get or create task list
  const { listId, error: listError } = await getOrCreateTaskList(accessToken, supabase, userId);
  if (listError || !listId) {
    return res.status(400).json({ error: listError || 'Failed to get task list' });
  }

  // Build Google Task object
  const googleTask: Partial<GoogleTask> = {
    title: task.title,
    notes: task.notes || undefined,
    status: task.is_completed ? 'completed' : 'needsAction',
  };

  if (task.due_date) {
    // Google Tasks expects RFC 3339 date format
    googleTask.due = new Date(task.due_date).toISOString();
  }

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

    // Mark as sync error
    await supabase
      .from('user_calendar_tasks')
      .update({ sync_status: 'sync_error' })
      .eq('id', taskId);

    return res.status(400).json({ error: 'Failed to push task to Google', details: error });
  }

  googleTaskData = await response.json();

  // Update local task with Google IDs and sync status
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

// Action: pull - Pull all tasks from Google
async function handlePull(
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  // Get or create task list
  const { listId, error: listError } = await getOrCreateTaskList(accessToken, supabase, userId);
  if (listError || !listId) {
    return res.status(400).json({ error: listError || 'Failed to get task list' });
  }

  // Fetch all tasks from Google (including completed)
  const response = await fetch(
    `${TASKS_API_BASE}/lists/${listId}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    return res.status(400).json({ error: 'Failed to fetch tasks from Google' });
  }

  const googleData = await response.json();
  const googleTasks: GoogleTask[] = googleData.items || [];

  // Get all local tasks for this user
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

  // Process Google tasks
  const googleTaskIds = new Set<string>();
  for (const gTask of googleTasks) {
    googleTaskIds.add(gTask.id);
    const localTask = localTasksByGoogleId.get(gTask.id);

    if (localTask) {
      // Task exists locally - check if Google is newer
      const googleUpdated = new Date(gTask.updated);
      const localUpdated = localTask.google_updated_at
        ? new Date(localTask.google_updated_at)
        : new Date(0);

      if (googleUpdated > localUpdated) {
        // Google is newer, update local
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
      // New task from Google - create locally
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

  // Handle deletions: tasks that exist locally with google_task_id but not in Google
  for (const localTask of localTasks || []) {
    if (localTask.google_task_id && !googleTaskIds.has(localTask.google_task_id)) {
      // Task was deleted from Google - remove locally
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

// Action: sync - Full bidirectional sync
async function handleSync(
  res: VercelResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string
) {
  // Get or create task list
  const { listId, error: listError } = await getOrCreateTaskList(accessToken, supabase, userId);
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

    if (task.due_date) {
      googleTask.due = new Date(task.due_date).toISOString();
    }

    let response: Response;

    if (task.google_task_id) {
      // Update existing
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
      // Create new
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

  // Step 2: Pull from Google (same logic as handlePull)
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

  // Get all local tasks again (after push updates)
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
      // Check if Google is newer
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
      // New from Google
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

  // Handle deletions
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

// Action: delete - Delete a task from Google
async function handleDelete(
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

  // Get list ID from settings if not provided
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
