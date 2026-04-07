import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Music2 } from "lucide-react"

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Arkaplan dekorasyon */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-card border-border text-center relative z-10">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              {/* Pulse animasyonu */}
              <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Hesabınız Doğrulandı!</CardTitle>
          <CardDescription className="text-muted-foreground text-base mt-2">
            E-posta adresiniz başarıyla doğrulandı. Artık Semify&apos;e giriş yapabilirsiniz.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-foreground font-medium">
              🎵 Semify&apos;e hoş geldiniz!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Müziğin keyfini çıkarmaya başlayabilirsiniz.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/login">
              <Music2 className="mr-2 h-4 w-4" />
              Giriş Yap
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
