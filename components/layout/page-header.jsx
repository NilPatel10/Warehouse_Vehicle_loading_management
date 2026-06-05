import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PageHeader({ title, subtitle, backHref, action }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        {backHref ? (
          <Button asChild variant="ghost" size="icon" aria-label="Back">
            <Link href={backHref}>
              <ArrowLeft />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-normal">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  )
}
