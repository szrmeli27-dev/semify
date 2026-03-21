"use client"

import { create } from 'zustand'
import { Track } from '@/types/music'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
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
  playlists: { id: string; name: string; tracks: Track[] }[]
  isLoaded: boolean

  loadUserData: () => Promise<void>
  setCurrentTrack: (track: Track) => void
  playTrack: (track: Track, queue?: Track[]) => void
  togglePlay: () => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  nextTrack: () => void
  previousTrack: () => void
  addToQueue: (track: Track) => void
  clearQueue: () => void
  toggleLike: (track: Track) => void
  isLiked: (id: string) => boolean
  addToRecentlyPlayed: (track: Track) => void
  createPlaylist: (name: string) => void
  addToPlaylist: (playlistId: string, track: Track) => void
  removeFromPlaylist: (playlistId: string, trackId: string) => void
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

  loadUserData: async () => {
    const userId = await getUserId()
    if (!userId) return

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
      likedSongs:     (likedRes.data    ?? []).map((r) => r.track_data as Track),
      recentlyPlayed: (recentRes.data   ?? []).map((r) => r.track_data as Track),
      playlists:      (playlistRes.data ?? []).map((r) => ({
        id: r.id, name: r.name, tracks: r.tracks as Track[],
      })),
      isLoaded: true,
    })
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),

  playTrack: (track, queue) => {
    get().addToRecentlyPlayed(track)
    if (queue) {
      const index = queue.findIndex((t) => t.id === track.id)
      set({ currentTrack: track, isPlaying: true, queue, currentIndex: index >= 0 ? index : 0, progress: 0 })
    } else {
      set({ currentTrack: track, isPlaying: true, progress: 0 })
    }
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume:   (volume)   => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  nextTrack: () => {
    const { queue, currentIndex } = get()
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1
      const next = queue[nextIndex]
      get().addToRecentlyPlayed(next)
      set({ currentTrack: next, currentIndex: nextIndex, progress: 0 })
    }
  },

  previousTrack: () => {
    const { queue, currentIndex, progress } = get()
    if (progress > 3) { set({ progress: 0 }); return }
    if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1
      set({ currentTrack: queue[prevIndex], currentIndex: prevIndex, progress: 0 })
    }
  },

  addToQueue:  (track) => set((s) => ({ queue: [...s.queue, track] })),
  clearQueue:  ()      => set({ queue: [], currentIndex: 0 }),

  toggleLike: async (track) => {
    const userId = await getUserId()
    const { likedSongs } = get()
    const alreadyLiked = likedSongs.some((t) => t.id === track.id)
    if (alreadyLiked) {
      set({ likedSongs: likedSongs.filter((t) => t.id !== track.id) })
      if (userId) await supabase.from('liked_songs').delete().eq('user_id', userId).eq('track_id', track.id)
    } else {
      set({ likedSongs: [track, ...likedSongs] })
      if (userId) await supabase.from('liked_songs').upsert({ user_id: userId, track_id: track.id, track_data: track })
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
      await supabase.from('recently_played').upsert({
        user_id: userId, track_id: track.id, track_data: track, played_at: new Date().toISOString(),
      })
    }
  },

  createPlaylist: async (name) => {
    const userId = await getUserId()
    if (!userId) return
    const { data } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name, tracks: [] })
      .select('id, name, tracks')
      .single()
    if (data) set((s) => ({ playlists: [...s.playlists, { id: data.id, name: data.name, tracks: [] }] }))
  },

  addToPlaylist: async (playlistId, track) => {
    const { playlists } = get()
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return
    const newTracks = [...playlist.tracks.filter((t) => t.id !== track.id), track]
    set({ playlists: playlists.map((p) => p.id === playlistId ? { ...p, tracks: newTracks } : p) })
    await supabase.from('playlists').update({ tracks: newTracks }).eq('id', playlistId)
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    const { playlists } = get()
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return
    const newTracks = playlist.tracks.filter((t) => t.id !== trackId)
    set({ playlists: playlists.map((p) => p.id === playlistId ? { ...p, tracks: newTracks } : p) })
    await supabase.from('playlists').update({ tracks: newTracks }).eq('id', playlistId)
  },
}))
