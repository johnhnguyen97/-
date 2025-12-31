// User Stats API service

export interface UserStats {
  wordsLearned: number;
  drillsCompleted: number;
  accuracy: number;
  streak: number;
  longestStreak: number;
  todayMinutes: number;
  todayDrills: number;
  weeklyProgress: number;
  daysActiveThisWeek: number;
}

export interface WeeklyActivity {
  activity_date: string;
  activity_type: string;
  count: number;
}

export interface UserStatsResponse {
  stats: UserStats;
  weeklyActivity: WeeklyActivity[];
  activeDays: string[];
}

const API_BASE = '/api/user-stats';

export async function getUserStats(accessToken: string): Promise<UserStatsResponse> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }

  return response.json();
}

export async function recordDrill(
  accessToken: string,
  correct: number,
  incorrect: number
): Promise<void> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'record_drill',
      data: { correct, incorrect },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to record drill');
  }
}

export async function recordActivity(
  accessToken: string,
  type: 'word_game' | 'pattern_drill' | 'radical' | 'calendar' | 'kanji',
  minutes?: number
): Promise<void> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'record_activity',
      data: { type, minutes },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to record activity');
  }
}
