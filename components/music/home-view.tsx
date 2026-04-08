"use client"

import { useState } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Track } from '@/types/music'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Play, Pause, Plus, Music2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const QUICK_PICKS = [
  { name: 'Türkçe Pop', query: 'turkish pop music' },
  { name: 'Chill Mix', query: 'chill lofi music' },
  { name: 'Workout', query: 'workout motivation music' },
  { name: 'Rock Hits', query: 'rock hits music' },
  { name: 'Jazz Vibes', query: 'jazz relaxing music' },
  { name: 'EDM Party', query: 'edm party music' },
]

interface HomeViewProps {
  onSearch: (query: string) => void
}

// ── Çalma listesine ekle butonu ───────────────────────────────
function AddToPlaylistButton({ track }: { track: Track }) {
  const { playlists, addToPlaylist } = useMusicPlayer()
  const [open, setOpen] = useState(false)
  const [addedIds, setAddedIds] = useState<string[]>([])

  const handleAdd = async (playlistId: string, playlistName: string) => {
    await addToPlaylist(playlistId, track)
    setAddedIds((prev) => [...prev, playlistId])
    toast({
      title: 'Eklendi ✓',
      description: `"${track.title}" → ${playlistName}`,
    })
    setTimeout(() => setOpen(false), 700)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full shadow-lg transition-all",
            "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
          )}
          onClick={(e) => e.stopPropagation()}
          title="Çalma listesine ekle"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-52 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium border-b border-border mb-1">
          Çalma listesi seç
        </p>
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-4 px-2 text-center">
            <Music2 className="w-5 h-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Henüz çalma listen yok.</p>
            <p className="text-xs text-muted-foreground">Sol panelden liste oluştur.</p>
          </div>
        ) : (
          playlists.map((playlist) => {
            const alreadyIn = playlist.tracks.some((t) => t.id === track.id)
            const justAdded = addedIds.includes(playlist.id)
            const done = alreadyIn || justAdded
            return (
              <button
                key={playlist.id}
                onClick={() => !done && handleAdd(playlist.id, playlist.name)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-sm text-sm transition-colors",
                  done
                    ? "text-muted-foreground cursor-default"
                    : "hover:bg-secondary cursor-pointer text-foreground"
                )}
              >
                <Music2 className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate flex-1 text-left">{playlist.name}</span>
                {done && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            )
          })
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────
export function HomeView({ onSearch }: HomeViewProps) {
  const {
    recentlyPlayed,
    likedSongs,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
  } = useMusicPlayer()

  const handlePlayTrack = (track: Track, queue: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, queue)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Günaydın'
    if (hour < 18) return 'İyi Günler'
    return 'İyi Akşamlar'
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 pb-32">
          {/* Selamlama */}
          <h1 className="text-3xl font-bold mb-6 text-foreground">{getGreeting()}</h1>

          {/* Hızlı seçimler / Son dinlenenler grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {recentlyPlayed.slice(0, 6).length > 0
              ? recentlyPlayed.slice(0, 6).map((track) => {
                  const isCurrentTrack = currentTrack?.id === track.id
                  const isTrackPlaying = isCurrentTrack && isPlaying

                  return (
                    <div
                      key={track.id}
                      className={cn(
                        "group flex items-center gap-4 bg-secondary/50 hover:bg-secondary rounded-md overflow-hidden transition-colors cursor-pointer relative",
                        isCurrentTrack && "bg-secondary"
                      )}
                      onClick={() => handlePlayTrack(track, recentlyPlayed)}
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-14 h-14 object-cover flex-shrink-0"
                      />
                      <span className="font-medium text-sm truncate flex-1 text-foreground">
                        {track.title}
                      </span>

                      {/* Oynat butonu */}
                      <Button
                        size="icon"
                        className={cn(
                          "w-10 h-10 rounded-full mr-2 shadow-lg transition-all flex-shrink-0",
                          "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
                          isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayTrack(track, recentlyPlayed)
                        }}
                      >
                        {isTrackPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>
                    </div>
                  )
                })
              : QUICK_PICKS.map((pick) => (
                  <button
                    key={pick.name}
                    onClick={() => onSearch(pick.query)}
                    className="flex items-center gap-4 bg-secondary/50 hover:bg-secondary rounded-md overflow-hidden transition-colors text-left"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center flex-shrink-0">
                      <Play className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{pick.name}</span>
                  </button>
                ))}
          </div>

          {/* Son Dinlenenler */}
          {recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Son Dinlenenler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recentlyPlayed.slice(0, 12).map((track) => (
                  <TrackCard key={track.id} track={track} queue={recentlyPlayed} />
                ))}
              </div>
            </section>
          )}

          {/* Beğenilen Şarkılar */}
          {likedSongs.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Beğendiğin Şarkılar</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {likedSongs.slice(0, 6).map((track) => (
                  <TrackCard key={track.id} track={track} queue={likedSongs} />
                ))}
              </div>
            </section>
          )}

          {/* Keşfet */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">Keşfet</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { name: 'Pop',       color: 'from-pink-500 to-rose-600',    query: 'pop music hits' },
                { name: 'Hip Hop',   color: 'from-orange-500 to-amber-600', query: 'hip hop music' },
                { name: 'Rock',      color: 'from-red-500 to-rose-700',     query: 'rock music classics' },
                { name: 'R&B',       color: 'from-purple-500 to-violet-600',query: 'rnb music' },
                { name: 'Jazz',      color: 'from-blue-500 to-indigo-600',  query: 'jazz music relaxing' },
                { name: 'Electronic',color: 'from-cyan-500 to-blue-600',    query: 'electronic dance music' },
                { name: 'Classical', color: 'from-amber-500 to-yellow-600', query: 'classical music' },
                { name: 'Türkçe',   color: 'from-red-600 to-red-800',      query: 'turkish music' },
                { name: 'Indie',     color: 'from-emerald-500 to-green-600',query: 'indie music' },
                { name: 'Lo-Fi',     color: 'from-slate-500 to-slate-700',  query: 'lofi hip hop' },
              ].map((genre) => (
                <button
                  key={genre.name}
                  onClick={() => onSearch(genre.query)}
                  className={cn(
                    "aspect-square rounded-lg p-4 text-left transition-transform hover:scale-105",
                    `bg-gradient-to-br ${genre.color}`
                  )}
                >
                  <span className="text-lg font-bold text-white">{genre.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}

// ── TrackCard — + butonu eklendi ──────────────────────────────
function TrackCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()

  const isCurrentTrack = currentTrack?.id === track.id
  const isTrackPlaying = isCurrentTrack && isPlaying

  const handlePlay = () => {
    if (isCurrentTrack) togglePlay()
    else playTrack(track, queue)
  }

  return (
    <div
      className="group p-4 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer"
      onClick={handlePlay}
    >
      <div className="relative mb-4">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-full aspect-square rounded-md object-cover shadow-lg"
        />

        {/* ✅ Çalma listesine ekle — sol üst köşe, hover'da görünür */}
        <div onClick={(e) => e.stopPropagation()}>
          <AddToPlaylistButton track={track} />
        </div>

        {/* Oynat butonu — sağ alt */}
        <Button
          size="icon"
          className={cn(
            "absolute bottom-2 right-2 w-12 h-12 rounded-full shadow-xl transition-all",
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
            isCurrentTrack
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
          onClick={(e) => {
            e.stopPropagation()
            handlePlay()
          }}
        >
          {isTrackPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
      </div>

      <h3 className={cn(
        "font-medium text-sm truncate mb-1",
        isCurrentTrack ? "text-primary" : "text-foreground"
      )}>
        {track.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
    </div>
  )
}
