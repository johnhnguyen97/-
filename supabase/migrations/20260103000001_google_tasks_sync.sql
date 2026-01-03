-- Google Tasks sync support
-- Add google_task_list_id to user_calendar_settings for caching the Gojun task list ID
ALTER TABLE user_calendar_settings ADD COLUMN IF NOT EXISTS google_task_list_id TEXT;

-- Add google_updated_at to user_calendar_tasks for conflict resolution
ALTER TABLE user_calendar_tasks ADD COLUMN IF NOT EXISTS google_updated_at TIMESTAMPTZ;

-- Index for efficient sync queries (pending sync or error status)
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_sync_pending
ON user_calendar_tasks(user_id, sync_status)
WHERE sync_status IN ('pending_sync', 'sync_error');
