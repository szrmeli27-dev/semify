import { NextResponse } from 'next/server'

// Cache token in memory (valid for ~1 hour)
let cachedToken: { access_token: string; expires_at: number } | null = null

export async function GET() {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'SoundCloud credentials not configured' },
      { status: 500 }
    )
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return NextResponse.json({ access_token: cachedToken.access_token })
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
      const errorText = await response.text()
      console.error('SoundCloud token error:', errorText)
      return NextResponse.json(
        { error: 'Failed to obtain SoundCloud token' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Cache the token (expires in ~1 hour, we refresh 5 min early)
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in - 300) * 1000,
    }

    return NextResponse.json({ access_token: data.access_token })
  } catch (error) {
    console.error('SoundCloud token fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SoundCloud token' },
      { status: 500 }
    )
  }
}
