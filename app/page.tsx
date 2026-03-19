"use client"

import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/music/sidebar'
import { Player } from '@/components/music/player'
import { SearchView } from '@/components/music/search-view'
import { HomeView } from '@/components/music/home-view'
import { LibraryView } from '@/components/music/library-view'
import { MobileNav } from '@/components/music/mobile-nav'
import { PartyRoomView } from '@/components/music/party-room'

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist' | 'party'

export default function MusicApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')

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
        return <PartyRoomView />
      default:
        return <HomeView onSearch={handleSearch} />
    }
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            selectedPlaylistId={selectedPlaylistId}
            onPlaylistSelect={setSelectedPlaylistId}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Player */}
      <Player />
    </div>
  )
}
