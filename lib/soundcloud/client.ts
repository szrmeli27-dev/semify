import { 
  SoundCloudTrack, 
  SoundCloudSearchResponse, 
  SoundCloudTokenResponse,
  Track 
} from '@/types/soundcloud'

const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com'
const SOUNDCLOUD_API_V2 = 'https://api-v2.soundcloud.com'

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth access token using Client Credentials flow
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    return cachedToken.token
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SoundCloud credentials not configured')
  }

  const response = await fetch(`${SOUNDCLOUD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('SoundCloud token error:', errorText)
    throw new Error('Failed to get SoundCloud access token')
  }

  const data: SoundCloudTokenResponse = await response.json()
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  return cachedToken.token
}

/**
 * Search for tracks on SoundCloud
 */
export async function searchTracks(
  query: string, 
  limit: number = 20
): Promise<SoundCloudTrack[]> {
  const token = await getAccessToken()
  
  const url = new URL(`${SOUNDCLOUD_API_V2}/search/tracks`)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', limit.toString())
  url.searchParams.set('access', 'playable') // Only get playable tracks

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `OAuth ${token}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`SoundCloud search failed: ${response.status}`)
  }

  const data: SoundCloudSearchResponse = await response.json()
  return data.collection.filter(track => track.streamable)
}

/**
 * Get a single track by ID
 */
export async function getTrack(trackId: number): Promise<SoundCloudTrack> {
  const token = await getAccessToken()
  
  const response = await fetch(`${SOUNDCLOUD_API_V2}/tracks/${trackId}`, {
    headers: {
      'Authorization': `OAuth ${token}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get track: ${response.status}`)
  }

  return response.json()
}

/**
 * Get stream URL for a track
 */
export async function getStreamUrl(trackId: number): Promise<string | null> {
  const token = await getAccessToken()
  
  // First get the track to find transcodings
  const track = await getTrack(trackId)
  
  if (!track.media?.transcodings || track.media.transcodings.length === 0) {
    return null
  }

  // Prefer progressive (direct) stream over HLS
  const transcoding = track.media.transcodings.find(
    t => t.format.protocol === 'progressive'
  ) || track.media.transcodings[0]

  // Get the actual stream URL
  const streamResponse = await fetch(`${transcoding.url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`, {
    headers: {
      'Authorization': `OAuth ${token}`,
    },
  })

  if (!streamResponse.ok) {
    return null
  }

  const streamData = await streamResponse.json()
  return streamData.url || null
}

/**
 * Convert SoundCloud track to app Track format
 */
export function convertToTrack(scTrack: SoundCloudTrack): Track {
  return {
    id: `sc-${scTrack.id}`,
    title: scTrack.title,
    artist: scTrack.user.username,
    thumbnail: scTrack.artwork_url?.replace('-large', '-t500x500') || 
               scTrack.user.avatar_url || 
               '/placeholder-album.jpg',
    duration: formatDuration(scTrack.duration),
    permalinkUrl: scTrack.permalink_url,
    soundcloudId: scTrack.id,
  }
}

/**
 * Format milliseconds to mm:ss
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Get trending tracks
 */
export async function getTrendingTracks(limit: number = 20): Promise<SoundCloudTrack[]> {
  const token = await getAccessToken()
  
  const url = new URL(`${SOUNDCLOUD_API_V2}/charts`)
  url.searchParams.set('kind', 'top')
  url.searchParams.set('genre', 'soundcloud:genres:all-music')
  url.searchParams.set('limit', limit.toString())

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `OAuth ${token}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    // Fallback to search if charts endpoint fails
    return searchTracks('popular music', limit)
  }

  const data = await response.json()
  return data.collection?.map((item: { track: SoundCloudTrack }) => item.track).filter(Boolean) || []
}
