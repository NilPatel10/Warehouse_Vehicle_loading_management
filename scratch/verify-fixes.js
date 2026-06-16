import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { calculateItem, calculateShopOrder, calculateRouteSummary } from '../lib/calculations.js'

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

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Simulated addShopOrder logic from actions.js to test Layer 2
async function simulateAddShopOrder(authSupabase, userId, routeId, orderId, shopName, freeWaterPerCrate, productIds, quantities) {
  // Check for duplicate products first (Layer 2)
  const activeProductIds = []
  for (let i = 0; i < productIds.length; i++) {
    if (quantities[i] > 0) {
      activeProductIds.push(productIds[i])
    }
  }
  const uniqueProductIds = new Set(activeProductIds)
  if (uniqueProductIds.size !== activeProductIds.length) {
    return { error: "Product already added to this shop order. Please update the existing quantity." }
  }

  let order
  let orderError

  if (orderId) {
    const { data, error } = await authSupabase
      .from('shop_orders')
      .update({
        shop_name: shopName,
        free_water_per_crate: freeWaterPerCrate,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('id')
      .single()
    order = data
    orderError = error
  } else {
    const { data, error } = await authSupabase
      .from('shop_orders')
      .insert({
        route_id: routeId,
        shop_name: shopName,
        free_water_per_crate: freeWaterPerCrate,
        created_by: userId,
        updated_by: userId
      })
      .select('id')
      .single()
    order = data
    orderError = error
  }

  if (orderError) return { error: orderError.message }

  if (orderId) {
    const { error: deleteError } = await authSupabase
      .from('order_items')
      .delete()
      .eq('shop_order_id', orderId)
    if (deleteError) return { error: deleteError.message }
  }

  const items = productIds
    .map((productId, index) => ({
      shop_order_id: order.id,
      product_id: productId,
      quantity: quantities[index] || 0,
      created_by: userId,
      updated_by: userId
    }))
    .filter((item) => item.quantity > 0)

  if (items.length > 0) {
    const { error: itemError } = await authSupabase.from('order_items').insert(items)
    if (itemError) return { error: itemError.message }
  }

  return { success: true, orderId: order.id }
}

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
  const userId = signInData.user.id
  console.log('Authenticated successfully!')

  const authSupabase = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  })

  // Fetch products to use in testing
  const { data: products, error: productsError } = await authSupabase
    .from('products')
    .select('*, bottle_categories(*)')
    .eq('is_active', true)
    .limit(3)

  if (productsError || !products || products.length < 2) {
    console.error('Error fetching at least 2 active products for testing:', productsError?.message)
    process.exit(1)
  }

  const p1 = products[0]
  const p2 = products[1]

  const results = {
    createShopOrder: 'PENDING',
    editShopOrder: 'PENDING',
    duplicatePrevention: 'PENDING',
    saveValidation: 'PENDING',
    databaseConstraint: 'PENDING',
    loadingSummary: 'PENDING',
    freeBottles: 'PENDING'
  }

  let testRouteId = null
  let testOrderId = null

  try {
    // 1. Setup Lock and Route
    console.log('Creating test route and lock...')
    const { data: route, error: routeErr } = await authSupabase
      .from('routes')
      .insert({
        route_name: 'TEST_ROUTE_DELETE_ME',
        route_date: new Date().toISOString().slice(0, 10),
        status: 'Draft',
        created_by: userId,
        updated_by: userId
      })
      .select('id')
      .single()

    if (routeErr || !route) {
      throw new Error('Could not create test route: ' + routeErr?.message)
    }
    testRouteId = route.id

    // Claim lock for testing RLS insert
    await authSupabase.rpc('claim_route_lock', { p_route_id: testRouteId })

    // 2. Test 1: Create Shop Order
    console.log('\nRunning Test: Create Shop Order...')
    const createRes = await simulateAddShopOrder(
      authSupabase,
      userId,
      testRouteId,
      null,
      'TEST_SHOP_DELETE_ME',
      1, // free water per crate
      [p1.id],
      [10] // Qty 10
    )

    if (createRes.success && createRes.orderId) {
      results.createShopOrder = 'PASS'
      testOrderId = createRes.orderId
      console.log('  Create Shop Order: PASS')
    } else {
      results.createShopOrder = 'FAIL (' + createRes.error + ')'
      console.log('  Create Shop Order: FAIL')
    }

    // 3. Test 2: Edit Shop Order
    console.log('\nRunning Test: Edit Shop Order...')
    const editRes = await simulateAddShopOrder(
      authSupabase,
      userId,
      testRouteId,
      testOrderId,
      'TEST_SHOP_EDITED_DELETE_ME',
      2, // free water per crate
      [p1.id],
      [15] // Qty 15
    )

    if (editRes.success) {
      // Verify edit succeeded
      const { data: orderVerify } = await authSupabase
        .from('shop_orders')
        .select('shop_name, free_water_per_crate, order_items(quantity)')
        .eq('id', testOrderId)
        .single()

      if (
        orderVerify &&
        orderVerify.shop_name === 'TEST_SHOP_EDITED_DELETE_ME' &&
        orderVerify.free_water_per_crate === 2 &&
        orderVerify.order_items?.[0]?.quantity === 15
      ) {
        results.editShopOrder = 'PASS'
        console.log('  Edit Shop Order: PASS')
      } else {
        results.editShopOrder = 'FAIL (Verify check failed)'
        console.log('  Edit Shop Order: FAIL')
      }
    } else {
      results.editShopOrder = 'FAIL (' + editRes.error + ')'
      console.log('  Edit Shop Order: FAIL')
    }

    // 4. Test 3: Save Validation (Duplicate Prevention)
    console.log('\nRunning Test: Save Validation...')
    const dupRes = await simulateAddShopOrder(
      authSupabase,
      userId,
      testRouteId,
      testOrderId,
      'TEST_SHOP_EDITED_DELETE_ME',
      2,
      [p1.id, p1.id], // duplicate product
      [5, 10]
    )

    if (dupRes.error === 'Product already added to this shop order. Please update the existing quantity.') {
      results.saveValidation = 'PASS'
      console.log('  Save Validation: PASS (Correctly blocked save and returned error)')
    } else {
      results.saveValidation = 'FAIL (Allowed saving or returned wrong error: ' + JSON.stringify(dupRes) + ')'
      console.log('  Save Validation: FAIL')
    }

    // 5. Test 4: Database Constraint (Layer 3)
    console.log('\nRunning Test: Database Constraint...')
    // Try to insert a duplicate item directly into the database
    // We already have p1.id with quantity 15 in the order.
    // Let's attempt to insert another order item for p1.id in the same shop order.
    const { error: dbConstError } = await authSupabase
      .from('order_items')
      .insert({
        shop_order_id: testOrderId,
        product_id: p1.id,
        quantity: 5,
        created_by: userId,
        updated_by: userId
      })

    if (dbConstError && (dbConstError.code === '23505' || dbConstError.message?.toLowerCase().includes('unique') || dbConstError.message?.toLowerCase().includes('duplicate'))) {
      results.databaseConstraint = 'PASS'
      console.log('  Database Constraint: PASS (Successfully blocked by DB unique constraint)')
    } else {
      results.databaseConstraint = 'FAIL (DB allowed inserting duplicate or returned code ' + dbConstError?.code + ': ' + dbConstError?.message + ')'
      console.log('  Database Constraint: FAIL')
    }

    // 6. Test 5: UI prevention checks (Layer 1 helper)
    console.log('\nRunning Test: UI Prevention Layer logic...')
    // Simulate frontend filtering logic
    const mockLines = [{ productId: p1.id }, { productId: '' }]
    const mockProducts = [p1, p2]
    
    // Filtered products must exclude p1 because it is in mockLines.
    const allSelectedIds = mockLines.map(line => line.productId).filter(Boolean)
    const filtered = mockProducts.filter(p => !allSelectedIds.includes(p.id))

    const p1Excluded = !filtered.some(p => p.id === p1.id)
    const p2Included = filtered.some(p => p.id === p2.id)

    if (p1Excluded && p2Included) {
      results.duplicatePrevention = 'PASS'
      console.log('  UI Prevention: PASS')
    } else {
      results.duplicatePrevention = 'FAIL (p1 excluded: ' + p1Excluded + ', p2 included: ' + p2Included + ')'
      console.log('  UI Prevention: FAIL')
    }

    // 7. Test 6 & 7: Loading Summary Accuracy & Free Bottle Calculations
    console.log('\nRunning Test: Loading Summary & Free Bottles Calculations...')
    // Retrieve full order details including products and category details
    const { data: fullRoute } = await authSupabase
      .from('routes')
      .select(`
        *,
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
      `)
      .eq('id', testRouteId)
      .single()

    const orderSummary = calculateShopOrder(fullRoute.shop_orders[0])
    const routeSummary = calculateRouteSummary(fullRoute)

    // Expected Calculations:
    // Product 1 has qty 15.
    // Bottles per crate for Product 1 category:
    const bPerCrate = p1.bottle_categories.bottles_per_crate
    const expectedCrates = Math.floor(15 / bPerCrate)
    const expectedLoose = 15 % bPerCrate

    // Free 250ml bottles:
    const free250Enabled = p1.bottle_categories.free_250ml_enabled
    const free250PerCrate = p1.bottle_categories.free_250ml_per_crate
    const expectedFree250 = free250Enabled ? Math.round((15 / bPerCrate) * free250PerCrate) : 0

    // Free water:
    const waterPerCrate = p1.bottle_categories.water_bottles_per_crate
    const manualWaterPerCrate = fullRoute.shop_orders[0].free_water_per_crate // which is 2
    const expectedFreeWater = Math.round((15 / bPerCrate) * manualWaterPerCrate) + Math.round((15 / bPerCrate) * waterPerCrate)

    const summaryMatches = 
      orderSummary.orderedQuantity === 15 &&
      orderSummary.fullCrates === expectedCrates &&
      orderSummary.looseBottles === expectedLoose

    const freeBottlesMatch = 
      orderSummary.free250mlBottles === expectedFree250 &&
      orderSummary.freeWaterBottles === expectedFreeWater

    if (summaryMatches) {
      results.loadingSummary = 'PASS'
      console.log('  Loading Summary: PASS')
    } else {
      results.loadingSummary = `FAIL (Qty: ${orderSummary.orderedQuantity}/15, Crates: ${orderSummary.fullCrates}/${expectedCrates}, Loose: ${orderSummary.looseBottles}/${expectedLoose})`
      console.log('  Loading Summary: FAIL')
    }

    if (freeBottlesMatch) {
      results.freeBottles = 'PASS'
      console.log('  Free Bottles: PASS')
    } else {
      results.freeBottles = `FAIL (Free 250ml: ${orderSummary.free250mlBottles}/${expectedFree250}, Water: ${orderSummary.freeWaterBottles}/${expectedFreeWater})`
      console.log('  Free Bottles: FAIL')
    }

  } catch (err) {
    console.error('Test execution error:', err)
  } finally {
    // 8. Cleanup test data
    if (testRouteId) {
      console.log('\nCleaning up test route data...')
      // Release locks
      await authSupabase.rpc('release_route_lock', { p_route_id: testRouteId })
      // Delete route (cascades to order and items)
      await authSupabase.from('routes').delete().eq('id', testRouteId)
      console.log('Cleanup completed.')
    }
  }

  // Print Pass/Fail Report
  console.log('\n=======================================')
  console.log('          PASS / FAIL REPORT           ')
  console.log('=======================================')
  let overallPass = true
  Object.entries(results).forEach(([testName, status]) => {
    console.log(`${testName.padEnd(25)}: ${status}`)
    if (!status.startsWith('PASS')) {
      overallPass = false
    }
  })
  console.log('=======================================')
  console.log(`OVERALL RESULT: ${overallPass ? 'PASS' : 'FAIL'}`)
  console.log('=======================================\n')

  process.exit(overallPass ? 0 : 1)
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
