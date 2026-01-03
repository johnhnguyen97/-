// Google Tasks API service for two-way sync

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  created: number;
  updated: number;
  deleted: number;
  errors?: string[];
}

export interface PullResult {
  success: boolean;
  pulled: number;
  created: number;
  updated: number;
  deleted: number;
}

export interface PushResult {
  success: boolean;
  googleTaskId: string;
  syncStatus: string;
}

// Check if Google is connected (uses combined google endpoint)
export async function isGoogleConnected(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/google?action=status', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.connected === true;
  } catch {
    return false;
  }
}

// Ensure the Gojun task list exists on Google
export async function ensureTaskList(accessToken: string): Promise<{ success: boolean; listId?: string; error?: string }> {
  const response = await fetch('/api/google?action=tasks-ensure-list', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.error || 'Failed to ensure task list' };
  }

  const data = await response.json();
  return { success: true, listId: data.listId };
}

// Push a single task to Google (called after local CRUD)
export async function pushTask(accessToken: string, taskId: string): Promise<PushResult> {
  const response = await fetch('/api/google?action=tasks-push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to push task');
  }

  return response.json();
}

// Pull all tasks from Google
export async function pullTasks(accessToken: string): Promise<PullResult> {
  const response = await fetch('/api/google?action=tasks-pull', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to pull tasks');
  }

  return response.json();
}

// Full bidirectional sync
export async function syncTasks(accessToken: string): Promise<SyncResult> {
  const response = await fetch('/api/google?action=tasks-sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync tasks');
  }

  return response.json();
}

// Delete a task from Google
export async function deleteGoogleTask(
  accessToken: string,
  googleTaskId: string,
  listId?: string
): Promise<{ success: boolean }> {
  const response = await fetch('/api/google?action=tasks-delete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ googleTaskId, listId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete task from Google');
  }

  return response.json();
}
