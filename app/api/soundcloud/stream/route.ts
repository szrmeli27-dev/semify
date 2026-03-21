import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const trackId = searchParams.get('id')

  if (!trackId) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'SoundCloud credentials not configured' },
      { status: 500 }
    )
  }

  try {
    // Get OAuth token
    const tokenResponse = await fetch('https://api.soundcloud.com/oauth2/token', {
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

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to authenticate with SoundCloud' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get track stream URL
    const trackResponse = await fetch(
      `https://api.soundcloud.com/tracks/${trackId}/streams`,
      {
        headers: {
          Authorization: `OAuth ${accessToken}`,
        },
      }
    )

    if (!trackResponse.ok) {
      // Track might not be streamable
      return NextResponse.json(
        { error: 'Track is not streamable', streamable: false },
        { status: 403 }
      )
    }

    const streamData = await trackResponse.json()
    
    // Prefer http_mp3_128_url, fallback to others
    const streamUrl = 
      streamData.http_mp3_128_url || 
      streamData.hls_mp3_128_url || 
      streamData.preview_mp3_128_url

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'No stream URL available', streamable: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      streamUrl,
      streamable: true 
    })
  } catch (error) {
    console.error('SoundCloud stream error:', error)
    return NextResponse.json(
      { error: 'Failed to get stream URL' },
      { status: 500 }
    )
  }
}
