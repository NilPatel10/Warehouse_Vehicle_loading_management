import './globals.css'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Warehouse Loading Manager',
  description: 'Mobile-first route loading management for beverage warehouses'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors duration={1500} />
      </body>
    </html>
  )
}
