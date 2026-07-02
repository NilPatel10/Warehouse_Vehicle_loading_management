import Link from 'next/link'
import { ClipboardList, Warehouse, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireServerSupabase } from '@/lib/supabase/queries'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions'

export const metadata = {
  title: 'Warehouse Control Hub',
  description: 'Select a module to manage routes, loading, and stock inventory.'
}

export default async function HubPage() {
  const { user } = await requireServerSupabase()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <PageHeader
        title="Warehouse Control Hub"
        subtitle="Select a module to proceed"
        action={
          user ? (
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          ) : null
        }
      />

      {/* Main Selection Area */}
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full p-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.full_name || user?.email || 'Staff'}</h2>
          <p className="text-sm text-muted-foreground">
            Switch between modules seamlessly. Your databases and functions are 100% isolated.
          </p>
        </div>

        <div className="grid gap-4">
          {/* Vehicle Loading Card */}
          <Link href="/add-order">
            <Card className="hover:border-primary/60 hover:bg-muted/10 transition-all duration-200 group active:scale-98 cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full w-[4px] bg-primary group-hover:w-[6px] transition-all" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
                <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                    Vehicle Loading Module
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Manage routes, shop orders, loading checklists, and water calculations.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Warehouse Stock Card */}
          <Link href="/warehouse-stock">
            <Card className="hover:border-emerald-500/60 hover:bg-muted/10 transition-all duration-200 group active:scale-98 cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full w-[4px] bg-emerald-500 group-hover:w-[6px] transition-all" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Warehouse className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-bold group-hover:text-emerald-600 transition-colors">
                    Warehouse Stock Module
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Manage inventory levels, record receive entry, log damages, and run stock reports.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Warehouse Loading & Stock Manager v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
