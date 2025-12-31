import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    if (req.method === 'GET') {
      return handleGet(supabase, user.id, res);
    } else if (req.method === 'POST') {
      return handlePost(supabase, user.id, req.body, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGet(supabase: any, userId: string, res: VercelResponse) {
  const today = new Date().toISOString().split('T')[0];

  // Get or create user stats
  let { data: stats, error: statsError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (statsError && statsError.code === 'PGRST116') {
    // No stats yet, create initial record
    const { data: newStats, error: insertError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        today_date: today,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create stats:', insertError);
      return res.status(500).json({ error: 'Failed to create user stats' });
    }
    stats = newStats;
  } else if (statsError) {
    console.error('Stats fetch error:', statsError);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }

  // Check if we need to reset daily stats (new day)
  if (stats && stats.today_date !== today) {
    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 0;
    if (stats.last_activity_date === yesterdayStr) {
      // Consecutive day, increment streak
      newStreak = (stats.current_streak || 0) + 1;
    } else if (stats.last_activity_date === today) {
      // Already active today
      newStreak = stats.current_streak || 0;
    }
    // Otherwise streak resets to 0

    const longestStreak = Math.max(stats.longest_streak || 0, newStreak);

    // Reset daily stats for new day
    const { data: updatedStats, error: updateError } = await supabase
      .from('user_stats')
      .update({
        today_date: today,
        today_minutes: 0,
        today_drills: 0,
        today_correct: 0,
        today_incorrect: 0,
        current_streak: newStreak,
        longest_streak: longestStreak,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (!updateError) {
      stats = updatedStats;
    }
  }

  // Get weekly activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const { data: weeklyActivity } = await supabase
    .from('user_activity_log')
    .select('activity_date, activity_type, count')
    .eq('user_id', userId)
    .gte('activity_date', weekAgoStr)
    .order('activity_date', { ascending: true });

  // Get favorites count
  const { count: favoritesCount } = await supabase
    .from('user_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get learned items count
  const { count: learnedCount } = await supabase
    .from('user_learned_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Calculate accuracy
  const totalAnswers = (stats?.total_correct || 0) + (stats?.total_incorrect || 0);
  const accuracy = totalAnswers > 0
    ? Math.round((stats.total_correct / totalAnswers) * 100)
    : 0;

  // Calculate words learned (favorites + learned items)
  const wordsLearned = (favoritesCount || 0) + (learnedCount || 0);

  // Get days active this week (Mon-Sun)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().split('T')[0];

  const { data: thisWeekActivity } = await supabase
    .from('user_activity_log')
    .select('activity_date')
    .eq('user_id', userId)
    .gte('activity_date', mondayStr);

  // Get unique days this week
  const activeDaysThisWeek = new Set(
    (thisWeekActivity || []).map((a: { activity_date: string }) => a.activity_date)
  );
  const daysActiveThisWeek = activeDaysThisWeek.size;

  return res.status(200).json({
    stats: {
      wordsLearned,
      drillsCompleted: stats?.total_drills || 0,
      accuracy,
      streak: stats?.current_streak || 0,
      longestStreak: stats?.longest_streak || 0,
      todayMinutes: stats?.today_minutes || 0,
      todayDrills: stats?.today_drills || 0,
      weeklyProgress: Math.round((daysActiveThisWeek / 7) * 100),
      daysActiveThisWeek,
    },
    weeklyActivity: weeklyActivity || [],
    activeDays: Array.from(activeDaysThisWeek),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePost(supabase: any, userId: string, body: any, res: VercelResponse) {
  const { action, data } = body || {};
  const today = new Date().toISOString().split('T')[0];

  if (action === 'record_drill') {
    const { correct, incorrect } = data || {};
    const correctCount = correct || 0;
    const incorrectCount = incorrect || 0;
    const drillCount = 1;

    // Update stats
    const { error: updateError } = await supabase.rpc('increment_user_stats', {
      p_user_id: userId,
      p_today_date: today,
      p_drills: drillCount,
      p_correct: correctCount,
      p_incorrect: incorrectCount,
    });

    // If RPC doesn't exist, do it manually
    if (updateError) {
      // Get current stats
      let { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!stats) {
        // Create new stats
        await supabase.from('user_stats').insert({
          user_id: userId,
          today_date: today,
          today_drills: drillCount,
          today_correct: correctCount,
          today_incorrect: incorrectCount,
          total_drills: drillCount,
          total_correct: correctCount,
          total_incorrect: incorrectCount,
          current_streak: 1,
          last_activity_date: today,
        });
      } else {
        // Reset daily if needed
        const isNewDay = stats.today_date !== today;

        await supabase
          .from('user_stats')
          .update({
            today_date: today,
            today_drills: isNewDay ? drillCount : (stats.today_drills || 0) + drillCount,
            today_correct: isNewDay ? correctCount : (stats.today_correct || 0) + correctCount,
            today_incorrect: isNewDay ? incorrectCount : (stats.today_incorrect || 0) + incorrectCount,
            total_drills: (stats.total_drills || 0) + drillCount,
            total_correct: (stats.total_correct || 0) + correctCount,
            total_incorrect: (stats.total_incorrect || 0) + incorrectCount,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
    }

    // Log activity
    await supabase
      .from('user_activity_log')
      .upsert({
        user_id: userId,
        activity_date: today,
        activity_type: 'drill',
        count: drillCount,
      }, {
        onConflict: 'user_id,activity_date,activity_type',
      });

    return res.status(200).json({ success: true });
  }

  if (action === 'record_activity') {
    const { type, minutes } = data || {};

    // Log activity type
    if (type) {
      await supabase
        .from('user_activity_log')
        .upsert({
          user_id: userId,
          activity_date: today,
          activity_type: type,
          count: 1,
        }, {
          onConflict: 'user_id,activity_date,activity_type',
        });
    }

    // Update minutes if provided
    if (minutes && minutes > 0) {
      const { data: stats } = await supabase
        .from('user_stats')
        .select('today_date, today_minutes')
        .eq('user_id', userId)
        .single();

      const isNewDay = !stats || stats.today_date !== today;
      const newMinutes = isNewDay ? minutes : (stats?.today_minutes || 0) + minutes;

      await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          today_date: today,
          today_minutes: newMinutes,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
