"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bell, Shield, Palette } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useThemeStore } from "@/hooks/use-theme-store"

export default function SettingsPage() {
  const router = useRouter()
  const { isDark, setDark } = useThemeStore()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-6">Ayarlar</h1>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Bildirimler</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Bildirim tercihlerinizi yönetin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="text-foreground">
                  Anlık bildirimler
                </Label>
                <Switch id="push-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-foreground">
                  E-posta bildirimleri
                </Label>
                <Switch id="email-notifications" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Görünüm</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Uygulama görünümünü özelleştirin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="text-foreground font-medium">
                    Koyu Tema
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isDark ? 'Koyu tema aktif' : 'Açık tema aktif'}
                  </p>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={isDark}
                  onCheckedChange={setDark}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="animations" className="text-foreground">
                  Animasyonlar
                </Label>
                <Switch id="animations" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Gizlilik</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Gizlilik ayarlarınızı yönetin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public-profile" className="text-foreground">
                  Profili herkese açık yap
                </Label>
                <Switch id="public-profile" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activity-status" className="text-foreground">
                  Aktivite durumunu göster
                </Label>
                <Switch id="activity-status" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
