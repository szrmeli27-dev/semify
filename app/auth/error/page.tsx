"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = () => {
    switch (error) {
      case "email_verification_failed":
        return {
          title: "E-posta Dogrulanamadi",
          description: "E-posta dogrulama baglantisi gecersiz veya suresi dolmus olabilir.",
          suggestion: "Lutfen yeni bir dogrulama baglantisi isteyin veya tekrar kayit olun.",
          icon: Mail
        }
      default:
        return {
          title: "Bir Hata Olustu",
          description: "Kimlik dogrulama sirasinda bir sorun olustu.",
          suggestion: "Bu hata dogrulama baglantisinin suresi dolmus olmasi veya gecersiz olmasi nedeniyle olumus olabilir. Lutfen tekrar deneyin.",
          icon: AlertCircle
        }
    }
  }

  const errorInfo = getErrorMessage()
  const IconComponent = errorInfo.icon

  return (
    <Card className="w-full max-w-md bg-card border-border text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-2xl text-foreground">{errorInfo.title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {errorInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-foreground">
            {errorInfo.suggestion}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Giris Sayfasina Don
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-secondary">
          <Link href="/auth/sign-up">
            Yeni Hesap Olustur
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-card border-border text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">Yukleniyor...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
