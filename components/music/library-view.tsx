"use client"

import { useMusicPlayer } from '@/hooks/use-music-player'
import { Track } from '@/types/music'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Play, 
  Pause, 
  Heart, 
  Clock, 
  MoreHorizontal,
  ListPlus,
  Trash2,
  Plus,
  Shuffle
} from 'lucide-react'
import { cn } from '@/lib/utils'

type LibraryTab = 'liked' | 'recent' | 'playlist'

interface LibraryViewProps {
  tab: LibraryTab
  playlistId?: string
}

export function LibraryView({ tab, playlistId }: LibraryViewProps) {
  const { 
    likedSongs, 
    recentlyPlayed, 
    playlists,
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay,
    toggleLike,
    isLiked,
    addToQueue,
    addToPlaylist,
    removeFromPlaylist
  } = useMusicPlayer()

  const getContent = () => {
    switch (tab) {
      case 'liked':
        return {
          title: 'Beğenilen Şarkılar',
          subtitle: `${likedSongs.length} şarkı`,
          tracks: likedSongs,
          gradient: 'from-indigo-600 via-purple-600 to-pink-500',
          icon: Heart
        }
      case 'recent':
        return {
          title: 'Son Dinlenenler',
          subtitle: `${recentlyPlayed.length} şarkı`,
          tracks: recentlyPlayed,
          gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
          icon: Clock
        }
      case 'playlist':
        const playlist = playlists.find(p => p.id === playlistId)
        return {
          title: playlist?.name || 'Çalma Listesi',
          subtitle: `${playlist?.tracks.length || 0} şarkı`,
          tracks: playlist?.tracks || [],
          gradient: 'from-orange-600 via-red-600 to-pink-500',
          icon: null,
          playlistId
        }
      default:
        return {
          title: 'Kitaplık',
          subtitle: '',
          tracks: [],
          gradient: 'from-gray-600 to-gray-800',
          icon: null
        }
    }
  }

  const content = getContent()
  const IconComponent = content.icon

  const handlePlayAll = (shuffle = false) => {
    if (content.tracks.length > 0) {
      let tracks = [...content.tracks]
      if (shuffle) {
        tracks = tracks.sort(() => Math.random() - 0.5)
      }
      playTrack(tracks[0], tracks)
    }
  }

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, content.tracks)
    }
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="pb-32">
          {/* Header */}
          <div className={cn(
            "p-6 pb-8 bg-gradient-to-b",
            content.gradient
          )}>
            <div className="flex items-end gap-6 pt-12">
              {/* Cover Art */}
              <div className="w-48 h-48 rounded-lg shadow-2xl overflow-hidden flex-shrink-0">
                {content.tracks[0] ? (
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {content.tracks.slice(0, 4).map((track, i) => (
                      <img
                        key={track.id}
                        src={track.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ))}
                    {content.tracks.length < 4 && 
                      Array.from({ length: 4 - content.tracks.length }).map((_, i) => (
                        <div key={i} className="bg-secondary" />
                      ))
                    }
                  </div>
                ) : (
                  <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                    {IconComponent && <IconComponent className="w-16 h-16 text-white/50" />}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-sm font-medium text-white/80 mb-2">
                  {tab === 'playlist' ? 'ÇALMA LİSTESİ' : 'KOLEKSIYON'}
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
                  {content.title}
                </h1>
                <p className="text-white/80">{content.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex items-center gap-4 bg-gradient-to-b from-black/20 to-transparent">
            <Button
              size="lg"
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform shadow-lg"
              onClick={() => handlePlayAll()}
              disabled={content.tracks.length === 0}
            >
              <Play className="w-6 h-6 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => handlePlayAll(true)}
              disabled={content.tracks.length === 0}
            >
              <Shuffle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>

          {/* Track List */}
          <div className="px-6">
            {content.tracks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  {tab === 'liked' && 'Henüz beğendiğiniz şarkı yok'}
                  {tab === 'recent' && 'Henüz dinlediğiniz şarkı yok'}
                  {tab === 'playlist' && 'Bu çalma listesi boş'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Header Row */}
                <div className="grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_1fr_120px_40px] gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border">
                  <span>#</span>
                  <span>BAŞLIK</span>
                  <span className="hidden md:block text-right">SÜRE</span>
                  <span></span>
                </div>

                {/* Tracks */}
                {content.tracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id
                  const isTrackPlaying = isCurrentTrack && isPlaying

                  return (
                    <div
                      key={`${track.id}-${index}`}
                      className={cn(
                        "group grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_1fr_120px_40px] gap-4 px-4 py-2 rounded-md transition-colors",
                        "hover:bg-secondary/80",
                        isCurrentTrack && "bg-secondary"
                      )}
                    >
                      {/* Number / Play */}
                      <div className="flex items-center justify-center">
                        <span className={cn(
                          "text-sm group-hover:hidden",
                          isCurrentTrack ? "text-primary" : "text-muted-foreground"
                        )}>
                          {isTrackPlaying ? (
                            <div className="w-4 h-4 flex items-end justify-center gap-0.5">
                              <div className="w-1 h-3 bg-primary animate-pulse" />
                              <div className="w-1 h-4 bg-primary animate-pulse delay-75" />
                              <div className="w-1 h-2 bg-primary animate-pulse delay-150" />
                            </div>
                          ) : (
                            index + 1
                          )}
                        </span>
                        <button 
                          className="hidden group-hover:block"
                          onClick={() => handlePlayTrack(track)}
                        >
                          {isTrackPlaying ? (
                            <Pause className="w-4 h-4 text-foreground" />
                          ) : (
                            <Play className="w-4 h-4 text-foreground" />
                          )}
                        </button>
                      </div>

                      {/* Track Info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={cn(
                            "font-medium text-sm truncate",
                            isCurrentTrack ? "text-primary" : "text-foreground"
                          )}>
                            {track.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <span className="hidden md:flex items-center justify-end text-sm text-muted-foreground">
                        {track.duration}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 opacity-0 group-hover:opacity-100"
                          onClick={() => toggleLike(track)}
                        >
                          <Heart 
                            className={cn(
                              "w-4 h-4",
                              isLiked(track.id) 
                                ? "fill-primary text-primary" 
                                : "text-muted-foreground"
                            )} 
                          />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => addToQueue(track)}>
                              <ListPlus className="w-4 h-4 mr-2" />
                              Sıraya Ekle
                            </DropdownMenuItem>
                            {tab === 'playlist' && playlistId && (
                              <DropdownMenuItem 
                                onClick={() => removeFromPlaylist(playlistId, track.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Listeden Kaldır
                              </DropdownMenuItem>
                            )}
                            {playlists.length > 0 && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Listeye Ekle
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {playlists.map((playlist) => (
                                    <DropdownMenuItem
                                      key={playlist.id}
                                      onClick={() => addToPlaylist(playlist.id, track)}
                                    >
                                      {playlist.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
