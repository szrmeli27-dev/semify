/** @type {import('next').NextConfig} */
const nextConfig = {
  // Electron için static export - tarayıcı olmadan çalışabilmek için
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static export için trailing slash
  trailingSlash: true,
  // Electron'da asset path için
  assetPrefix: './',
}

export default nextConfig
