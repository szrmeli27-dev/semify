"use client"

import { useState } from 'react'
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
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Heart, 
  Clock,
  Music2,
  ListMusic,
  PartyPopper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserProfile } from './user-profile'

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist' | 'party'

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  selectedPlaylistId?: string
  onPlaylistSelect?: (id: string) => void
}

export function Sidebar({ activeTab, onTabChange, selectedPlaylistId, onPlaylistSelect }: SidebarProps) {
  const { playlists, likedSongs, recentlyPlayed, createPlaylist } = useMusicPlayer()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim())
      setNewPlaylistName('')
      setIsDialogOpen(false)
    }
  }

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border">
      {/* User Profile - Sol Ust Kose */}
      <UserProfile />

      {/* Logo */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Music2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground tracking-tight">Semify</span>
        </div>
      </div>

      {/* Ana Menü */}
      <nav className="px-3 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-4 h-12 px-4 text-sidebar-foreground hover:text-sidebar-foreground font-medium",
            activeTab === 'home' && "bg-sidebar-accent text-sidebar-primary"
          )}
          onClick={() => onTabChange('home')}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Ana Sayfa</span>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-4 h-12 px-4 text-sidebar-foreground hover:text-sidebar-foreground",
            activeTab === 'search' && "bg-sidebar-accent text-sidebar-primary"
          )}
          onClick={() => onTabChange('search')}
        >
          <Search className="w-5 h-5" />
          <span className="font-medium">Ara</span>
        </Button>

        {/* Parti Odası */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-4 h-12 px-4 text-sidebar-foreground hover:text-sidebar-foreground",
            activeTab === 'party' && "bg-sidebar-accent text-sidebar-primary"
          )}
          onClick={() => onTabChange('party')}
        >
          <PartyPopper className="w-5 h-5" />
          <span className="font-medium">Parti Odası</span>
        </Button>
      </nav>

      {/* Kütüphane */}
      <div className="mt-6 flex-1 flex flex-col min-h-0">
        <div className="px-4 flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            className={cn(
              "justify-start gap-3 px-2 h-10 text-sidebar-foreground hover:text-sidebar-foreground",
              activeTab === 'library' && "text-sidebar-primary"
            )}
            onClick={() => onTabChange('library')}
          >
            <Library className="w-5 h-5" />
            <span className="font-medium">Kitaplığın</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-sidebar-foreground">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Çalma Listesi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Çalma listesi adı"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <Button onClick={handleCreatePlaylist} className="w-full">
                  Oluştur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {/* Beğenilen Şarkılar */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-14 px-3 text-sidebar-foreground hover:text-sidebar-foreground",
                activeTab === 'liked' && "bg-sidebar-accent"
              )}
              onClick={() => onTabChange('liked')}
            >
              <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium truncate text-sm">Beğenilen Şarkılar</p>
                <p className="text-xs text-muted-foreground">{likedSongs.length} şarkı</p>
              </div>
            </Button>

            {/* Son Dinlenenler */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-14 px-3 text-sidebar-foreground hover:text-sidebar-foreground",
                activeTab === 'recent' && "bg-sidebar-accent"
              )}
              onClick={() => onTabChange('recent')}
            >
              <div className="w-10 h-10 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium truncate text-sm">Son Dinlenenler</p>
                <p className="text-xs text-muted-foreground">{recentlyPlayed.length} şarkı</p>
              </div>
            </Button>

            {/* Kullanıcı Çalma Listeleri */}
            {playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-14 px-3 text-sidebar-foreground hover:text-sidebar-foreground",
                  activeTab === 'playlist' && selectedPlaylistId === playlist.id && "bg-sidebar-accent"
                )}
                onClick={() => {
                  onTabChange('playlist')
                  onPlaylistSelect?.(playlist.id)
                }}
              >
                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                  {playlist.tracks[0] ? (
                    <img 
                      src={playlist.tracks[0].thumbnail} 
                      alt="" 
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    <ListMusic className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium truncate text-sm">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">{playlist.tracks.length} şarkı</p>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
