"use client"

import { useEffect } from 'react'
import { useThemeStore } from '@/hooks/use-theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // ✅ DÜZELTİLDİ: Sadece isDark kullanılıyor, siyah (black) tema kaldırıldı
  const { isDark } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    // Tüm tema class'larını temizle, sadece light/dark bırak
    root.classList.remove('dark', 'light', 'black')
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
  }, [isDark])

  return <>{children}</>
}
