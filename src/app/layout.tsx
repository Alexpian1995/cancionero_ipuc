import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { SidebarLayout } from '@/components/layout/SidebarLayout'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Cancionero IA — IPUC',
  description: 'Cancionero digital para músicos y directores de alabanza',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${fraunces.variable} ${inter.variable} font-sans bg-[#F8FAFC] text-[#1A2530] h-full`}>
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  )
}