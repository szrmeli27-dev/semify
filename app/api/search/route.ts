import { NextRequest, NextResponse } from 'next/server'
import { searchTracks, convertToTrack } from '@/lib/soundcloud/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' }, 
      { status: 400 }
    )
  }

  try {
    // Search SoundCloud for tracks
    const soundcloudTracks = await searchTracks(query, limit)
    
    // Convert to app format
    const results = soundcloudTracks.map(convertToTrack)

    return NextResponse.json({ 
      results,
      source: 'soundcloud',
      total: results.length
    })
  } catch (error) {
    console.error('Search error:', error)
    
    // Return empty results on error instead of failing
    return NextResponse.json({ 
      results: [],
      source: 'soundcloud',
      error: error instanceof Error ? error.message : 'Search failed'
    })
  }
}
