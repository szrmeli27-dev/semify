"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Search, Heart, User, LogOut, Loader2, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist' | 'party'

interface MobileNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    { id: 'party' as Tab, icon: PartyPopper, label: 'Parti' },
  ]

  return (
    <nav className="bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-14">
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

        {/* Profile */}
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
