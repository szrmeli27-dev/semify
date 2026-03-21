"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Track } from '@/types/music'

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

  loadUserData: () => void
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

export const useMusicPlayer = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
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

      loadUserData: () => {
        // Data is automatically loaded by zustand persist middleware
        set({ isLoaded: true })
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
      setVolume: (volume) => set({ volume }),
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

      addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
      clearQueue: () => set({ queue: [], currentIndex: 0 }),

      toggleLike: (track) => {
        const { likedSongs } = get()
        const alreadyLiked = likedSongs.some((t) => t.id === track.id)
        if (alreadyLiked) {
          set({ likedSongs: likedSongs.filter((t) => t.id !== track.id) })
        } else {
          set({ likedSongs: [track, ...likedSongs] })
        }
      },

      isLiked: (id) => get().likedSongs.some((t) => t.id === id),

      addToRecentlyPlayed: (track) => {
        set((s) => {
          const filtered = s.recentlyPlayed.filter((t) => t.id !== track.id)
          return { recentlyPlayed: [track, ...filtered].slice(0, 20) }
        })
      },

      createPlaylist: (name) => {
        const id = `playlist-${Date.now()}`
        set((s) => ({ playlists: [...s.playlists, { id, name, tracks: [] }] }))
      },

      addToPlaylist: (playlistId, track) => {
        const { playlists } = get()
        const playlist = playlists.find((p) => p.id === playlistId)
        if (!playlist) return
        const newTracks = [...playlist.tracks.filter((t) => t.id !== track.id), track]
        set({ playlists: playlists.map((p) => p.id === playlistId ? { ...p, tracks: newTracks } : p) })
      },

      removeFromPlaylist: (playlistId, trackId) => {
        const { playlists } = get()
        const playlist = playlists.find((p) => p.id === playlistId)
        if (!playlist) return
        const newTracks = playlist.tracks.filter((t) => t.id !== trackId)
        set({ playlists: playlists.map((p) => p.id === playlistId ? { ...p, tracks: newTracks } : p) })
      },
    }),
    {
      name: 'semify-music-storage',
      partialize: (state) => ({
        likedSongs: state.likedSongs,
        recentlyPlayed: state.recentlyPlayed,
        playlists: state.playlists,
        volume: state.volume,
      }),
    }
  )
)
