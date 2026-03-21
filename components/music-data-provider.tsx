"use client"

import { useEffect } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'

export function MusicDataProvider({ children }: { children: React.ReactNode }) {
  const loadUserData = useMusicPlayer((s) => s.loadUserData)

  useEffect(() => {
    // Load user data from localStorage on mount
    loadUserData()
  }, [loadUserData])

  return <>{children}</>
}
