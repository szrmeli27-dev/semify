"use client"

import { useEffect, useRef, useState } from 'react'
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
    toast({ title: 'Eklendi ✓', description: `"${currentTrack.title}" → ${playlistName}` })
    setTimeout(() => setOpen(false), 700)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'} title="Çalma listesine ekle">
          <Plus className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', 'text-muted-foreground')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-52 p-1 mb-2">
        <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium border-b border-border mb-1">Çalma listesi seç</p>
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-4 px-2 text-center">
            <Music2 className="w-5 h-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Henüz çalma listen yok.</p>
          </div>
        ) : (
          playlists.map((playlist) => {
            const alreadyIn = playlist.tracks.some((t) => t.id === currentTrack.id)
            const justAdded = addedIds.includes(playlist.id)
            const done = alreadyIn || justAdded
            return (
              <button key={playlist.id} onClick={() => !done && handleAdd(playlist.id, playlist.name)}
                className={cn('w-full flex items-center gap-2 px-2 py-2 rounded-sm text-sm transition-colors',
                  done ? 'text-muted-foreground cursor-default' : 'hover:bg-secondary cursor-pointer text-foreground')}>
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

export function Player() {
  const {
    currentTrack, isPlaying, volume, progress, duration,
    togglePlay, setVolume, setProgress, setDuration,
    nextTrack, previousTrack, toggleLike, isLiked, queue,
    addToRecentlyPlayed, isRepeat, toggleRepeat,
  } = useMusicPlayer()

  const playerRef = useRef<YT.Player | null>(null)
  const [isYTReady, setIsYTReady] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousVolume = useRef(volume)
  const shouldPlayRef = useRef(true) // Çalması gerekiyor mu?

  // Closure trap ref'leri
  const isRepeatRef = useRef(isRepeat)
  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)
  const isPlayingRef = useRef(isPlaying)
  useEffect(() => { isRepeatRef.current = isRepeat }, [isRepeat])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  // ── YouTube API yükle ──
  useEffect(() => {
    if (window.YT?.Player) { setIsYTReady(true); return }
    window.onYouTubeIframeAPIReady = () => setIsYTReady(true)
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  }, [])

  // ── Interval: progress takip + Android için zorla play ──
  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      try {
        const player = playerRef.current
        if (!player) return

        const state = player.getPlayerState?.()
        const d = player.getDuration?.() ?? 0
        const t = player.getCurrentTime?.() ?? 0

        if (d > 0) setDuration(d)
        setProgress(t)

        // ✅ ANDROID KRİTİK: Player PAUSED veya CUED takılmışsa ve çalması gerekiyorsa zorla oynat
        // State: -1=unstarted, 1=playing, 2=paused, 3=buffering, 5=cued
        if (shouldPlayRef.current && (state === 2 || state === 5 || state === -1)) {
          player.playVideo?.()
        }
      } catch {}
    }, 1000)
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // ── Şarkı değişince: Player'ı her seferinde DESTROY edip yeniden oluştur ──
  // Bu sayede her seferinde autoplay:1 ile taze player başlar.
  // Android, yeni player oluşturma sırasındaki autoplay'i kabul eder.
  useEffect(() => {
    if (!isYTReady || !currentTrack) return

    stopInterval()
    setProgress(0)
    setDuration(0)
    shouldPlayRef.current = true

    // Eski player'ı tamamen yok et
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch {}
      playerRef.current = null
    }

    // Container'ı temizle
    const container = document.getElementById('yt-container')
    if (!container) return
    container.innerHTML = ''
    const div = document.createElement('div')
    div.id = 'yt-player'
    container.appendChild(div)

    // Yeni player oluştur
    playerRef.current = new window.YT.Player('yt-player', {
      videoId: currentTrack.id,
      width: '1',
      height: '1',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,        // iOS için şart
        origin: window.location.origin,
      },
      events: {
        onReady: (e: YT.PlayerEvent) => {
          e.target.setVolume(isMutedRef.current ? 0 : volumeRef.current * 100)
          e.target.playVideo()
          // interval başlat — içinde zaten zorla play var
          startInterval()
        },
        onStateChange: (e: YT.OnStateChangeEvent) => {
          const S = window.YT.PlayerState
          if (e.data === S.PLAYING) {
            // Gerçekten çalıyor, interval devam etsin
            startInterval()
          }
          if (e.data === S.PAUSED) {
            // Kullanıcı duraklattıysa interval'i durdur
            if (!shouldPlayRef.current) stopInterval()
          }
          if (e.data === S.ENDED) {
            stopInterval()
            shouldPlayRef.current = false
            if (isRepeatRef.current) {
              playerRef.current?.seekTo(0, true)
              playerRef.current?.playVideo()
              shouldPlayRef.current = true
            } else {
              nextTrack()
            }
          }
        },
        onError: () => {
          stopInterval()
          shouldPlayRef.current = false
          nextTrack()
        },
      },
    })
  }, [isYTReady, currentTrack?.id]) // eslint-disable-line

  // ── isPlaying değişince senkronize et ──
  useEffect(() => {
    if (!playerRef.current) return
    try {
      if (isPlaying) {
        shouldPlayRef.current = true
        playerRef.current.playVideo?.()
        startInterval()
      } else {
        shouldPlayRef.current = false
        playerRef.current.pauseVideo?.()
        stopInterval()
      }
    } catch {}
  }, [isPlaying]) // eslint-disable-line

  // ── Ses değişince ──
  useEffect(() => {
    if (!playerRef.current) return
    try { playerRef.current.setVolume?.(isMuted ? 0 : volume * 100) } catch {}
  }, [volume, isMuted])

  // ── Son dinlenenlere ekle ──
  useEffect(() => {
    if (currentTrack) addToRecentlyPlayed(currentTrack)
  }, [currentTrack?.id]) // eslint-disable-line

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

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <>
      {/*
        ✅ translateX ile ekran dışı — zIndex:-1 KULLANMA (Android medyayı askıya alır)
      */}
      <div
        id="yt-container"
        style={{
          position: 'fixed',
          width: 1,
          height: 1,
          top: 0,
          left: 0,
          transform: 'translateX(-9999px)',
          pointerEvents: 'none',
        }}
      />

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
              <img src={currentTrack.thumbnail} alt={currentTrack.title}
                className="w-full max-w-xs aspect-square rounded-2xl object-cover shadow-2xl" />
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
                  <span className="text-xs text-muted-foreground">{fmt(progress)}</span>
                  <span className="text-xs text-muted-foreground">{fmt(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <Button variant="ghost" size="icon" className={cn('w-10 h-10', isShuffle && 'text-primary')} onClick={() => setIsShuffle(!isShuffle)}>
                  <Shuffle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12" onClick={previousTrack}>
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button size="icon" className="w-16 h-16 rounded-full bg-foreground text-background hover:scale-105 transition-transform" onClick={togglePlay}>
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
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
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
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        {currentTrack ? (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center justify-between h-20 px-4 max-w-screen-2xl mx-auto">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-14 h-14 rounded-md object-cover shadow-lg flex-shrink-0" />
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
                  <span className="text-xs text-muted-foreground w-10 text-right">{fmt(progress)}</span>
                  <Slider value={[progress]} max={duration || 100} step={1} onValueChange={handleSeek} className="flex-1" />
                  <span className="text-xs text-muted-foreground w-10">{fmt(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <ListMusic className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
                </Button>
                <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
              </div>
            </div>

            {/* Mobile Mini Player */}
            <div className="md:hidden flex items-center gap-3 h-16 px-3 cursor-pointer" onClick={() => setIsExpanded(true)}>
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
