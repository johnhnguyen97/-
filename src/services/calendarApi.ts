// Calendar API service for frontend
import type { DailyCalendarData, CalendarSettings, LearnedItem, JLPTLevel } from '../types/calendar';

const API_BASE = '/api/calendar';

// Get daily calendar data (word of the day, kanji, holidays)
export async function getDailyData(accessToken: string): Promise<DailyCalendarData> {
  const response = await fetch(`${API_BASE}?action=daily`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch daily data' }));
    throw new Error(error.error || 'Failed to fetch daily data');
  }

  return response.json();
}

// Get user's calendar settings
export async function getSettings(accessToken: string): Promise<CalendarSettings> {
  const response = await fetch(`${API_BASE}?action=settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch settings' }));
    throw new Error(error.error || 'Failed to fetch settings');
  }

  return response.json();
}

// Update user's JLPT level
export async function updateSettings(
  accessToken: string,
  options: { jlptLevel?: JLPTLevel; generateIcalToken?: boolean }
): Promise<CalendarSettings> {
  const response = await fetch(`${API_BASE}?action=settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update settings' }));
    throw new Error(error.error || 'Failed to update settings');
  }

  return response.json();
}

// Get all learned items
export async function getLearnedItems(
  accessToken: string,
  options?: { itemType?: 'word' | 'kanji'; jlptLevel?: JLPTLevel }
): Promise<{ items: LearnedItem[] }> {
  const params = new URLSearchParams();
  params.set('action', 'learned');
  if (options?.itemType) params.set('itemType', options.itemType);
  if (options?.jlptLevel) params.set('jlptLevel', options.jlptLevel);

  const url = `${API_BASE}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch learned items' }));
    throw new Error(error.error || 'Failed to fetch learned items');
  }

  return response.json();
}

// Mark item as learned
export async function markAsLearned(
  accessToken: string,
  item: {
    itemType: 'word' | 'kanji';
    itemKey: string;
    reading?: string;
    meaning: string;
    jlptLevel?: JLPTLevel;
  }
): Promise<LearnedItem> {
  const response = await fetch(`${API_BASE}?action=learned`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to mark as learned' }));
    throw new Error(error.error || 'Failed to mark as learned');
  }

  return response.json();
}

// Remove learned status
export async function removeLearnedStatus(
  accessToken: string,
  itemType: 'word' | 'kanji',
  itemKey: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}?action=learned`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ itemType, itemKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove learned status' }));
    throw new Error(error.error || 'Failed to remove learned status');
  }

  return response.json();
}

// Generate iCal subscription URL
export function getIcalUrl(token: string): string {
  // Use window.location.origin in browser, or fallback
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://gojun.vercel.app';
  return `${baseUrl}/api/calendar?action=ical&token=${encodeURIComponent(token)}`;
}
