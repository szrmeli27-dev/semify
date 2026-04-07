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
  ListMusic,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserProfile } from './user-profile'

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist'

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
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-sidebar-foreground">Semify</span>
        </div>

        <nav className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-4 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              activeTab === 'home' && "bg-sidebar-accent text-sidebar-foreground"
            )}
            onClick={() => onTabChange('home')}
          >
            <Home className="w-5 h-5" />
            Ana Sayfa
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-4 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              activeTab === 'search' && "bg-sidebar-accent text-sidebar-foreground"
            )}
            onClick={() => onTabChange('search')}
          >
            <Search className="w-5 h-5" />
            Ara
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-4 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              activeTab === 'library' && "bg-sidebar-accent text-sidebar-foreground"
            )}
            onClick={() => onTabChange('library')}
          >
            <Library className="w-5 h-5" />
            Kitaplığın
          </Button>
        </nav>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 mb-2 flex items-center justify-between text-sidebar-foreground/50">
          <p className="text-xs font-semibold uppercase tracking-wider px-2">Çalma Listelerin</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon\" className="h-8 w-8 hover:text-sidebar-foreground">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Çalma Listesi Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Liste adı"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <Button className="w-full" onClick={handleCreatePlaylist}>Oluştur</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-14 px-3 text-sidebar-foreground hover:text-sidebar-foreground",
                activeTab === 'liked' && "bg-sidebar-accent"
              )}
              onClick={() => onTabChange('liked')}
            >
              <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Beğenilen Şarkılar</p>
                <p className="text-xs text-muted-foreground">{likedSongs.length} şarkı</p>
              </div>
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-14 px-3 text-sidebar-foreground hover:text-sidebar-foreground",
                activeTab === 'recent' && "bg-sidebar-accent"
              )}
              onClick={() => onTabChange('recent')}
            >
              <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Son Çalınanlar</p>
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
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <UserProfile />
      </div>
    </aside>
  )
}