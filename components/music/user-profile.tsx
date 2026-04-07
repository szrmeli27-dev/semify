"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Edit3, Loader2, ChevronDown } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function UserProfile() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single()
        
        setDisplayName(profile?.display_name || null)
        setEditName(profile?.display_name || "")
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

  const handleUpdateName = async () => {
    if (!user || !editName.trim()) return
    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .upsert({ 
        id: user.id,
        display_name: editName.trim(),
        updated_at: new Date().toISOString()
      })

    if (!error) {
      setDisplayName(editName.trim())
      setIsEditDialogOpen(false)
      router.refresh()
    } else {
      alert("Hata: " + error.message)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (loading) return <div className="p-4 opacity-50">...</div>
  if (!user) return null

  const finalName = displayName || user.email?.split("@")[0] || "Kullanıcı"
  const initials = finalName.slice(0, 2).toUpperCase()

  return (
    <div className="p-4 border-b border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-sidebar-accent group">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-sm text-sidebar-foreground truncate">{finalName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Kullanıcı Adını Değiştir
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>İsmini Güncelle</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Yeni Kullanıcı Adı</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Bir isim yaz..." />
            </div>
            <Button className="w-full" onClick={handleUpdateName} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}