import { requireServerSupabase } from '@/lib/supabase/queries'

export async function getDamageReasons() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return []

  try {
    const { data } = await supabase
      .from('damage_reasons')
      .select('*')
      .order('reason_name', { ascending: true })

    return data || []
  } catch {
    return []
  }
}

export async function getInventoryProductsAndCategories() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return { products: [], categories: [], envMissing: true }

  try {
    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from('inventory_bottle_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('inventory_products').select('*, bottle_categories:inventory_bottle_categories(*)').order('display_name', { ascending: true })
    ])

    return {
      categories: categories || [],
      products: (products || []).map(p => ({
        ...p,
        // Make sure it matches display fields
        bottle_categories: p.bottle_categories
      })),
      envMissing: false
    }
  } catch (err) {
    console.error('Error fetching inventory products/categories:', err.message)
    return { products: [], categories: [], envMissing: false }
  }
}

export async function getInventoryDashboardData() {
  const { supabase, envMissing } = await requireServerSupabase()
  const empty = {
    totalProducts: 0,
    currentStockBottles: 0,
    todayStockEntries: 0,
    todayDamageEntries: 0,
    recentTransactions: [],
    lowStockProducts: []
  }
  if (envMissing) return empty

  try {
    // 1. Total active inventory products
    const { count: totalProducts } = await supabase
      .from('inventory_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 2. Current stock bottles sum
    const { data: stockData } = await supabase
      .from('inventory_stock')
      .select('product_id, current_stock_bottles')

    const currentStockBottles = (stockData || []).reduce(
      (sum, item) => sum + Number(item.current_stock_bottles || 0),
      0
    )

    // 3. Today's counts
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()

    const [{ count: todayStockEntries }, { count: todayDamageEntries }] = await Promise.all([
      supabase
        .from('inventory_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('transaction_type', 'Stock Entry')
        .gte('created_at', todayStartISO),
      supabase
        .from('inventory_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('transaction_type', 'Damage Entry')
        .gte('created_at', todayStartISO)
    ])

    const txSelect = `
      *,
      created_by_user:users!inventory_transactions_created_by_fkey(id, full_name, email),
      damage_reasons(*),
      inventory_transaction_items(
        *,
        products:inventory_products(
          *,
          bottle_categories:inventory_bottle_categories(*)
        )
      )
    `

    // 4. Recent transactions
    const { data: recentTx } = await supabase
      .from('inventory_transactions')
      .select(txSelect)
      .order('created_at', { ascending: false })
      .limit(10)

    // 5. Low stock: active inventory products with stock less than 1 crate
    const { data: products } = await supabase
      .from('inventory_products')
      .select('*, bottle_categories:inventory_bottle_categories(*)')
      .eq('is_active', true)

    const stockMap = new Map((stockData || []).map(s => [s.product_id, s.current_stock_bottles]))

    const lowStockProducts = (products || [])
      .map(p => {
        const stock = stockMap.get(p.id) || 0
        const bottlesPerCrate = p.bottle_categories?.bottles_per_crate || 24
        return {
          ...p,
          bottle_categories: p.bottle_categories,
          currentStockBottles: stock,
          currentCrates: Math.floor(stock / bottlesPerCrate),
          currentLoose: stock % bottlesPerCrate
        }
      })
      .filter(p => p.currentStockBottles < (p.bottle_categories?.bottles_per_crate || 24))
      .slice(0, 5)

    return {
      totalProducts: totalProducts || 0,
      currentStockBottles,
      todayStockEntries: todayStockEntries || 0,
      todayDamageEntries: todayDamageEntries || 0,
      recentTransactions: recentTx || [],
      lowStockProducts
    }
  } catch (err) {
    console.error('Error getting inventory dashboard data:', err.message)
    return empty
  }
}

export async function getInventoryHistory() {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return []

  try {
    const { data } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        created_by_user:users!inventory_transactions_created_by_fkey(id, full_name, email),
        damage_reasons(*),
        inventory_transaction_items(
          *,
          products:inventory_products(
            *,
            bottle_categories:inventory_bottle_categories(*)
          )
        )
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    return data || []
  } catch (err) {
    console.error('Error getting inventory history:', err.message)
    return []
  }
}

export async function getInventoryReports() {
  const empty = { currentStock: [], stockEntries: [], damages: [] }
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return empty

  try {
    const { data: products } = await supabase
      .from('inventory_products')
      .select('*, bottle_categories:inventory_bottle_categories(*)')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    const { data: stocks } = await supabase
      .from('inventory_stock')
      .select('*')

    const stockMap = new Map((stocks || []).map(s => [s.product_id, s.current_stock_bottles]))

    const currentStock = (products || []).map(p => {
      const bottles = stockMap.get(p.id) || 0
      const bottlesPerCrate = p.bottle_categories?.bottles_per_crate || 24
      return {
        product_id: p.id,
        display_name: p.display_name,
        total_bottles: bottles,
        crates: Math.floor(bottles / bottlesPerCrate),
        loose_bottles: bottles % bottlesPerCrate,
        bottles_per_crate: bottlesPerCrate
      }
    })

    const txSelect = `
      *,
      created_by_user:users!inventory_transactions_created_by_fkey(id, full_name, email),
      damage_reasons(*),
      inventory_transaction_items(
        *,
        products:inventory_products(
          *,
          bottle_categories:inventory_bottle_categories(*)
        )
      )
    `

    const [{ data: stockEntries }, { data: damages }] = await Promise.all([
      supabase
        .from('inventory_transactions')
        .select(txSelect)
        .eq('transaction_type', 'Stock Entry')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory_transactions')
        .select(txSelect)
        .eq('transaction_type', 'Damage Entry')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
    ])

    return {
      currentStock,
      stockEntries: stockEntries || [],
      damages: damages || []
    }
  } catch (err) {
    console.error('Error getting inventory reports:', err.message)
    return empty
  }
}
