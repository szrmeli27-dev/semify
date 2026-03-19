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
  
  // Actions
  setCurrentTrack: (track: Track) => void
  playTrack: (track: Track, queue?: Track[]) => void
  togglePlay: () => void
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

      setCurrentTrack: (track) => set({ currentTrack: track }),
      
      playTrack: (track, queue) => {
        const state = get()
        state.addToRecentlyPlayed(track)
        
        if (queue) {
          const index = queue.findIndex(t => t.id === track.id)
          set({ 
            currentTrack: track, 
            isPlaying: true, 
            queue,
            currentIndex: index >= 0 ? index : 0,
            progress: 0
          })
        } else {
          set({ 
            currentTrack: track, 
            isPlaying: true,
            progress: 0
          })
        }
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setVolume: (volume) => set({ volume }),
      
      setProgress: (progress) => set({ progress }),
      
      setDuration: (duration) => set({ duration }),

      nextTrack: () => {
        const { queue, currentIndex } = get()
        if (queue.length > 0 && currentIndex < queue.length - 1) {
          const nextIndex = currentIndex + 1
          const nextTrack = queue[nextIndex]
          get().addToRecentlyPlayed(nextTrack)
          set({ 
            currentTrack: nextTrack, 
            currentIndex: nextIndex,
            progress: 0
          })
        }
      },

      previousTrack: () => {
        const { queue, currentIndex, progress } = get()
        // Eğer şarkının başında değilsek, şarkıyı başa sar
        if (progress > 3) {
          set({ progress: 0 })
          return
        }
        // Önceki şarkıya geç
        if (queue.length > 0 && currentIndex > 0) {
          const prevIndex = currentIndex - 1
          const prevTrack = queue[prevIndex]
          set({ 
            currentTrack: prevTrack, 
            currentIndex: prevIndex,
            progress: 0
          })
        }
      },

      addToQueue: (track) => set((state) => ({ 
        queue: [...state.queue, track] 
      })),

      clearQueue: () => set({ queue: [], currentIndex: 0 }),

      toggleLike: (track) => set((state) => {
        const isCurrentlyLiked = state.likedSongs.some(t => t.id === track.id)
        if (isCurrentlyLiked) {
          return { likedSongs: state.likedSongs.filter(t => t.id !== track.id) }
        } else {
          return { likedSongs: [track, ...state.likedSongs] }
        }
      }),

      isLiked: (id) => get().likedSongs.some(t => t.id === id),

      addToRecentlyPlayed: (track) => set((state) => {
        const filtered = state.recentlyPlayed.filter(t => t.id !== track.id)
        return { recentlyPlayed: [track, ...filtered].slice(0, 20) }
      }),

      createPlaylist: (name) => set((state) => ({
        playlists: [
          ...state.playlists,
          { id: Date.now().toString(), name, tracks: [] }
        ]
      })),

      addToPlaylist: (playlistId, track) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { ...p, tracks: [...p.tracks.filter(t => t.id !== track.id), track] }
            : p
        )
      })),

      removeFromPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
            : p
        )
      })),
    }),
    {
      name: 'semify-storage',
      partialize: (state) => ({
        likedSongs: state.likedSongs,
        recentlyPlayed: state.recentlyPlayed,
        playlists: state.playlists,
        volume: state.volume,
      }),
    }
  )
)
