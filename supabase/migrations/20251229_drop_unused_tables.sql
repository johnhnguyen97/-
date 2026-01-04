-- Drop unused tables from feature cleanup
-- These tables were created for features that have been removed:
-- - Flashcard/SRS system
-- - Workspace layouts
-- - User notes
-- NOTE: user_favorites is NOT dropped - it's still in use!

-- Drop tables in correct order (respecting foreign key dependencies)
-- DO NOT DROP user_favorites - it's used by the Favorites feature!
DROP TABLE IF EXISTS user_flashcards CASCADE;
DROP TABLE IF EXISTS user_srs_cards CASCADE;
DROP TABLE IF EXISTS user_workspace_layouts CASCADE;
DROP TABLE IF EXISTS user_workspace_settings CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;

-- Also drop any related policies (CASCADE should handle this, but being explicit)
-- The CASCADE keyword will automatically drop dependent policies
