export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  durationSeconds?: number
  streamUrl?: string
  downloadUrl?: string
  permalink?: string
  license?: string
  album?: string
  source?: 'jamendo'
}

export interface Playlist {
  id: string
  name: string
  tracks: Track[]
  thumbnail?: string
}

export interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  queue: Track[]
  currentIndex: number
}

export interface JamendoAttribution {
  text: string
  url: string
  license: string
}
