export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
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
