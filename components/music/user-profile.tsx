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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Edit3, Loader2, ChevronDown, Moon, Sun, Monitor } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"

// ── Tema tipleri ──────────────────────────────────────────────
type ThemeMode = 'black' | 'dark' | 'light'

const THEMES: { id: ThemeMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'black',
    label: 'Siyah',
    icon: <Moon className="w-4 h-4" />,
    description: 'Tam siyah arka plan',
  },
  {
    id: 'dark',
    label: 'Koyu',
    icon: <Monitor className="w-4 h-4" />,
    description: 'Koyu gri ton',
  },
  {
    id: 'light',
    label: 'Açık',
    icon: <Sun className="w-4 h-4" />,
    description: 'Beyaz arka plan',
  },
]

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement

  // Tüm tema class'larını temizle
  root.classList.remove('theme-black', 'theme-dark', 'theme-light', 'dark', 'light')

  if (theme === 'black') {
    root.classList.add('dark', 'theme-black')
    // Tam siyah CSS değişkenleri
    root.style.setProperty('--background', '0 0% 0%')
    root.style.setProperty('--card', '0 0% 4%')
    root.style.setProperty('--sidebar', '0 0% 3%')
    root.style.setProperty('--sidebar-border', '0 0% 10%')
    root.style.setProperty('--border', '0 0% 12%')
    root.style.setProperty('--secondary', '0 0% 8%')
    root.style.setProperty('--muted', '0 0% 10%')
  } else if (theme === 'dark') {
    root.classList.add('dark', 'theme-dark')
    // Tailwind dark mode varsayılanı — custom değişkenleri temizle
    root.style.removeProperty('--background')
    root.style.removeProperty('--card')
    root.style.removeProperty('--sidebar')
    root.style.removeProperty('--sidebar-border')
    root.style.removeProperty('--border')
    root.style.removeProperty('--secondary')
    root.style.removeProperty('--muted')
  } else {
    root.classList.add('light', 'theme-light')
    root.style.removeProperty('--background')
    root.style.removeProperty('--card')
    root.style.removeProperty('--sidebar')
    root.style.removeProperty('--sidebar-border')
    root.style.removeProperty('--border')
    root.style.removeProperty('--secondary')
    root.style.removeProperty('--muted')
  }

  localStorage.setItem('semify-theme', theme)
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('black')

  useEffect(() => {
    const saved = (localStorage.getItem('semify-theme') as ThemeMode) || 'black'
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    applyTheme(t)
  }

  return { theme, setTheme }
}

// ── Component ─────────────────────────────────────────────────
export function UserProfile() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

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

  if (loading) return <div className="p-4 opacity-50 text-sm">...</div>
  if (!user) return null

  const finalName = displayName || user.email?.split("@")[0] || "Kullanıcı"
  const initials = finalName.slice(0, 2).toUpperCase()
  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-sidebar-accent"
          >
            <Avatar className="w-9 h-9 ring-2 ring-primary/20 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-sm text-sidebar-foreground truncate">{finalName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="top" className="w-64 mb-1">
          {/* Kullanıcı bilgisi */}
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="font-medium text-sm">{finalName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* İsim değiştir */}
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Kullanıcı Adını Değiştir
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* ── TEMA SEÇİCİ ── */}
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pb-1">
            Tema
          </DropdownMenuLabel>

          <div className="px-2 pb-2 flex gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.description}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs transition-all border",
                  theme === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Tema önizleme kutusu */}
                <div
                  className={cn(
                    "w-8 h-5 rounded-sm border border-border/50 flex items-end overflow-hidden",
                    t.id === 'black' && "bg-black",
                    t.id === 'dark'  && "bg-zinc-900",
                    t.id === 'light' && "bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "w-full h-1.5",
                      t.id === 'light' ? "bg-zinc-200" : "bg-zinc-800"
                    )}
                  />
                </div>
                <span className="font-medium">{t.label}</span>
                {theme === t.id && (
                  <div className="w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Çıkış */}
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* İsim düzenleme dialogu */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İsmini Güncelle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Yeni Kullanıcı Adı</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Bir isim yaz..."
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
              />
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
