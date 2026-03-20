"use client"

import { useEffect, type ReactNode } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { createClient } from '@/lib/supabase/client'

interface MusicDataProviderProps {
  children: ReactNode
}

export function MusicDataProvider({ children }: MusicDataProviderProps) {
  const { loadUserData, isLoaded } = useMusicPlayer()

  useEffect(() => {
    const supabase = createClient()
    
    // Ilk yukleme
    if (!isLoaded) {
      loadUserData()
    }
    
    // Auth state degisikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Yeni giris yapildiginda verileri yukle
        // isLoaded kontrolu loadUserData icinde yapiliyor
        loadUserData()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUserData, isLoaded])

  return <>{children}</>
}
