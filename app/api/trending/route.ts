import { NextRequest, NextResponse } from 'next/server'

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '709fa152'
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0'

interface JamendoTrack {
  id: string
  name: string
  duration: number
  artist_name: string
  album_name: string
  album_image: string
  image: string
  audio: string
  audiodownload: string
  shareurl: string
  license_ccurl: string
}

interface JamendoResponse {
  headers: {
    status: string
    code: number
    error_message: string
    results_count: number
  }
  results: JamendoTrack[]
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const genre = searchParams.get('genre')
  const limit = searchParams.get('limit') || '20'

  try {
    const params = new URLSearchParams({
      client_id: JAMENDO_CLIENT_ID,
      format: 'json',
      limit: limit,
      include: 'musicinfo+licenses',
      audioformat: 'mp32',
      imagesize: '300',
      order: 'popularity_week',
      groupby: 'artist_id',
    })

    // Add genre filter if provided
    if (genre) {
      params.append('fuzzytags', genre)
    }

    // Get featured tracks for better quality
    params.append('featured', '1')

    const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    })

    if (!response.ok) {
      throw new Error(`Jamendo API error: ${response.status}`)
    }

    const data: JamendoResponse = await response.json()

    if (data.headers.status !== 'success') {
      throw new Error(data.headers.error_message || 'Jamendo API error')
    }

    const tracks = data.results.map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      album: track.album_name || 'Single',
      thumbnail: track.image || track.album_image || '/placeholder-track.png',
      duration: formatDuration(track.duration),
      durationSeconds: track.duration,
      streamUrl: track.audio,
      downloadUrl: track.audiodownload,
      permalink: track.shareurl,
      license: track.license_ccurl,
      source: 'jamendo' as const,
    }))

    return NextResponse.json({ 
      tracks,
      source: 'jamendo',
      attribution: {
        text: 'Music powered by Jamendo',
        url: 'https://www.jamendo.com',
        license: 'Creative Commons'
      }
    })
  } catch (error) {
    console.error('Trending error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending tracks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
