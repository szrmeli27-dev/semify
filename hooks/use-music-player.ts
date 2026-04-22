"use client"

import { create } from 'zustand'
import { Track } from '@/types/music'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── userId cache — her seferinde auth isteği atmayı önler ──
let _cachedUserId: string | null = null
async function getUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId
  const { data } = await supabase.auth.getUser()
  _cachedUserId = data.user?.id ?? null
  return _cachedUserId
}

// Auth değişince cache'i temizle
supabase.auth.onAuthStateChange((event, session) => {
  _cachedUserId = session?.user?.id ?? null
})

// ── now_playing tablosuna yazar (OtCord entegrasyonu) ──
async function syncNowPlaying(
  userId: string,
  track: Track | null,
  progress: number,
  duration: number,
  isPlaying: boolean
) {
  if (!track) {
    await supabase.from('now_playing').delete().eq('user_id', userId)
    return
  }
  await supabase.from('now_playing').upsert({
    user_id: userId,
    track_id: track.id,
    track_data: track,
    progress,
    duration,
    is_playing: isPlaying,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

// ── 3 saniyede bir otomatik sync (progress takibi için) ──
let _syncInterval: ReturnType<typeof setInterval> | null = null

function startProgressSync(getState: () => { currentTrack: Track | null, progress: number, duration: number, isPlaying: boolean }) {
  if (_syncInterval) clearInterval(_syncInterval)
  _syncInterval = setInterval(async () => {
    const userId = await getUserId()
    if (!userId) return
    const { currentTrack, progress, duration, isPlaying } = getState()
    if (!currentTrack) return
    syncNowPlaying(userId, currentTrack, progress, duration, isPlaying)
  }, 3000)
}

function stopProgressSync() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null }
}

interface Playlist {
  id: string
  name: string
  tracks: Track[]
}

interface MusicPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  queue: Track[]
  currentIndex: number
  likedSongs: Track[]
  recentlyPlayed: Track[]
  playlists: Playlist[]
  isLoaded: boolean
  // ✅ YENİ: Döngü (repeat) state'i
  isRepeat: boolean

  loadUserData: () => Promise<void>
  setCurrentTrack: (track: Track) => void
  playTrack: (track: Track, queue?: Track[]) => Promise<void>
  togglePlay: () => Promise<void>
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  addToQueue: (track: Track) => void
  clearQueue: () => void
  toggleLike: (track: Track) => void
  isLiked: (id: string) => boolean
  addToRecentlyPlayed: (track: Track) => void
  createPlaylist: (name: string) => Promise<void>
  deletePlaylist: (playlistId: string) => Promise<void>
  setPlaylists: (playlists: Playlist[]) => void
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
  // ✅ YENİ: Döngü toggle fonksiyonu
  toggleRepeat: () => void
}

// tracks alanının her zaman dizi olmasını garantile
function safeTracks(raw: any): Track[] {
  return Array.isArray(raw) ? raw : []
}

