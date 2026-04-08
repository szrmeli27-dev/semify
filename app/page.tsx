"use client"

import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from '@/components/music/sidebar'
import { Player } from '@/components/music/player'
import { SearchView } from '@/components/music/search-view'
import { HomeView } from '@/components/music/home-view'
import { LibraryView } from '@/components/music/library-view'
import { MobileNav } from '@/components/music/mobile-nav'
import { useMusicPlayer } from '@/hooks/use-music-player'

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist'

export default function MusicApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')

  const { loadUserData, isLoaded } = useMusicPlayer()

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setActiveTab('search')
  }, [])

  const renderContent = () => {

    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      )
    }

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
      default:
        return <HomeView onSearch={handleSearch} />
    }
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedPlaylistId={selectedPlaylistId}
            onPlaylistSelect={setSelectedPlaylistId}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Player */}
      <Player />
    </div>
  )
}