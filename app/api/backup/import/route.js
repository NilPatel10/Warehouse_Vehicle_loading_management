import { NextResponse } from 'next/server'
import { requireServerSupabase } from '@/lib/supabase/queries'

const importOrder = ['bottle_categories', 'products', 'routes', 'shop_orders', 'order_items', 'scheme_configurations', 'app_settings']

export async function POST(request) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const backup = await request.json()
  if (!backup?.tables) return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 })

  for (const table of importOrder) {
    const rows = backup.tables[table] || []
    if (!rows.length) continue
    const conflictCol = table === 'app_settings' ? 'key' : 'id'
    const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictCol })
    if (error) return NextResponse.json({ error: error.message, table }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
