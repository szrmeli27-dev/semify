import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Music2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">E-postanızı Kontrol Edin</CardTitle>
          <CardDescription className="text-muted-foreground">
            Hesabınızı doğrulamak için e-posta adresinize bir doğrulama bağlantısı gönderdik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">
              E-postanızdaki bağlantıya tıklayarak hesabınızı doğrulayın. Doğrulama tamamlandıktan sonra giriş yapabilirsiniz.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>E-posta almadınız mı?</p>
            <ul className="mt-2 space-y-1">
              <li>Spam klasörünüzü kontrol edin</li>
              <li>E-posta adresinizi doğru girdiğinizden emin olun</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/login">
              <Music2 className="mr-2 h-4 w-4" />
              Giriş Sayfasına Git
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
