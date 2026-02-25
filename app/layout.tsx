import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { GlobalLoadingBar } from "@/components/global-loading-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Color Center Management",
  description: "Sistema de gestión de Color Centers",
  generator: "v0.app",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <GlobalLoadingBar />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
