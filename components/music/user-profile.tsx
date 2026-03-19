"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { User, LogOut, Settings, Loader2, Camera, Edit3, ChevronDown } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export function UserProfile() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        if (profileData?.display_name) {
          setEditDisplayName(profileData.display_name)
        }
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const handleUpdateDisplayName = async () => {
    if (!user || !editDisplayName.trim()) return
    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: editDisplayName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, display_name: editDisplayName.trim() } : null)
      setIsEditDialogOpen(false)
    }
    setSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingPhoto(true)

    try {
      // Convert to base64 data URL for avatar
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        const { error } = await supabase
          .from("profiles")
          .update({ 
            avatar_url: base64,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)

        if (!error) {
          setProfile(prev => prev ? { ...prev, avatar_url: base64 } : null)
        }
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 border-b border-sidebar-border">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push("/auth/login")}
        >
          Giris Yap
        </Button>
      </div>
    )
  }

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Kullanici"
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
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-sm text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64" sideOffset={8}>
          <div className="px-2 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
              setEditDisplayName(profile?.display_name || "")
              setIsEditDialogOpen(true)
            }}>
              <Edit3 className="mr-2 h-4 w-4" />
              Kullanici Adini Degistir
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profil Ayarlari
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Cikis Yap
          </DropdownMenuItem>
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
                disabled={saving || !editDisplayName.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
