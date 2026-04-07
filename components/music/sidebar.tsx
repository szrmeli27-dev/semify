"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Home, Search, Library, Plus, Heart, Clock, ListMusic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserProfile } from './user-profile'

export function Sidebar({ activeTab, onTabChange, selectedPlaylistId, onPlaylistSelect }: any) {
  const { playlists, likedSongs, recentlyPlayed, setPlaylists } = useMusicPlayer()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('playlists')
      .insert([{ name: newPlaylistName.trim(), user_id: user.id }])
      .select()

    if (!error && data) {
      // Yerel listeyi güncelle
      setPlaylists([...playlists, { ...data[0], tracks: [] }])
      setNewPlaylistName('')
      setIsDialogOpen(false)
    } else {
      alert("Liste oluşturulamadı: " + error?.message)
    }
  }

  return (
    // ... (Geri kalan JSX kodun aynı kalıyor, sadece handleCreatePlaylist artık veritabanına yazıyor)
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* ... mevcut sidebar içeriğin ... */}
      {/* handleCreatePlaylist fonksiyonunu çağıran Buton ve Input kısımları aynı kalacak */}
    </aside>
  )
}