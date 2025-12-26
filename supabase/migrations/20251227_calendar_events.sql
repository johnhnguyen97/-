-- User calendar events for custom events and vocabulary-linked events
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'custom' CHECK (event_type IN ('custom', 'study_session', 'review', 'word_review', 'kanji_review')),
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT true,
  linked_word TEXT,
  linked_kanji TEXT,
  google_event_id TEXT,
  sync_status TEXT DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending_sync', 'sync_error')),
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON user_calendar_events;

-- Policies
CREATE POLICY "Users can view own calendar events"
  ON user_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events"
  ON user_calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON user_calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON user_calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON user_calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON user_calendar_events(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google ON user_calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;
