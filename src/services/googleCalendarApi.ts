// Google Calendar API service

export interface GoogleStatus {
  connected: boolean;
  email: string | null;
  expiresAt: string | null;
}

// Get Google connection status
export async function getGoogleStatus(accessToken: string): Promise<GoogleStatus> {
  const response = await fetch('/api/google-auth?action=status', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google status');
  }

  return response.json();
}

// Start Google OAuth flow
export function connectGoogle(supabaseToken: string): void {
  const url = `/api/google-auth?action=authorize&state=${encodeURIComponent(supabaseToken)}`;
  window.location.href = url;
}

// Disconnect Google account
export async function disconnectGoogle(accessToken: string): Promise<void> {
  const response = await fetch('/api/google-auth?action=disconnect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Google');
  }
}

// Create Word of the Day events
export async function createWordOfTheDayEvents(
  accessToken: string,
  options: { jlptLevel?: string; reminderMinutes?: number } = {}
): Promise<{ success: boolean; eventsCreated: number }> {
  const response = await fetch('/api/google-calendar?action=create-wotd-events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create events');
  }

  return response.json();
}

// Create a task for a learned word
export async function createWordTask(
  accessToken: string,
  word: string,
  reading: string,
  meaning: string
): Promise<{ success: boolean; taskId: string }> {
  const response = await fetch('/api/google-calendar?action=create-task', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ word, reading, meaning }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task');
  }

  return response.json();
}

// List upcoming Word of the Day events
export async function listWordOfTheDayEvents(
  accessToken: string
): Promise<{ events: { id: string; summary: string; date: string }[] }> {
  const response = await fetch('/api/google-calendar?action=list-events', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to list events');
  }

  return response.json();
}
