'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, History, PlusCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavProgressBar } from '@/components/layout/nav-progress-bar'

const parentRoutes = ['/add-order', '/orders', '/history', '/settings']

const navItems = [
  { href: '/add-order', label: 'Add Order', icon: PlusCircle },
  { href: '/orders', label: "Today's Orders", icon: ClipboardList },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings }
]

export function AppShell({ children }) {
  const pathname = usePathname()
  const showBottomNav = parentRoutes.includes(pathname)

  return (
    <div className={cn('min-h-screen bg-background', showBottomNav && 'pb-20')}>
      <NavProgressBar />
      <main className="mx-auto min-h-screen w-full max-w-5xl">{children}</main>
      {showBottomNav ? (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card/98 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto grid max-w-5xl grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-all duration-150 active:scale-90',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {/* Active indicator pill at top of tab */}
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-b-full bg-primary" />
                  )}
                  <Icon className={cn('h-5 w-5 transition-transform duration-150', active && 'scale-110')} />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
