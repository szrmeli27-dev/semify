"use client"

import { useEffect, useRef, useState } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Heart,
  Repeat,
  Shuffle,
  ListMusic,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

export function Player() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlay,
    setVolume,
    setProgress,
    setDuration,
    nextTrack,
    previousTrack,
    toggleLike,
    isLiked,
    queue
  } = useMusicPlayer()

  const playerRef = useRef<YT.Player | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isYTReady, setIsYTReady] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousVolume = useRef(volume)

  // YouTube IFrame API yükle
  useEffect(() => {
    if (window.YT) {
      setIsYTReady(true)
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      setIsYTReady(true)
    }
  }, [])

  // Player oluştur
  useEffect(() => {
    if (!isYTReady || !currentTrack) return

    const player = playerRef.current
    if (player && isPlayerReady && typeof player.loadVideoById === 'function') {
      try {
        player.loadVideoById(currentTrack.id)
        if (isPlaying && typeof player.playVideo === 'function') {
          player.playVideo()
        }
      } catch (error) {
        console.log('[semify] Load video error:', error)
      }
      return
    }
    
    setIsPlayerReady(false)

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '0',
      width: '0',
      videoId: currentTrack.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => {
          setIsPlayerReady(true)
          event.target.setVolume(volume * 100)
          if (isPlaying) {
            event.target.playVideo()
          }
          setDuration(event.target.getDuration())
        },
        onStateChange: (event: YT.OnStateChangeEvent) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            if (isRepeat) {
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
      },
    })
  }, [isYTReady, currentTrack?.id])

  // Play/Pause kontrol
  useEffect(() => {
    if (!isPlayerReady) return
    const player = playerRef.current
    if (!player) return
    if (typeof player.playVideo !== 'function' || typeof player.pauseVideo !== 'function') return
    try {
      if (isPlaying) {
        player.playVideo()
      } else {
        player.pauseVideo()
      }
    } catch (error) {
      console.log('[semify] Player control error:', error)
    }
  }, [isPlaying, isPlayerReady])

  // Volume kontrol
  useEffect(() => {
    if (!isPlayerReady) return
    const player = playerRef.current
    if (!player || typeof player.setVolume !== 'function') return
    try {
      player.setVolume(isMuted ? 0 : volume * 100)
    } catch (error) {
      console.log('[semify] Volume control error:', error)
    }
  }, [volume, isMuted, isPlayerReady])

  // Progress güncelle
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (isPlaying && playerRef.current) {
      intervalRef.current = setInterval(() => {
        const currentTime = playerRef.current?.getCurrentTime() || 0
        setProgress(currentTime)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, setProgress])

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setProgress(newTime)
    playerRef.current?.seekTo(newTime, true)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current || 0.5)
      setIsMuted(false)
    } else {
      previousVolume.current = volume
      setVolume(0)
      setIsMuted(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  if (!currentTrack) {
    return (
      <>
        {/* Hidden YouTube Player always mounted */}
        <div id="youtube-player" className="hidden" />
        <div className="fixed bottom-0 left-0 right-0 h-16 md:h-20 bg-card/95 backdrop-blur-xl border-t border-border z-50">
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Şarkı seçin ve müziğin keyfini çıkarın 🎵
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Hidden YouTube Player */}
      <div id="youtube-player" className="hidden" />

      {/* Mobile Expanded View */}
      {isExpanded && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
              <ChevronDown className="w-6 h-6" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Şu An Çalıyor</span>
            <div className="w-10" />
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-xs">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full aspect-square rounded-2xl object-cover shadow-2xl"
              />
            </div>
          </div>

          {/* Track Info + Like */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xl text-foreground truncate">{currentTrack.title}</h3>
                <p className="text-muted-foreground truncate mt-1">{currentTrack.artist}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 ml-4"
                onClick={() => toggleLike(currentTrack)}
              >
                <Heart className={cn(
                  "w-6 h-6 transition-colors",
                  isLiked(currentTrack.id) ? "fill-primary text-primary" : "text-muted-foreground"
                )} />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
                <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-10 h-10", isShuffle && "text-primary")}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-12 h-12" onClick={previousTrack}>
                <SkipBack className="w-6 h-6" />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-12 h-12" onClick={nextTrack} disabled={queue.length === 0}>
                <SkipForward className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-10 h-10", isRepeat && "text-primary")}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 pb-safe pb-4">
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop + Mobile Mini Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50">
        {/* Thin progress bar at top */}
        <div className="h-0.5 bg-border relative">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Desktop Player */}
        <div className="hidden md:flex items-center justify-between h-20 px-4 max-w-screen-2xl mx-auto">
          {/* Left: Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-14 h-14 rounded-md object-cover shadow-lg"
            />
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate text-foreground max-w-[200px]">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {currentTrack.artist}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => toggleLike(currentTrack)}
            >
              <Heart className={cn(
                "w-5 h-5 transition-colors",
                isLiked(currentTrack.id) ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )} />
            </Button>
          </div>

          {/* Center: Controls + Progress */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-8 h-8", isShuffle && "text-primary")}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={previousTrack}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="w-10 h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={nextTrack}
                disabled={queue.length === 0}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-8 h-8", isRepeat && "text-primary")}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(progress)}</span>
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ListMusic className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {/* Mobile Mini Player */}
        <div
          className="md:hidden flex items-center gap-3 h-16 px-3 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-10 h-10 rounded-md object-cover shadow-md flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => toggleLike(currentTrack)}
            >
              <Heart className={cn(
                "w-5 h-5",
                isLiked(currentTrack.id) ? "fill-primary text-primary" : "text-muted-foreground"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-foreground" />
              ) : (
                <Play className="w-5 h-5 text-foreground ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={nextTrack}
              disabled={queue.length === 0}
            >
              <SkipForward className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
