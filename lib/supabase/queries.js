import { getSupabaseServerClient } from '@/lib/supabase/server'

const routeSelect = `
  *,
  created_by_user:users!routes_created_by_fkey(id, full_name, email),
  updated_by_user:users!routes_updated_by_fkey(id, full_name, email),
  route_locks(*, users(id, full_name, email)),
  shop_orders(
    *,
    order_items(
      *,
      products(
        *,
        bottle_categories(*)
      )
    )
  )
`

export async function requireServerSupabase() {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return { supabase: null, user: null, envMissing: true }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  return { supabase, user, envMissing: false }
}

export async function getProductsAndCategories() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return { products: [], categories: [], envMissing: true }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('bottle_categories').select('*').order('display_order', { ascending: true }),
    supabase.from('products').select('*, bottle_categories(*)').order('display_name', { ascending: true })
  ])

  return {
    categories: categories || [],
    products: products || [],
    envMissing: false
  }
}

export async function getTodayRoutes() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return { routes: [], envMissing: true }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('routes')
    .select(routeSelect)
    .gte('route_date', sevenDaysAgo)
    .order('route_date', { ascending: false })
    .order('created_at', { ascending: false })

  return { routes: data || [], envMissing: false }
}

export async function getRoute(routeId) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing) return { route: null, user: null, envMissing: true }

  const { data } = await supabase.from('routes').select(routeSelect).eq('id', routeId).single()
  return { route: data, user, envMissing: false }
}

export async function getHistoryRoutes() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return { routes: [], envMissing: true }

  const { data: settings } = await supabase.from('app_settings').select('*')
  const settingsMap = Object.fromEntries((settings || []).map((setting) => [setting.key, setting.value]))
  const retentionDays = Number(settingsMap.history_retention_days || 7)
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  if (settingsMap.history_auto_delete_enabled === 'true') {
    // History cleanup runs from the History screen to stay free-tier friendly without cron jobs.
    await supabase.from('routes').delete().lt('route_date', cutoffDate)
  }

  const { data } = await supabase
    .from('routes')
    .select(routeSelect)
    .gte('route_date', cutoffDate)
    .order('route_date', { ascending: false })

  return { routes: data || [], envMissing: false }
}

export async function getAppSettingValue(key, fallback) {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return fallback

  const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
  return data?.value ?? fallback
}

export async function getSettingsData() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return { envMissing: true, categories: [], products: [], users: [], appSettings: [] }

  const [{ data: categories }, { data: products }, { data: users }, { data: appSettings }] = await Promise.all([
    supabase.from('bottle_categories').select('*').order('display_order', { ascending: true }),
    supabase.from('products').select('*, bottle_categories(*)').order('display_name', { ascending: true }),
    supabase.from('users').select('*').order('full_name', { ascending: true }),
    supabase.from('app_settings').select('*').order('key', { ascending: true })
  ])

  return {
    envMissing: false,
    categories: categories || [],
    products: products || [],
    users: users || [],
    appSettings: appSettings || []
  }
}
