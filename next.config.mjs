/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Poner a false cuando no haya errores de tipo
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // mysql2 usa módulos Node (node:buffer, etc.): solo cargar en servidor, no en el bundle del cliente
  serverExternalPackages: ["mysql2"],
}

export default nextConfig
