import { NextRequest, NextResponse } from 'next/server'
import { getStreamUrl } from '@/lib/soundcloud/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params
  
  // Extract numeric ID from "sc-123" format
  const numericId = trackId.startsWith('sc-') 
    ? parseInt(trackId.slice(3), 10)
    : parseInt(trackId, 10)

  if (isNaN(numericId)) {
    return NextResponse.json(
      { error: 'Invalid track ID' },
      { status: 400 }
    )
  }

  try {
    const streamUrl = await getStreamUrl(numericId)
    
    if (!streamUrl) {
      return NextResponse.json(
        { error: 'Stream not available' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      streamUrl,
      trackId: numericId 
    })
  } catch (error) {
    console.error('Stream error:', error)
    return NextResponse.json(
      { error: 'Failed to get stream URL' },
      { status: 500 }
    )
  }
}
