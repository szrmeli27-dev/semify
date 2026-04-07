import { NextRequest, NextResponse } from 'next/server'

// Invidious instances to try
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.protokolla.fi',
  'https://iv.nboeck.de',
]

async function searchWithInvidious(query: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.map((video: {
          videoId: string
          title: string
          author: string
          lengthSeconds: number
          videoThumbnails?: { url: string }[]
        }) => ({
          id: video.videoId,
          title: video.title,
          artist: video.author,
          thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
          duration: formatDuration(video.lengthSeconds)
        })).slice(0, 20)
      }
    } catch {
      continue
    }
  }
  return null
}

async function searchWithYouTube(query: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000)
      }
    )

    const html = await response.text()
    
    // Extract ytInitialData JSON
    const dataMatch = html.match(/var ytInitialData = (.+?);<\/script>/)
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1])
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || []
        
        return contents
          .filter((item: { videoRenderer?: unknown }) => item.videoRenderer)
          .map((item: { 
            videoRenderer: { 
              videoId: string
              title: { runs: { text: string }[] }
              ownerText?: { runs: { text: string }[] }
              lengthText?: { simpleText: string }
            } 
          }) => {
            const video = item.videoRenderer
            return {
              id: video.videoId,
              title: video.title?.runs?.[0]?.text || 'Unknown',
              artist: video.ownerText?.runs?.[0]?.text || 'Unknown Artist',
              thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
              duration: video.lengthText?.simpleText || '3:30'
            }
          })
          .slice(0, 20)
      } catch {
        // JSON parse failed, fall through to regex
      }
    }
    
    // Fallback: Simple regex extraction
    const videoIds: string[] = []
    const regex = /"videoId":"(\w{11})"/g
    let match
    
    while ((match = regex.exec(html)) !== null) {
      if (!videoIds.includes(match[1]) && videoIds.length < 20) {
        videoIds.push(match[1])
      }
    }
    
    return videoIds.map((id) => ({
      id,
      title: 'Music Video',
      artist: 'YouTube',
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      duration: '3:30'
    }))
  } catch {
    return null
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    // Try Invidious first (more reliable API)
    let results = await searchWithInvidious(query + ' music')
    
    // Fallback to YouTube scraping
    if (!results || results.length === 0) {
      results = await searchWithYouTube(query + ' music')
    }

    return NextResponse.json({ results: results || [] })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
