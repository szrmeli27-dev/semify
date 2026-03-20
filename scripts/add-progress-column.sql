-- Add current_progress column to party_rooms table for syncing playback position
ALTER TABLE party_rooms ADD COLUMN IF NOT EXISTS current_progress real DEFAULT 0;
