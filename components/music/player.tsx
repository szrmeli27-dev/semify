"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Heart, Repeat, Shuffle, ListMusic, ChevronDown, ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Player() {
  const {
    currentTrack, isPlaying, volume, progress, duration,
    togglePlay, setVolume, setProgress, setDuration,
    nextTrack, previousTrack, toggleLike, isLiked, queue, setIsPlaying
  } = useMusicPlayer()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const previousVolume = useRef(volume)

  // Fetch stream URL when track changes
  const fetchStreamUrl = useCallback(async (trackId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/stream/${trackId}`)
      if (response.ok) {
        const data = await response.json()
        setStreamUrl(data.streamUrl)
      } else {
        console.error('Failed to get stream URL')
        setStreamUrl(null)
      }
    } catch (error) {
      console.error('Stream fetch error:', error)
      setStreamUrl(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load stream when track changes
  useEffect(() => {
    if (currentTrack) {
      fetchStreamUrl(currentTrack.id)
    } else {
      setStreamUrl(null)
    }
  }, [currentTrack?.id, fetchStreamUrl])

  // Play/pause audio when isPlaying changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !streamUrl) return

    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Playback error:', err)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, streamUrl, setIsPlaying])

  // Update volume
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Handle audio events
  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      setProgress(audio.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (audio) {
      setDuration(audio.duration)
      audio.volume = volume
      if (isPlaying) {
        audio.play().catch(console.error)
      }
    }
  }

  const handleEnded = () => {
    if (isRepeat) {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(console.error)
      }
    } else {
      nextTrack()
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
      setProgress(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
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

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <>
      {/* Hidden Audio Element */}
      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={(e) => console.error('Audio error:', e)}
          preload="auto"
        />
      )}

      {/* Mobile Expanded Full Screen Player */}
      {isExpanded && currentTrack && (
        <div className="md:hidden fixed inset-0 z-[100] bg-background flex flex-col safe-area-inset">
          <div className="flex items-center justify-between px-4 pt-12 pb-4">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
              <ChevronDown className="w-6 h-6" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Su An Caliniyor</span>
            <div className="w-10" />
          </div>
          
          <div className="flex-1 flex items-center justify-center px-8">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-full max-w-xs aspect-square rounded-2xl object-cover shadow-2xl" 
            />
          </div>
          
          <div className="px-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xl text-foreground truncate">{currentTrack.title}</h3>
                <p className="text-muted-foreground truncate mt-1">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {currentTrack.permalinkUrl && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(currentTrack.permalinkUrl, '_blank')}
                    title="SoundCloud'da Ac"
                  >
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => toggleLike(currentTrack)}>
                  <Heart className={cn("w-6 h-6", isLiked(currentTrack.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                </Button>
              </div>
            </div>
            
            <div className="mb-5">
              <Slider 
                value={[progress]} 
                max={duration || 100} 
                step={1} 
                onValueChange={handleSeek}
                disabled={isLoading}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
                <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-5">
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
                className="w-16 h-16 rounded-full bg-foreground text-background hover:scale-105 transition-transform"
                onClick={togglePlay}
                disabled={isLoading || !streamUrl}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-0.5" />
                )}
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
            
            <div className="flex items-center gap-3">
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

            {/* SoundCloud Attribution */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Powered by</span>
              <a 
                href="https://soundcloud.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#ff5500] hover:underline font-medium"
              >
                SoundCloud
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Player Bar - static in flex layout */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border flex-shrink-0">
        {/* Progress line */}
        <div className="h-0.5 bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Desktop Player */}
        {currentTrack ? (
          <>
            <div className="hidden md:flex items-center justify-between h-20 px-4 max-w-screen-2xl mx-auto">
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
                  <Heart className={cn("w-5 h-5", isLiked(currentTrack.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                </Button>
                {currentTrack.permalinkUrl && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="flex-shrink-0"
                    onClick={() => window.open(currentTrack.permalinkUrl, '_blank')}
                    title="SoundCloud'da Ac"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              
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
                    className="w-10 h-10 rounded-full bg-foreground text-background hover:scale-105 transition-transform" 
                    onClick={togglePlay}
                    disabled={isLoading || !streamUrl}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
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
                    disabled={isLoading}
                  />
                  <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-1 justify-end">
                {/* SoundCloud Attribution */}
                <a 
                  href="https://soundcloud.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[#ff5500] hover:underline font-medium hidden lg:block"
                >
                  SoundCloud
                </a>
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
                className="w-10 h-10 rounded-md object-cover flex-shrink-0" 
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
                  <Heart className={cn("w-5 h-5", isLiked(currentTrack.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-10 h-10" 
                  onClick={togglePlay}
                  disabled={isLoading || !streamUrl}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
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
          </>
        ) : (
          <div className="flex items-center justify-center h-16 md:h-20 text-muted-foreground text-sm">
            Sarki secin ve muzigin keyfini cikarin
          </div>
        )}
      </div>
    </>
  )
}
