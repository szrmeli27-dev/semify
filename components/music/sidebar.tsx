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
import { Home, Search, Library, Plus, Heart, Clock, ListMusic, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserProfile } from './user-profile'

export function Sidebar({ activeTab, onTabChange, selectedPlaylistId, onPlaylistSelect }: any) {
  // ✅ DÜZELTİLDİ: setPlaylists kaldırıldı, createPlaylist hook'u kullanılıyor
  const { playlists, likedSongs, recentlyPlayed, createPlaylist } = useMusicPlayer()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || isCreating) return
    setIsCreating(true)
    // createPlaylist hem Supabase'e yazar hem state'i günceller (tracks: [] ile)
    await createPlaylist(newPlaylistName.trim())
    setNewPlaylistName('')
    setIsDialogOpen(false)
    setIsCreating(false)
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <Music2 className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">Semify</span>
        </div>
      </div>

      {/* Ana Navigasyon */}
      <nav className="px-3 mb-4 space-y-0.5">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 h-10 px-3 font-medium',
            activeTab === 'home' && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
          onClick={() => onTabChange('home')}
        >
          <Home className="w-5 h-5" />
          Ana Sayfa
        </Button>

        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 h-10 px-3 font-medium',
            activeTab === 'search' && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
          onClick={() => onTabChange('search')}
        >
          <Search className="w-5 h-5" />
          Ara
        </Button>
      </nav>

      {/* Kütüphane */}
      <div className="flex-1 flex flex-col overflow-hidden px-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <Button
            variant="ghost"
            className={cn(
              'justify-start gap-3 h-10 px-2 font-medium flex-1',
              activeTab === 'library' && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
            onClick={() => onTabChange('library')}
          >
            <Library className="w-5 h-5" />
            Kütüphanem
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="Yeni çalma listesi oluştur"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Yeni Çalma Listesi</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                <Input
                  placeholder="Liste adı..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim() || isCreating}
                  >
                    {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1 -mx-1">
          <div className="px-1 pb-4 space-y-0.5">
            {/* Beğenilen Şarkılar */}
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 h-10 px-2 font-normal',
                activeTab === 'liked' && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
              onClick={() => onTabChange('liked')}
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm truncate w-full">Beğenilen Şarkılar</span>
                {likedSongs && likedSongs.length > 0 && (
                  <span className="text-xs text-muted-foreground">{likedSongs.length} şarkı</span>
                )}
              </div>
            </Button>

            {/* Son Dinlenenler */}
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 h-10 px-2 font-normal',
                activeTab === 'recent' && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
              onClick={() => onTabChange('recent')}
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm truncate w-full">Son Dinlenenler</span>
                {recentlyPlayed && recentlyPlayed.length > 0 && (
                  <span className="text-xs text-muted-foreground">{recentlyPlayed.length} şarkı</span>
                )}
              </div>
            </Button>

            {/* Çalma Listeleri */}
            {playlists && playlists.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 pb-1.5 font-medium">
                  Çalma Listelerim
                </p>
                {playlists.map((playlist: any) => (
                  <Button
                    key={playlist.id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 h-10 px-2 font-normal',
                      selectedPlaylistId === playlist.id && activeTab === 'playlist' &&
                        'bg-sidebar-accent text-sidebar-accent-foreground'
                    )}
                    onClick={() => {
                      onPlaylistSelect(playlist.id)
                      onTabChange('playlist')
                    }}
                  >
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0">
                      <ListMusic className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm truncate w-full">{playlist.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Array.isArray(playlist.tracks) ? playlist.tracks.length : 0} şarkı
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Hiç çalma listesi yoksa */}
            {(!playlists || playlists.length === 0) && (
              <div className="px-2 pt-3">
                <p className="text-xs text-muted-foreground text-center py-4 leading-relaxed">
                  Henüz çalma listen yok.
                  <br />
                  <button
                    className="text-primary hover:underline mt-1 inline-block"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    İlk listeni oluştur →
                  </button>
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Alt — Kullanıcı Profili */}
      <div className="border-t border-sidebar-border p-3">
        <UserProfile />
      </div>
    </aside>
  )
}
