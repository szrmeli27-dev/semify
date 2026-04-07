"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMusicPlayer } from '@/hooks/use-music-player'

const supabase = createClient()

export function MusicDataProvider({ children }: { children: React.ReactNode }) {
  const loadUserData = useMusicPlayer((s) => s.loadUserData)

  useEffect(() => {
    loadUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadUserData()
      }
      if (event === 'SIGNED_OUT') {
        useMusicPlayer.setState({
          likedSongs:     [],
          recentlyPlayed: [],
          playlists:      [],
          isLoaded:       false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserData])

  return <>{children}</>
}