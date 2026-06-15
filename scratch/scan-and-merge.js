import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// 1. Read environmental variables from .env.local
function loadEnv() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found at', envPath)
    process.exit(1)
  }
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) return
    const key = trimmed.substring(0, eqIdx).trim()
    const val = trimmed.substring(eqIdx + 1).trim()
    env[key] = val
  })
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing in .env.local')
  process.exit(1)
}

// 2. Initialize Supabase
const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function run() {
  const email = 'warehouseadmin123@mailinator.com'
  const password = 'password123'

  console.log('Signing in to Supabase as admin...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error('Sign in failed:', signInError.message)
    process.exit(1)
  }

  const session = signInData.session
  console.log('Authenticated successfully!')

  // Create client with auth token
  const authSupabase = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  })

  console.log('Fetching order items, products, and shop orders...')
  const { data: items, error: fetchError } = await authSupabase
    .from('order_items')
    .select(`
      id,
      shop_order_id,
      product_id,
      quantity,
      products (display_name),
      shop_orders (shop_name)
    `)

  if (fetchError) {
    console.error('Error fetching order items:', fetchError.message)
    process.exit(1)
  }

  console.log(`Retrieved ${items.length} order items. Scanning for duplicates...`)

  // Group by shop_order_id + product_id
  const groups = {}
  items.forEach((item) => {
    const key = `${item.shop_order_id}_${item.product_id}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })

  const duplicates = Object.values(groups).filter((group) => group.length > 1)

  if (duplicates.length === 0) {
    console.log('\n--- SCAN REPORT ---')
    console.log('No duplicate products found within any shop orders. Database is clean!')
    console.log('-------------------\n')
    process.exit(0)
  }

  console.log('\n--- SCAN REPORT: DUPLICATES DETECTED ---')
  console.log(`Found ${duplicates.length} duplicate group(s) of products within shop orders:\n`)

  duplicates.forEach((group, index) => {
    const shopName = group[0].shop_orders?.shop_name || 'Unknown Shop'
    const productName = group[0].products?.display_name || 'Unknown Product'
    console.log(`Group #${index + 1}:`)
    console.log(`  Shop: ${shopName} (${group[0].shop_order_id})`)
    console.log(`  Product: ${productName} (${group[0].product_id})`)
    console.log(`  Duplicate Rows:`)
    group.forEach((item) => {
      console.log(`    - Item ID: ${item.id}, Quantity: ${item.quantity}`)
    })
    const totalQty = group.reduce((sum, item) => sum + item.quantity, 0)
    console.log(`  Merged result will be: Quantity = ${totalQty}\n`)
  })

  // Check if merge flag is passed
  const shouldMerge = process.argv.includes('--merge')
  if (!shouldMerge) {
    console.log('To automatically merge these duplicates, run this script with the --merge flag:')
    console.log('  node scratch/scan-and-merge.js --merge')
    process.exit(0)
  }

  console.log('Merging duplicates automatically...')
  for (const group of duplicates) {
    const shopName = group[0].shop_orders?.shop_name || 'Unknown Shop'
    const productName = group[0].products?.display_name || 'Unknown Product'
    const keepItem = group[0]
    const deleteItems = group.slice(1)
    const totalQty = group.reduce((sum, item) => sum + item.quantity, 0)

    console.log(`Merging ${productName} in ${shopName} to total quantity ${totalQty}...`)

    // 1. Update the first item with the total sum
    const { error: updateError } = await authSupabase
      .from('order_items')
      .update({ quantity: totalQty })
      .eq('id', keepItem.id)

    if (updateError) {
      console.error(`Failed to update item ${keepItem.id}:`, updateError.message)
      continue
    }

    // 2. Delete the other items
    const deleteIds = deleteItems.map((item) => item.id)
    const { error: deleteError } = await authSupabase
      .from('order_items')
      .delete()
      .in('id', deleteIds)

    if (deleteError) {
      console.error(`Failed to delete duplicate items ${deleteIds.join(', ')}:`, deleteError.message)
      continue
    }

    console.log(`Successfully merged group into Item ID ${keepItem.id}`)
  }

  console.log('\nMerge operation completed successfully!')
}

run().catch((err) => {
  console.error('Execution error:', err)
  process.exit(1)
})
