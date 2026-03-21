"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, Camera, Edit3, ChevronDown } from "lucide-react"

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

function saveUserData(data: UserData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

export function UserProfile() {
  const [userData, setUserData] = useState<UserData>({ displayName: 'Kullanici', avatarUrl: null })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUserData(getUserData())
  }, [])

  const handleUpdateDisplayName = () => {
    if (!editDisplayName.trim()) return
    const newData = { ...userData, displayName: editDisplayName.trim() }
    setUserData(newData)
    saveUserData(newData)
    setIsEditDialogOpen(false)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      const newData = { ...userData, avatarUrl: base64 }
      setUserData(newData)
      saveUserData(newData)
      setUploadingPhoto(false)
    }
    reader.readAsDataURL(file)
  }

  const displayName = userData.displayName
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="p-4 border-b border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-sidebar-accent group"
          >
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src={userData.avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-sm text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">Ucretsiz Kullanici</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64" sideOffset={8}>
          <div className="px-2 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={userData.avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">Semify Kullanicisi</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <DropdownMenuItem 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <Camera className="mr-2 h-4 w-4" />
              {uploadingPhoto ? "Yukleniyor..." : "Profil Fotografi Degistir"}
            </DropdownMenuItem>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            <DropdownMenuItem onClick={() => {
              setEditDisplayName(userData.displayName)
              setIsEditDialogOpen(true)
            }}>
              <Edit3 className="mr-2 h-4 w-4" />
              Kullanici Adini Degistir
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Kullanici Adi Degistirme Diyalogu */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanici Adini Degistir</DialogTitle>
            <DialogDescription>
              Yeni kullanici adinizi girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Kullanici Adi</Label>
              <Input
                id="displayName"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Kullanici adinizi girin"
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateDisplayName()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Iptal
              </Button>
              <Button 
                onClick={handleUpdateDisplayName}
                disabled={!editDisplayName.trim()}
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
