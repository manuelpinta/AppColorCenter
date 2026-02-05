import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Color Center Management",
  description: "Sistema de gestión de Color Centers",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 w-full lg:ml-64 pb-20 lg:pb-0">{children}</main>
        </div>
      </body>
    </html>
  )
}
