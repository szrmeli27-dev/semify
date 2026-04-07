import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Bir Hata Oluştu</CardTitle>
          <CardDescription className="text-muted-foreground">
            Kimlik doğrulama sırasında bir sorun oluştu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-foreground">
              Bu hata doğrulama bağlantısının süresi dolmuş olması veya geçersiz olması nedeniyle oluşmuş olabilir. Lütfen tekrar deneyin.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Giriş Sayfasına Dön
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-secondary">
            <Link href="/auth/sign-up">
              Yeni Hesap Oluştur
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
