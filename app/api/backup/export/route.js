import { NextResponse } from 'next/server'
import { requireServerSupabase } from '@/lib/supabase/queries'

const tables = [
  'routes',
  'shop_orders',
  'order_items',
  'bottle_categories',
  'products',
  'scheme_configurations',
  'route_locks',
  'audit_logs',
  'app_settings',
  'users'
]

export async function GET() {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const backup = {
    exported_at: new Date().toISOString(),
    version: 1,
    tables: {}
  }

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) return NextResponse.json({ error: error.message, table }, { status: 500 })
    backup.tables[table] = data || []
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="warehouse-backup-${Date.now()}.json"`
    }
  })
}