export const useMusicPlayer = create<MusicPlayerState>()((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  likedSongs: [],
  recentlyPlayed: [],
  playlists: [],
  isLoaded: false,
  // ✅ YENİ: Başlangıçta döngü kapalı
  isRepeat: false,

  loadUserData: async () => {
    const userId = await getUserId()
    if (!userId) {
      set({ isLoaded: true })
      return
    }

    const [likedRes, recentRes, playlistRes] = await Promise.all([
      supabase
        .from('liked_songs')
        .select('track_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('recently_played')
        .select('track_data')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(20),
      supabase
        .from('playlists')
        .select('id, name, tracks')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ])

    set({
      likedSongs: (likedRes.data ?? []).map((r: any) => r.track_data as Track),
      recentlyPlayed: (recentRes.data ?? []).map((r: any) => r.track_data as Track),
      playlists: (playlistRes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        tracks: safeTracks(r.tracks),
      })),
      isLoaded: true,
    })
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),

  playTrack: async (track, queue) => {
    get().addToRecentlyPlayed(track)
    if (queue) {
      const index = queue.findIndex((t) => t.id === track.id)
      set({
        currentTrack: track,
        isPlaying: true,
        queue,
        currentIndex: index >= 0 ? index : 0,
        progress: 0,
      })
    } else {
      set({ currentTrack: track, isPlaying: true, progress: 0 })
    }
    const userId = await getUserId()
    if (userId) {
      const { duration } = get()
      syncNowPlaying(userId, track, 0, duration, true)
      startProgressSync(() => get())
    }
  },

  togglePlay: async () => {
    set((s) => ({ isPlaying: !s.isPlaying }))
    const userId = await getUserId()
    if (userId) {
      const { currentTrack, progress, duration, isPlaying } = get()
      syncNowPlaying(userId, currentTrack, progress, duration, isPlaying)
      if (isPlaying) {
        startProgressSync(() => get())
      } else {
        stopProgressSync()
      }
    }
  },
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  // ✅ DÜZELTİLDİ: isRepeat açıksa mevcut şarkıyı sıfırdan başlat
  nextTrack: async () => {
    const { queue, currentIndex, isRepeat, currentTrack } = get()
    if (isRepeat && currentTrack) {
      set({ progress: 0, isPlaying: true })
      const userId = await getUserId()
      if (userId) syncNowPlaying(userId, currentTrack, 0, get().duration, true)
      return
    }
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1
      const next = queue[nextIndex]
      get().addToRecentlyPlayed(next)
      set({ currentTrack: next, currentIndex: nextIndex, progress: 0 })
      const userId = await getUserId()
      if (userId) syncNowPlaying(userId, next, 0, 0, true)
    }
  },

  previousTrack: async () => {
    const { queue, currentIndex, progress } = get()
    if (progress > 3) { set({ progress: 0 }); return }
    if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prev = queue[prevIndex]
      set({ currentTrack: prev, currentIndex: prevIndex, progress: 0 })
      const userId = await getUserId()
      if (userId) syncNowPlaying(userId, prev, 0, 0, true)
    }
  },

  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  clearQueue: () => set({ queue: [], currentIndex: 0 }),

  // ✅ YENİ: Döngüyü aç/kapat
  toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),

  toggleLike: async (track) => {
    const userId = await getUserId()
    const { likedSongs } = get()
    const alreadyLiked = likedSongs.some((t) => t.id === track.id)
    if (alreadyLiked) {
      set({ likedSongs: likedSongs.filter((t) => t.id !== track.id) })
      if (userId)
        await supabase
          .from('liked_songs')
          .delete()
          .eq('user_id', userId)
          .eq('track_id', track.id)
    } else {
      set({ likedSongs: [track, ...likedSongs] })
      if (userId)
        await supabase.from('liked_songs').upsert({
          user_id: userId,
          track_id: track.id,
          track_data: track,
        })
    }
  },

  isLiked: (id) => get().likedSongs.some((t) => t.id === id),

  addToRecentlyPlayed: async (track) => {
    const userId = await getUserId()
    set((s) => {
      const filtered = s.recentlyPlayed.filter((t) => t.id !== track.id)
      return { recentlyPlayed: [track, ...filtered].slice(0, 20) }
    })
    if (userId) {
      await supabase.from('recently_played').upsert(
        {
          user_id: userId,
          track_id: track.id,
          track_data: track,
          played_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,track_id' }
      )
    }
  },

  createPlaylist: async (name) => {
    const userId = await getUserId()
    if (!userId) return
    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name, tracks: [] })
      .select('id, name, tracks')
      .single()
    if (data && !error) {
      set((s) => ({
        playlists: [
          ...s.playlists,
          { id: data.id, name: data.name, tracks: [] },
        ],
      }))
    }
  },

  // ✅ YENİ: Çalma listesi silme
  deletePlaylist: async (playlistId) => {
    const userId = await getUserId()
    if (!userId) return

    // Önce UI'dan kaldır (optimistic)
    const { playlists } = get()
    set({ playlists: playlists.filter((p) => p.id !== playlistId) })

    // Supabase'den sil
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId)

    if (error) {
      console.error('deletePlaylist Supabase hatası:', error)
      // Hata olursa geri al
      set({ playlists })
    }
  },

  setPlaylists: (playlists) => set({ playlists }),

  addToPlaylist: async (playlistId, track) => {
    const { playlists } = get()
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) {
      console.error('addToPlaylist: playlist bulunamadı', playlistId)
      return
    }

    const currentTracks = safeTracks(playlist.tracks)

    if (currentTracks.some((t) => t.id === track.id)) return

    const newTracks = [...currentTracks, track]

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? { ...p, tracks: newTracks } : p
      ),
    })

    const { error } = await supabase
      .from('playlists')
      .update({ tracks: newTracks })
      .eq('id', playlistId)

    if (error) {
      console.error('addToPlaylist Supabase hatası:', error)
      set({
        playlists: playlists.map((p) =>
          p.id === playlistId ? { ...p, tracks: currentTracks } : p
        ),
      })
    }
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    const { playlists } = get()
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return

    const currentTracks = safeTracks(playlist.tracks)
    const newTracks = currentTracks.filter((t) => t.id !== trackId)

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? { ...p, tracks: newTracks } : p
      ),
    })

    const { error } = await supabase
      .from('playlists')
      .update({ tracks: newTracks })
      .eq('id', playlistId)

    if (error) {
      console.error('removeFromPlaylist Supabase hatası:', error)
      set({
        playlists: playlists.map((p) =>
          p.id === playlistId ? { ...p, tracks: currentTracks } : p
        ),
      })
    }
  },
}))
