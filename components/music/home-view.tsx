"use client"

import { useMusicPlayer } from '@/hooks/use-music-player'
import { Track } from '@/types/music'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_PICKS = [
  { name: 'Indie Kesfet', query: 'indie music new artists' },
  { name: 'Lo-Fi Chill', query: 'lofi hip hop chill beats' },
  { name: 'Electronic', query: 'electronic dance music' },
  { name: 'Acoustic', query: 'acoustic covers indie' },
  { name: 'Jazz Vibes', query: 'jazz instrumental relaxing' },
  { name: 'Hip Hop', query: 'hip hop underground' },
]

interface HomeViewProps {
  onSearch: (query: string) => void
}

export function HomeView({ onSearch }: HomeViewProps) {
  const { 
    recentlyPlayed, 
    likedSongs, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay 
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
          {/* Greeting */}
          <h1 className="text-3xl font-bold mb-6 text-foreground">{getGreeting()}</h1>

          {/* Quick Picks Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {recentlyPlayed.slice(0, 6).length > 0 
              ? recentlyPlayed.slice(0, 6).map((track) => {
                const isCurrentTrack = currentTrack?.id === track.id
                const isTrackPlaying = isCurrentTrack && isPlaying

                return (
                  <div
                    key={track.id}
                    className={cn(
                      "group flex items-center gap-4 bg-secondary/50 hover:bg-secondary rounded-md overflow-hidden transition-colors cursor-pointer",
                      isCurrentTrack && "bg-secondary"
                    )}
                    onClick={() => handlePlayTrack(track, recentlyPlayed)}
                  >
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-14 h-14 object-cover"
                    />
                    <span className="font-medium text-sm truncate pr-2 flex-1 text-foreground">
                      {track.title}
                    </span>
                    <Button
                      size="icon"
                      className={cn(
                        "w-10 h-10 rounded-full mr-2 shadow-lg transition-all",
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
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{pick.name}</span>
                </button>
              ))
            }
          </div>

          {/* Recently Played Section */}
          {recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Son Dinlenenler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recentlyPlayed.slice(0, 12).map((track) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    queue={recentlyPlayed}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Liked Songs Section */}
          {likedSongs.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Beğendiğin Şarkılar</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {likedSongs.slice(0, 6).map((track) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    queue={likedSongs}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Browse Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">Kesfet</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { name: 'Indie', color: 'from-emerald-500 to-green-600', query: 'indie music new' },
                { name: 'Electronic', color: 'from-cyan-500 to-blue-600', query: 'electronic music' },
                { name: 'Hip Hop', color: 'from-orange-500 to-amber-600', query: 'hip hop beats' },
                { name: 'Lo-Fi', color: 'from-slate-500 to-slate-700', query: 'lofi beats chill' },
                { name: 'Jazz', color: 'from-blue-500 to-indigo-600', query: 'jazz instrumental' },
                { name: 'Acoustic', color: 'from-amber-500 to-yellow-600', query: 'acoustic guitar' },
                { name: 'Ambient', color: 'from-teal-500 to-emerald-600', query: 'ambient music' },
                { name: 'Techno', color: 'from-red-500 to-rose-700', query: 'techno music' },
                { name: 'Soul', color: 'from-pink-500 to-rose-600', query: 'soul music' },
                { name: 'World', color: 'from-indigo-500 to-blue-600', query: 'world music' },
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

function TrackCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  
  const isCurrentTrack = currentTrack?.id === track.id
  const isTrackPlaying = isCurrentTrack && isPlaying

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay()
    } else {
      playTrack(track, queue)
    }
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
      <p className="text-xs text-muted-foreground truncate">
        {track.artist}
      </p>
    </div>
  )
}
