"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Save, Camera } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      setUser(user)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setDisplayName(profileData.display_name || "")
        // Cache-busting: URL'e timestamp ekle
        if (profileData.avatar_url) {
          setAvatarUrl(profileData.avatar_url + "?t=" + Date.now())
        }
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Dosya boyutu 2MB'dan küçük olmalıdır." })
      return
    }

    setUploading(true)
    setMessage(null)

    // Her zaman aynı dosya adını kullan (user id + .jpg) böylece upsert çalışır
    const filePath = `avatars/${user.id}.jpg`

    // Storage'a yükle (upsert: true → varsa üzerine yaz)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setMessage({ type: "error", text: "Fotoğraf yüklenemedi: " + uploadError.message })
      setUploading(false)
      return
    }

    // Public URL al
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

    // profiles tablosuna upsert ile kaydet
    // NOT: .update() satır yoksa sessizce başarısız olur, .upsert() her zaman çalışır
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      setMessage({ type: "error", text: "Profil güncellenemedi: " + updateError.message })
    } else {
      // Cache-busting ile URL'i güncelle — tarayıcı eski resmi göstermesin
      setAvatarUrl(publicUrl + "?t=" + Date.now())
      setMessage({ type: "success", text: "Profil fotoğrafı güncellendi!" })
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)

    // NOT: .update() satır yoksa sessizce başarısız olur
    // .upsert() hem satır oluşturur hem günceller — username her zaman kaydedilir
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName,
        updated_at: new Date().toISOString()
      })

    if (error) {
      setMessage({ type: "error", text: "Profil güncellenirken bir hata oluştu: " + error.message })
    } else {
      setMessage({ type: "success", text: "Profil başarıyla güncellendi!" })
      setProfile(prev => prev ? { ...prev, display_name: displayName } : null)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const initials = (displayName || user?.email?.split("@")[0] || "U").slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-4">
              {/* Avatar + upload butonu */}
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                  {uploading
                    ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
                    : <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <CardTitle className="text-2xl text-foreground">Profil Ayarları</CardTitle>
                <CardDescription className="text-muted-foreground">Hesap bilgilerinizi yönetin</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-primary/10 border border-primary/20 text-primary"
                  : "bg-destructive/10 border border-destructive/20 text-destructive"
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted border-border text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">Görünen Ad</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Adınızı girin"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-border text-foreground hover:bg-secondary"
              >
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</>
                  : <><Save className="mr-2 h-4 w-4" />Kaydet</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
