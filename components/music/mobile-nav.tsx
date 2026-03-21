"use client"

import { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Search, Heart, Settings, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'home' | 'search' | 'library' | 'liked' | 'recent' | 'playlist' | 'party'

interface MobileNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

interface UserData {
  displayName: string
  avatarUrl: string | null
}

const STORAGE_KEY = 'semify-user-profile'

function getUserData(): UserData {
  if (typeof window === 'undefined') {
    return { displayName: 'Kullanici', avatarUrl: null }
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { displayName: 'Kullanici', avatarUrl: null }
    }
  }
  return { displayName: 'Kullanici', avatarUrl: null }
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [userData, setUserData] = useState<UserData>({ displayName: 'Kullanici', avatarUrl: null })

  useEffect(() => {
    setUserData(getUserData())
  }, [])

  const displayName = userData.displayName
  const initials = displayName.slice(0, 1).toUpperCase()

  const navItems = [
    { id: 'home' as Tab, icon: Home, label: 'Ana Sayfa' },
    { id: 'search' as Tab, icon: Search, label: 'Ara' },
    { id: 'liked' as Tab, icon: Heart, label: 'Begenilenler' },
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
                <AvatarImage src={userData.avatarUrl || undefined} />
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
              <p className="text-xs text-muted-foreground">Semify Kullanicisi</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
