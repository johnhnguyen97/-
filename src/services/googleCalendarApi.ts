// Google Calendar API service

export interface GoogleStatus {
  connected: boolean;
  email: string | null;
  expiresAt: string | null;
}

// Get Google connection status
export async function getGoogleStatus(accessToken: string): Promise<GoogleStatus> {
  const response = await fetch('/api/google?action=status', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google status');
  }

  return response.json();
}

// Start Google OAuth flow
export function connectGoogle(supabaseToken: string): void {
  const url = `/api/google?action=authorize&state=${encodeURIComponent(supabaseToken)}`;
  window.location.href = url;
}

// Disconnect Google account
export async function disconnectGoogle(accessToken: string): Promise<void> {
  const response = await fetch('/api/google?action=disconnect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Google');
  }
}

export interface CreateEventsOptions {
  jlptLevel?: string;
  reminderTime?: string;  // 24-hour format "HH:MM"
  startDate?: string;     // "YYYY-MM-DD"
  endDate?: string;       // "YYYY-MM-DD"
  days?: number;          // Default 30
}

export interface CreateEventsResult {
  success: boolean;
  eventsCreated: number;
  jlptLevel: string;
  dateRange: {
    start: string;
    end: string;
  };
  reminderTime: string;
}

// Create Word of the Day events
export async function createWordOfTheDayEvents(
  accessToken: string,
  options: CreateEventsOptions = {}
): Promise<CreateEventsResult> {
  const response = await fetch('/api/google?action=create-wotd-events', {
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

// Delete all Word of the Day events from Google Calendar
export async function deleteWordOfTheDayEvents(
  accessToken: string
): Promise<{ success: boolean; eventsDeleted: number; totalFound: number }> {
  const response = await fetch('/api/google?action=delete-wotd-events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete events');
  }

  return response.json();
}

// List user's Google calendars
export async function listGoogleCalendars(
  accessToken: string
): Promise<{ calendars: { id: string; name: string; primary: boolean; color: string }[] }> {
  const response = await fetch('/api/google?action=list-calendars', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to list calendars');
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
  const response = await fetch('/api/google?action=create-task', {
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
  const response = await fetch('/api/google?action=list-events', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to list events');
  }

  return response.json();
}
