import { NextRequest, NextResponse } from 'next/server'

interface SoundCloudTrack {
  id: number
  title: string
  user: {
    username: string
    avatar_url: string
  }
  artwork_url: string | null
  duration: number
  streamable: boolean
  stream_url?: string
  permalink_url: string
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  try {
    const response = await fetch('https://api.soundcloud.com/oauth2/token', {
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
      console.error('Failed to get SoundCloud token:', await response.text())
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('SoundCloud token error:', error)
    return null
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getArtworkUrl(url: string | null): string {
  if (!url) {
    return '/placeholder-track.png'
  }
  // Get larger artwork (500x500 instead of default 100x100)
  return url.replace('-large', '-t500x500')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const accessToken = await getAccessToken()

  if (!accessToken) {
    return NextResponse.json(
      { error: 'SoundCloud API not configured. Please add SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET environment variables.' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&limit=30&linked_partitioning=1`,
      {
        headers: {
          Authorization: `OAuth ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      console.error('SoundCloud search error:', await response.text())
      return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
    }

    const data = await response.json()
    const tracks: SoundCloudTrack[] = data.collection || []

    // Filter to only streamable tracks and format results
    const results = tracks
      .filter((track) => track.streamable)
      .map((track) => ({
        id: track.id.toString(),
        title: track.title,
        artist: track.user.username,
        thumbnail: getArtworkUrl(track.artwork_url || track.user.avatar_url),
        duration: formatDuration(track.duration),
        permalink: track.permalink_url,
        source: 'soundcloud' as const,
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
