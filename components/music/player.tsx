"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Heart, Repeat, Shuffle, ListMusic, ChevronDown, Plus, Music2, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

// ── Çalma listesine ekle butonu ───────────────────────────────
function AddToPlaylistBtn({ size = 'default' }: { size?: 'default' | 'sm' }) {
  const { currentTrack, playlists, addToPlaylist } = useMusicPlayer()
  const [open, setOpen] = useState(false)
  const [addedIds, setAddedIds] = useState<string[]>([])

  const trackId = currentTrack?.id
  useEffect(() => { setAddedIds([]) }, [trackId])

  if (!currentTrack) return null

  const handleAdd = async (playlistId: string, playlistName: string) => {
    await addToPlaylist(playlistId, currentTrack)
    setAddedIds((prev) => [...prev, playlistId])
    toast({
      title: 'Eklendi ✓',
      description: `"${currentTrack.title}" → ${playlistName}`,
    })
    setTimeout(() => setOpen(false), 700)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'}
          title="Çalma listesine ekle"
        >
          <Plus className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', 'text-muted-foreground')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-52 p-1 mb-2">
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
            const alreadyIn = playlist.tracks.some((t) => t.id === currentTrack.id)
            const justAdded = addedIds.includes(playlist.id)
            const done = alreadyIn || justAdded
            return (
              <button
                key={playlist.id}
                onClick={() => !done && handleAdd(playlist.id, playlist.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-2 rounded-sm text-sm transition-colors',
                  done
                    ? 'text-muted-foreground cursor-default'
                    : 'hover:bg-secondary cursor-pointer text-foreground'
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

// ── Ana Player ────────────────────────────────────────────────
export function Player() {
  const {
    currentTrack, isPlaying, volume, progress, duration,
    togglePlay, setVolume, setProgress, setDuration,
    nextTrack, previousTrack, toggleLike, isLiked, queue,
    addToRecentlyPlayed,
    isRepeat, toggleRepeat,
  } = useMusicPlayer()

  const playerRef = useRef<YT.Player | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const [isYTReady, setIsYTReady] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousVolume = useRef(volume)
  const isRepeatRef = useRef(isRepeat)
  const pendingTrackId = useRef<string | null>(null)
  const isCreatingPlayer = useRef(false)

  useEffect(() => { isRepeatRef.current = isRepeat }, [isRepeat])

  // YouTube API yükleme
  useEffect(() => {
    if (window.YT?.Player) { setIsYTReady(true); return }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      // Script zaten eklendi, callback'i bekle
      window.onYouTubeIframeAPIReady = () => setIsYTReady(true)
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => setIsYTReady(true)
  }, [])

  // Player oluştur veya şarkı değiştir
  useEffect(() => {
    if (!isYTReady || !currentTrack) return

    // Player zaten hazırsa sadece şarkıyı değiştir
    if (playerRef.current && isPlayerReady) {
      try {
        playerRef.current.loadVideoById(currentTrack.id)
        return
      } catch {
        // Player bozulduysa yeniden oluştur
        playerRef.current = null
        setIsPlayerReady(false)
      }
    }

    // Player oluşturuluyor, tekrar oluşturma
    if (isCreatingPlayer.current) {
      pendingTrackId.current = currentTrack.id
      return
    }

    // Container hazır mı kontrol et
    const container = document.getElementById('youtube-player-container')
    if (!container) return

    isCreatingPlayer.current = true
    setIsPlayerReady(false)

    // Önceki player'ı temizle
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch {}
      playerRef.current = null
    }
    container.innerHTML = '<div id="youtube-player"></div>'

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '1',
      width: '1',
      videoId: currentTrack.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        // Mobil için kritik: playsinline=1 olmadan iOS'ta tam ekran açılır
        playsinline: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: (event: YT.PlayerEvent) => {
          setIsPlayerReady(true)
          isCreatingPlayer.current = false
          event.target.setVolume(volume * 100)
          // Mobilde autoplay bazen çalışmaz, manuel play çağır
          event.target.playVideo()
          setDuration(event.target.getDuration())

          // Bekleyen şarkı varsa yükle
          if (pendingTrackId.current && pendingTrackId.current !== currentTrack.id) {
            event.target.loadVideoById(pendingTrackId.current)
            pendingTrackId.current = null
          }
        },
        onStateChange: (event: YT.OnStateChangeEvent) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            if (isRepeatRef.current) {
              playerRef.current?.seekTo(0, true)
              playerRef.current?.playVideo()
            } else {
              nextTrack()
            }
          }
          if (event.data === window.YT.PlayerState.PLAYING) {
            setDuration(playerRef.current?.getDuration() || 0)
          }
        },
        onError: () => {
          isCreatingPlayer.current = false
          // Hata durumunda sonraki şarkıya geç
          nextTrack()
        }
      },
    })
  }, [isYTReady, currentTrack?.id])

  // Play/Pause senkronizasyonu
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return
    try {
      if (isPlaying) playerRef.current.playVideo?.()
      else playerRef.current.pauseVideo?.()
    } catch {}
  }, [isPlaying, isPlayerReady])

  // Ses seviyesi
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return
    try { playerRef.current.setVolume?.(isMuted ? 0 : volume * 100) } catch {}
  }, [volume, isMuted, isPlayerReady])

  // Son dinlenenlere ekle
  useEffect(() => {
    if (currentTrack) addToRecentlyPlayed(currentTrack)
  }, [currentTrack?.id])

  // Progress güncelleme
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && isPlayerReady && playerRef.current) {
      intervalRef.current = setInterval(() => {
        try {
          const time = playerRef.current?.getCurrentTime() || 0
          setProgress(time)
        } catch {}
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, isPlayerReady, setProgress])

  const handleSeek = (value: number[]) => {
    setProgress(value[0])
    try { playerRef.current?.seekTo(value[0], true) } catch {}
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    if (isMuted) { setVolume(previousVolume.current || 0.5); setIsMuted(false) }
    else { previousVolume.current = volume; setVolume(0); setIsMuted(true) }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <>
      {/* 
        ✅ KRİTİK: hidden yerine görünmez ama DOM'da var şekilde tutuyoruz.
        visibility:hidden + pointer-events:none kullanıyoruz.
        "display:none" veya "hidden" class, bazı mobil tarayıcılarda
        YouTube player'ın çalışmasını engelliyor.
      */}
      <div
        id="youtube-player-container"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        ref={playerContainerRef}
      >
        <div id="youtube-player" />
      </div>

      {/* ── Mobile Expanded Player ── */}
      {isExpanded && (
        <div className="md:hidden fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 pt-12 pb-4">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
              <ChevronDown className="w-6 h-6" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Şu An Çalıyor</span>
            <AddToPlaylistBtn size="sm" />
          </div>

          <div className="flex-1 flex items-center justify-center px-8">
            {currentTrack && (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full max-w-xs aspect-square rounded-2xl object-cover shadow-2xl"
              />
            )}
          </div>

          {currentTrack && (
            <div className="px-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xl text-foreground truncate">{currentTrack.title}</h3>
                  <p className="text-muted-foreground truncate mt-1">{currentTrack.artist}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-2" onClick={() => toggleLike(currentTrack)}>
                  <Heart className={cn('w-6 h-6', isLiked(currentTrack.id) ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                </Button>
              </div>
              <div className="mb-5">
                <Slider value={[progress]} max={duration || 100} step={1} onValueChange={handleSeek} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-5">
                <Button variant="ghost" size="icon" className={cn('w-10 h-10', isShuffle && 'text-primary')} onClick={() => setIsShuffle(!isShuffle)}>
                  <Shuffle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12" onClick={previousTrack}>
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-foreground text-background hover:scale-105 transition-transform"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12" onClick={nextTrack} disabled={queue.length === 0}>
                  <SkipForward className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" className={cn('w-10 h-10', isRepeat && 'text-primary')} onClick={toggleRepeat}>
                  <Repeat className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleMute}>
                  {isMuted || volume === 0
                    ? <VolumeX className="w-5 h-5 text-muted-foreground" />
                    : <Volume2 className="w-5 h-5 text-muted-foreground" />}
                </Button>
                <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="flex-1" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Player Bar ── */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border flex-shrink-0">
        <div className="h-0.5 bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        {currentTrack ? (
          <>
            {/* ── Desktop ── */}
            <div className="hidden md:flex items-center justify-between h-20 px-4 max-w-screen-2xl mx-auto">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-14 h-14 rounded-md object-cover shadow-lg flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate text-foreground max-w-[160px]">{currentTrack.title}</h4>
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">{currentTrack.artist}</p>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={() => toggleLike(currentTrack)}>
                  <Heart className={cn('w-4 h-4', isLiked(currentTrack.id) ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                </Button>
                <AddToPlaylistBtn size="sm" />
              </div>

              <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className={cn('w-8 h-8', isShuffle && 'text-primary')} onClick={() => setIsShuffle(!isShuffle)}>
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={previousTrack}>
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button variant="default" size="icon" className="w-10 h-10 rounded-full bg-foreground text-background hover:scale-105 transition-transform" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={nextTrack} disabled={queue.length === 0}>
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={cn('w-8 h-8', isRepeat && 'text-primary')} onClick={toggleRepeat}>
                    <Repeat className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(progress)}</span>
                  <Slider value={[progress]} max={duration || 100} step={1} onValueChange={handleSeek} className="flex-1" />
                  <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <ListMusic className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleMute}>
                  {isMuted || volume === 0
                    ? <VolumeX className="w-5 h-5 text-muted-foreground" />
                    : <Volume2 className="w-5 h-5 text-muted-foreground" />}
                </Button>
                <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
              </div>
            </div>

            {/* ── Mobile Mini Player ── */}
            <div
              className="md:hidden flex items-center gap-3 h-16 px-3 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => toggleLike(currentTrack)}>
                  <Heart className={cn('w-4 h-4', isLiked(currentTrack.id) ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                </Button>
                <AddToPlaylistBtn size="sm" />
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={nextTrack} disabled={queue.length === 0}>
                  <SkipForward className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-16 md:h-20 text-muted-foreground text-sm">
            Şarkı seçin ve müziğin keyfini çıkarın 🎵
          </div>
        )}
      </div>
    </>
  )
}
