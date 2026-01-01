-- User calendar tasks for learning goals and vocabulary-linked tasks
CREATE TABLE IF NOT EXISTS user_calendar_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  task_type TEXT NOT NULL DEFAULT 'custom' CHECK (task_type IN ('custom', 'learn_word', 'review_word', 'learn_kanji', 'grammar_study', 'srs_review')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  due_time TIME,
  reminder_minutes INTEGER,
  linked_word TEXT,
  linked_kanji TEXT,
  linked_jlpt_level TEXT CHECK (linked_jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  google_task_id TEXT,
  google_task_list_id TEXT,
  sync_status TEXT DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending_sync', 'sync_error')),
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_calendar_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calendar tasks" ON user_calendar_tasks;
DROP POLICY IF EXISTS "Users can insert own calendar tasks" ON user_calendar_tasks;
DROP POLICY IF EXISTS "Users can update own calendar tasks" ON user_calendar_tasks;
DROP POLICY IF EXISTS "Users can delete own calendar tasks" ON user_calendar_tasks;

-- Policies
CREATE POLICY "Users can view own calendar tasks"
  ON user_calendar_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar tasks"
  ON user_calendar_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar tasks"
  ON user_calendar_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar tasks"
  ON user_calendar_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user ON user_calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_due ON user_calendar_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_incomplete ON user_calendar_tasks(user_id) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_google ON user_calendar_tasks(google_task_id) WHERE google_task_id IS NOT NULL;
