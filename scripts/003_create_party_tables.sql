-- Create party_rooms table
CREATE TABLE IF NOT EXISTS public.party_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code varchar(6) UNIQUE NOT NULL,
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  host_name text,
  current_track jsonb,
  is_playing boolean DEFAULT false,
  current_time_seconds float DEFAULT 0,
  queue jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create party_members table
CREATE TABLE IF NOT EXISTS public.party_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code varchar(6) REFERENCES public.party_rooms(code) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(room_code, user_id)
);

-- Enable RLS
ALTER TABLE public.party_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "party_rooms_select" ON public.party_rooms;
DROP POLICY IF EXISTS "party_rooms_insert" ON public.party_rooms;
DROP POLICY IF EXISTS "party_rooms_update" ON public.party_rooms;
DROP POLICY IF EXISTS "party_rooms_delete" ON public.party_rooms;
DROP POLICY IF EXISTS "party_members_select" ON public.party_members;
DROP POLICY IF EXISTS "party_members_insert" ON public.party_members;
DROP POLICY IF EXISTS "party_members_delete" ON public.party_members;

-- Party rooms policies - anyone can select, only host can modify
CREATE POLICY "party_rooms_select" ON public.party_rooms FOR SELECT USING (true);
CREATE POLICY "party_rooms_insert" ON public.party_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "party_rooms_update" ON public.party_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "party_rooms_delete" ON public.party_rooms FOR DELETE USING (auth.uid() = host_id);

-- Party members policies - anyone can select/insert/delete their own
CREATE POLICY "party_members_select" ON public.party_members FOR SELECT USING (true);
CREATE POLICY "party_members_insert" ON public.party_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "party_members_delete" ON public.party_members FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_party_rooms_code ON public.party_rooms(code);
CREATE INDEX IF NOT EXISTS idx_party_members_room_code ON public.party_members(room_code);
