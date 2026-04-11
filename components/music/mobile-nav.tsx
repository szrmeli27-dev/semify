"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Home, Search, Heart, User, LogOut, Loader2, Library, ListMusic, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist'

interface MobileNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  selectedPlaylistId?: string | null
  onPlaylistSelect?: (id: string) => void
}

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export function MobileNav({ activeTab, onTabChange, selectedPlaylistId, onPlaylistSelect }: MobileNavProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { playlists, likedSongs, recentlyPlayed } = useMusicPlayer()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(profileData)
      }
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "K"
  const initials = displayName.slice(0, 1).toUpperCase()

  const navItems = [
    { id: 'home' as Tab, icon: Home, label: 'Ana Sayfa' },
    { id: 'search' as Tab, icon: Search, label: 'Ara' },
    { id: 'liked' as Tab, icon: Heart, label: 'Beğenilenler' },
  ]

  const isLibraryTab = activeTab === 'library' || activeTab === 'recent' || activeTab === 'playlist'

  return (
    <nav className="bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-14">
        {/* Ana nav itemları */}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex-1 h-full flex-col gap-0.5 rounded-none py-2",
                isActive && "text-primary"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px]", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Button>
          )
        })}

        {/* Kütüphane — Sheet ile açılır, çalma listeleri burada */}
        <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex-1 h-full flex-col gap-0.5 rounded-none py-2",
                isLibraryTab && "text-primary"
              )}
            >
              <Library className={cn("w-5 h-5", isLibraryTab ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px]", isLibraryTab ? "text-primary" : "text-muted-foreground")}>
                Kütüphane
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-0">
            <SheetHeader className="px-4 pb-2">
              <SheetTitle>Kütüphanem</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full px-4 pb-8">
              <div className="space-y-0.5">
                {/* Son Dinlenenler */}
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-12 px-2 font-normal',
                    activeTab === 'recent' && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => {
                    onTabChange('recent')
                    setLibraryOpen(false)
                  }}
                >
                  <div className="w-9 h-9 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm">Son Dinlenenler</span>
                    {recentlyPlayed && recentlyPlayed.length > 0 && (
                      <span className="text-xs text-muted-foreground">{recentlyPlayed.length} şarkı</span>
                    )}
                  </div>
                </Button>

                {/* Çalma Listeleri */}
                {playlists && playlists.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 pb-2 font-medium">
                      Çalma Listelerim
                    </p>
                    {playlists.map((playlist: any) => (
                      <Button
                        key={playlist.id}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 h-12 px-2 font-normal',
                          selectedPlaylistId === playlist.id && activeTab === 'playlist' &&
                            'bg-accent text-accent-foreground'
                        )}
                        onClick={() => {
                          onPlaylistSelect?.(playlist.id)
                          onTabChange('playlist')
                          setLibraryOpen(false)
                        }}
                      >
                        <div className="w-9 h-9 rounded bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0">
                          <ListMusic className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className="text-sm truncate w-full">{playlist.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {Array.isArray(playlist.tracks) ? playlist.tracks.length : 0} şarkı
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Hiç çalma listesi yoksa */}
                {(!playlists || playlists.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Henüz çalma listen yok.
                  </p>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Profil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex-1 h-full flex-col gap-0.5 rounded-none py-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">Profil</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={signingOut} className="text-destructive focus:text-destructive">
              {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
