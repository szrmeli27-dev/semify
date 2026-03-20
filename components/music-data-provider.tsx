"use client"

import { useEffect, type ReactNode } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'

interface MusicDataProviderProps {
  children: ReactNode
}

export function MusicDataProvider({ children }: MusicDataProviderProps) {
  const { loadUserData, isLoaded } = useMusicPlayer()

  useEffect(() => {
    if (!isLoaded) {
      loadUserData()
    }
  }, [loadUserData, isLoaded])

  return <>{children}</>
}
