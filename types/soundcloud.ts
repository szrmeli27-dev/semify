// SoundCloud API Response Types

export interface SoundCloudUser {
  id: number
  username: string
  permalink: string
  avatar_url: string | null
  full_name: string
}

export interface SoundCloudTrack {
  id: number
  title: string
  description: string | null
  duration: number // milliseconds
  genre: string | null
  tag_list: string
  permalink_url: string
  stream_url?: string
  artwork_url: string | null
  waveform_url: string
  user: SoundCloudUser
  playback_count: number
  likes_count: number
  created_at: string
  streamable: boolean
  downloadable: boolean
  access: 'playable' | 'preview' | 'blocked'
  media?: {
    transcodings: SoundCloudTranscoding[]
  }
}

export interface SoundCloudTranscoding {
  url: string
  preset: string
  duration: number
  snipped: boolean
  format: {
    protocol: 'progressive' | 'hls'
    mime_type: string
  }
  quality: 'sq' | 'hq'
}

export interface SoundCloudPlaylist {
  id: number
  title: string
  description: string | null
  permalink_url: string
  artwork_url: string | null
  user: SoundCloudUser
  track_count: number
  tracks: SoundCloudTrack[]
  duration: number
}

export interface SoundCloudSearchResponse {
  collection: SoundCloudTrack[]
  next_href: string | null
  total_results?: number
}

export interface SoundCloudTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

// App internal track format (converted from SoundCloud)
export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  streamUrl?: string
  permalinkUrl: string
  soundcloudId: number
}
