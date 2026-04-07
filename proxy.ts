import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/**
 * Next.js Turbopack artık 'middleware' yerine 'proxy' isimlendirmesini 
 * ve fonksiyonunu beklemektedir.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar dışındaki tüm istekleri eşleştir:
     * - _next/static (statik dosyalar)
     * - _next/image (görüntü optimizasyon dosyaları)
     * - favicon.ico (favicon dosyası)
     * - Görseller (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}