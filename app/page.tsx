"use client"

import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/music/sidebar'
import { Player } from '@/components/music/player'
import { SearchView } from '@/components/music/search-view'
import { HomeView } from '@/components/music/home-view'
import { LibraryView } from '@/components/music/library-view'
import { MobileNav } from '@/components/music/mobile-nav'
import { PartyRoomView } from '@/components/music/party-room'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Badge } from '@/components/ui/badge'
import { PartyPopper } from 'lucide-react'

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist' | 'party'

export default function MusicApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')
  const { party } = useMusicPlayer()

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setActiveTab('search')
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onSearch={handleSearch} />
      case 'search':
        return <SearchView key={searchQuery} initialQuery={searchQuery} />
      case 'liked':
        return <LibraryView tab="liked" />
      case 'recent':
        return <LibraryView tab="recent" />
      case 'playlist':
        return <LibraryView tab="playlist" playlistId={selectedPlaylistId} />
      case 'library':
        return <LibraryView tab="liked" />
      case 'party':
        return null // PartyRoomView is always rendered, just hidden
      default:
        return <HomeView onSearch={handleSearch} />
    }
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - sadece md ve üstünde görünür */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            selectedPlaylistId={selectedPlaylistId}
            onPlaylistSelect={setSelectedPlaylistId}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden min-w-0 relative">
          {/* PartyRoomView her zaman renderlanir ama sadece party tabinda gorunur - boylece state korunur */}
          <div className={activeTab === 'party' ? 'h-full' : 'hidden'}>
            <PartyRoomView />
          </div>
          {activeTab !== 'party' && renderContent()}
          
          {/* Parti aktifken diger sayfalarda parti gostergesi */}
          {party.partyCode && activeTab !== 'party' && (
            <button
              onClick={() => setActiveTab('party')}
              className="absolute top-4 right-4 z-10"
            >
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1 cursor-pointer animate-pulse">
                <PartyPopper className="w-3 h-3" />
                Parti Aktif
              </Badge>
            </button>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation - sadece mobilde görünür */}
      <div className="md:hidden">
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Player - her zaman altta */}
      <Player />
    </div>
  )
}
