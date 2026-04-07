declare namespace YT {
  class Player {
    constructor(
      elementId: string | HTMLElement,
      options: PlayerOptions
    )
    
    loadVideoById(videoId: string, startSeconds?: number): void
    cueVideoById(videoId: string, startSeconds?: number): void
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    setVolume(volume: number): void
    getVolume(): number
    mute(): void
    unMute(): void
    isMuted(): boolean
    getDuration(): number
    getCurrentTime(): number
    getPlayerState(): PlayerState
    destroy(): void
  }

  interface PlayerOptions {
    width?: number | string
    height?: number | string
    videoId?: string
    playerVars?: PlayerVars
    events?: PlayerEvents
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1
    disablekb?: 0 | 1
    enablejsapi?: 0 | 1
    fs?: 0 | 1
    modestbranding?: 0 | 1
    rel?: 0 | 1
    showinfo?: 0 | 1
    origin?: string
    playsinline?: 0 | 1
  }

  interface PlayerEvents {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: PlayerState
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }

  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
  }
}
