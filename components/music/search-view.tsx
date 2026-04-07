"use client"

import { useState, useEffect, useCallback } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Track } from '@/types/music'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
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
  Search, 
  Play, 
  Pause,
  MoreHorizontal, 
  Heart, 
  ListPlus,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

const POPULAR_SEARCHES = [
  { name: 'Pop Hits', color: 'from-pink-500 to-rose-600' },
  { name: 'Rock Classics', color: 'from-orange-500 to-red-600' },
  { name: 'Hip Hop', color: 'from-yellow-500 to-amber-600' },
  { name: 'Jazz', color: 'from-blue-500 to-indigo-600' },
  { name: 'Electronic', color: 'from-cyan-500 to-blue-600' },
  { name: 'Turkish Music', color: 'from-red-500 to-rose-600' },
  { name: 'Chill Vibes', color: 'from-green-500 to-emerald-600' },
  { name: 'Workout', color: 'from-purple-500 to-violet-600' },
]

interface SearchViewProps {
  initialQuery?: string
}

export function SearchView({ initialQuery = '' }: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const { 
    playTrack, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    toggleLike, 
    isLiked,
    addToQueue,
    playlists,
    addToPlaylist
  } = useMusicPlayer()

  const searchMusic = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set initial query if provided
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMusic(query)
    }, 500)

    return () => clearTimeout(timer)
  }, [query, searchMusic])

  const handleCategoryClick = (category: string) => {
    setQuery(category)
  }

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, results)
    }
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 pb-32">
          {/* Search Input */}
          <div className="sticky top-0 z-10 pb-4 bg-background">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Şarkı, sanatçı veya albüm ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-secondary border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          )}

          {/* No Search - Show Categories */}
          {!hasSearched && !isLoading && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">Hepsine Göz At</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {POPULAR_SEARCHES.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={cn(
                      "relative h-32 rounded-lg overflow-hidden p-4 text-left transition-transform hover:scale-105",
                      `bg-gradient-to-br ${category.color}`
                    )}
                  >
                    <span className="text-lg font-bold text-white">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {hasSearched && !isLoading && (
            <div>
              {results.length > 0 ? (
                <>
                  <h2 className="text-xl font-bold mb-4 text-foreground">
                    Sonuçlar
                  </h2>
                  <div className="space-y-1">
                    {results.map((track, index) => {
                      const isCurrentTrack = currentTrack?.id === track.id
                      const isTrackPlaying = isCurrentTrack && isPlaying

                      return (
                        <div
                          key={`${track.id}-${index}`}
                          className={cn(
                            "group flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer",
                            "hover:bg-secondary/80",
                            isCurrentTrack && "bg-secondary"
                          )}
                          onClick={() => handlePlayTrack(track)}
                        >
                          {/* Thumbnail with play button */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={track.thumbnail}
                              alt={track.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className={cn(
                                "absolute inset-0 flex items-center justify-center bg-black/60 rounded transition-opacity",
                                isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                            >
                              {isTrackPlaying ? (
                                <Pause className="w-5 h-5 text-white" />
                              ) : (
                                <Play className="w-5 h-5 text-white ml-0.5" />
                              )}
                            </button>
                          </div>

                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium truncate text-sm",
                              isCurrentTrack ? "text-primary" : "text-foreground"
                            )}>
                              {track.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artist}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
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
                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => addToQueue(track)}>
                                  <ListPlus className="w-4 h-4 mr-2" />
                                  Sıraya Ekle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleLike(track)}>
                                  <Heart className="w-4 h-4 mr-2" />
                                  {isLiked(track.id) ? 'Beğeniyi Kaldır' : 'Beğen'}
                                </DropdownMenuItem>
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
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">
                    "{query}" için sonuç bulunamadı
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
