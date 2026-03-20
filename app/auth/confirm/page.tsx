import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Music2 } from "lucide-react"

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">E-postaniz Dogrulandi!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Hesabiniz basariyla aktif edildi. Artik giris yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-foreground">
              Semify&apos;e hosgeldiniz! Hesabiniz basariyla dogrulandi ve kullanima hazir.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth/login">
              <Music2 className="mr-2 h-4 w-4" />
              Giris Yap
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
