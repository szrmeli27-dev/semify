import { NextRequest, NextResponse } from 'next/server'
import { getTrendingTracks, convertToTrack } from '@/lib/soundcloud/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  try {
    const soundcloudTracks = await getTrendingTracks(limit)
    const results = soundcloudTracks.map(convertToTrack)

    return NextResponse.json({ 
      results,
      source: 'soundcloud',
      total: results.length
    })
  } catch (error) {
    console.error('Trending error:', error)
    
    return NextResponse.json({ 
      results: [],
      source: 'soundcloud',
      error: error instanceof Error ? error.message : 'Failed to get trending'
    })
  }
}
