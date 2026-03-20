-- Parti Odaları tablosu - Global erişim için
CREATE TABLE IF NOT EXISTS public.party_rooms (
  code TEXT PRIMARY KEY,
  host_id UUID NOT NULL,
  host_name TEXT NOT NULL,
  current_track JSONB,
  is_playing BOOLEAN DEFAULT false,
  queue JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parti üyeleri tablosu
CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES public.party_rooms(code) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_code, user_id)
);

-- Beğenilen şarkılar tablosu
CREATE TABLE IF NOT EXISTS public.liked_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  track_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Son dinlenenler tablosu
CREATE TABLE IF NOT EXISTS public.recently_played (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  track_data JSONB NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Çalma listeleri tablosu
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  tracks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS etkinleştir
ALTER TABLE public.party_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Parti Odaları için RLS politikaları (herkes görebilir ve katılabilir)
CREATE POLICY "party_rooms_select_all" ON public.party_rooms 
  FOR SELECT USING (true);

CREATE POLICY "party_rooms_insert_auth" ON public.party_rooms 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "party_rooms_update_host" ON public.party_rooms 
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "party_rooms_delete_host" ON public.party_rooms 
  FOR DELETE USING (auth.uid() = host_id);

-- Parti Üyeleri için RLS politikaları (herkes görebilir)
CREATE POLICY "party_members_select_all" ON public.party_members 
  FOR SELECT USING (true);

CREATE POLICY "party_members_insert_auth" ON public.party_members 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "party_members_update_own" ON public.party_members 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "party_members_delete_own" ON public.party_members 
  FOR DELETE USING (auth.uid() = user_id);

-- Beğenilen şarkılar için RLS politikaları
CREATE POLICY "liked_songs_select_own" ON public.liked_songs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "liked_songs_insert_own" ON public.liked_songs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "liked_songs_update_own" ON public.liked_songs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "liked_songs_delete_own" ON public.liked_songs 
  FOR DELETE USING (auth.uid() = user_id);

-- Son dinlenenler için RLS politikaları
CREATE POLICY "recently_played_select_own" ON public.recently_played 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recently_played_insert_own" ON public.recently_played 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recently_played_update_own" ON public.recently_played 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "recently_played_delete_own" ON public.recently_played 
  FOR DELETE USING (auth.uid() = user_id);

-- Çalma listeleri için RLS politikaları
CREATE POLICY "playlists_select_own" ON public.playlists 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "playlists_insert_own" ON public.playlists 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playlists_update_own" ON public.playlists 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "playlists_delete_own" ON public.playlists 
  FOR DELETE USING (auth.uid() = user_id);

-- Realtime için tabloları etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_members;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_party_members_room_code ON public.party_members(room_code);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON public.liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_user_id ON public.recently_played(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
