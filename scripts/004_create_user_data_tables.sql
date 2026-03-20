-- Create liked_songs table
CREATE TABLE IF NOT EXISTS public.liked_songs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id text NOT NULL,
  track_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Create recently_played table
CREATE TABLE IF NOT EXISTS public.recently_played (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id text NOT NULL,
  track_data jsonb NOT NULL,
  played_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  tracks jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "liked_songs_select_own" ON public.liked_songs;
DROP POLICY IF EXISTS "liked_songs_insert_own" ON public.liked_songs;
DROP POLICY IF EXISTS "liked_songs_delete_own" ON public.liked_songs;
DROP POLICY IF EXISTS "recently_played_select_own" ON public.recently_played;
DROP POLICY IF EXISTS "recently_played_insert_own" ON public.recently_played;
DROP POLICY IF EXISTS "recently_played_update_own" ON public.recently_played;
DROP POLICY IF EXISTS "recently_played_delete_own" ON public.recently_played;
DROP POLICY IF EXISTS "playlists_select_own" ON public.playlists;
DROP POLICY IF EXISTS "playlists_insert_own" ON public.playlists;
DROP POLICY IF EXISTS "playlists_update_own" ON public.playlists;
DROP POLICY IF EXISTS "playlists_delete_own" ON public.playlists;

-- Liked songs policies - users can only access their own data
CREATE POLICY "liked_songs_select_own" ON public.liked_songs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "liked_songs_insert_own" ON public.liked_songs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "liked_songs_delete_own" ON public.liked_songs FOR DELETE USING (auth.uid() = user_id);

-- Recently played policies - users can only access their own data
CREATE POLICY "recently_played_select_own" ON public.recently_played FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recently_played_insert_own" ON public.recently_played FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recently_played_update_own" ON public.recently_played FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recently_played_delete_own" ON public.recently_played FOR DELETE USING (auth.uid() = user_id);

-- Playlists policies - users can only access their own data
CREATE POLICY "playlists_select_own" ON public.playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playlists_insert_own" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_update_own" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "playlists_delete_own" ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON public.liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_user_id ON public.recently_played(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
