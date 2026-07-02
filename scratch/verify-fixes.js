// Verification Script - Offline Mock & Logic Verification

// 1. Mock Products Database
const mockProducts = [
  { id: 'p1', brand_name: 'Coke', display_name: 'Coke 250ml', bottle_categories: { category_name: '250 ml' } },
  { id: 'p2', brand_name: 'Coke', display_name: 'Coke 500ml', bottle_categories: { category_name: '500 ml' } },
  { id: 'p3', brand_name: 'Coke', display_name: 'Coke 2.25L', bottle_categories: { category_name: '2.25 litre' } },
  { id: 'p4', brand_name: 'Sprite', display_name: 'Sprite 250ml', bottle_categories: { category_name: '250 ml' } },
  { id: 'p5', brand_name: 'Sprite', display_name: 'Sprite 2.25L', bottle_categories: { category_name: '2.25 litre' } },
  { id: 'p6', brand_name: 'Fanta', display_name: 'Fanta 250ml', bottle_categories: { category_name: '250 ml' } },
  { id: 'p7', brand_name: 'Thums Up', display_name: 'Thums Up 2.25L', bottle_categories: { category_name: '2.25 litre' } }
]

// Replicate ProductSelect.jsx filtering logic
function simulateProductFiltering(searchVal, excludeIds = []) {
  const query = searchVal.toLowerCase().trim()
  
  return mockProducts.filter((product) => {
    // Duplicate Product Rule: exclude already selected products
    if (excludeIds.includes(product.id)) {
      return false
    }
    
    if (!query) {
      return true
    }
    
    const brand = (product.brand_name || '').toLowerCase()
    const category = (product.bottle_categories?.category_name || '').toLowerCase()
    const displayName = (product.display_name || '').toLowerCase()
    
    // Search Rules: search brand AND bottle category AND display name
    return (
      brand.includes(query) ||
      category.includes(query) ||
      displayName.includes(query)
    )
  })
}

// Replicate actions.js assertRouteEditable & updateRouteStatus validation logic
class RoutePermissionSim {
  constructor() {
    this.routes = [
      { id: 'r-draft', route_name: 'Draft Route', status: 'Draft' },
      { id: 'r-ready', route_name: 'Ready Route', status: 'Ready To Load' },
      { id: 'r-dispatched', route_name: 'Dispatched Route', status: 'Dispatched' },
      { id: 'r-dropped', route_name: 'Dropped Route', status: 'Dropped' }
    ]
    this.shopOrders = []
  }

  // Simulates assertRouteEditable
  assertRouteEditable(routeId) {
    const route = this.routes.find(r => r.id === routeId)
    if (!route) throw new Error('Route not found.')
    if (route.status === 'Dispatched' || route.status === 'Dropped') {
      throw new Error(`This route is ${route.status.toLowerCase()} and cannot be edited. Change status back to Draft to make changes.`)
    }
  }

  // Simulates addShopOrder
  addShopOrder(routeId, shopName) {
    this.assertRouteEditable(routeId)
    const newOrder = { id: `o-${Date.now()}`, route_id: routeId, shop_name: shopName }
    this.shopOrders.push(newOrder)
    return { success: true, order: newOrder }
  }

  // Simulates deleteRoute
  deleteRoute(routeId) {
    const route = this.routes.find(r => r.id === routeId)
    if (!route) throw new Error('Route not found.')
    if (route.status === 'Dispatched' || route.status === 'Dropped') {
      throw new Error(`This route is ${route.status.toLowerCase()} and cannot be deleted. Change status back to Draft to make changes.`)
    }
    this.routes = this.routes.filter(r => r.id !== routeId)
    return { success: true }
  }

  // Simulates updateRouteStatus
  updateRouteStatus(routeId, targetStatus) {
    const route = this.routes.find(r => r.id === routeId)
    if (!route) throw new Error('Route not found.')
    
    const currentStatus = route.status

    // Check status transition logic
    if ((currentStatus === 'Dispatched' || currentStatus === 'Dropped') && targetStatus !== 'Draft') {
      throw new Error(`This route is ${currentStatus.toLowerCase()} and cannot be changed to ${targetStatus}. Revert to Draft first.`)
    }

    route.status = targetStatus
    return { success: true, route }
  }
}

function runVerification() {
  console.log('=== STARTING AUTOMATED TEST REPORT ===\n')
  let allPassed = true

  const assertTest = (title, condition) => {
    if (condition) {
      console.log(`[PASS] ${title}`)
    } else {
      console.log(`[FAIL] ${title}`)
      allPassed = false
    }
  }

  // --- Part 1: Product Search & Dropdown Filter ---
  console.log('--- 1. PRODUCT SEARCH & DROPDOWN FILTERING ---')
  
  // Test brand search
  const brandSearch = simulateProductFiltering('cok')
  const hasOnlyCoke = brandSearch.length === 3 && brandSearch.every(p => p.brand_name === 'Coke')
  assertTest('Typing "cok" filters by Brand (Coke)', hasOnlyCoke)

  // Test bottle category search
  const catSearch = simulateProductFiltering('250')
  const hasOnly250 = catSearch.length === 3 && catSearch.every(p => p.display_name.includes('250'))
  assertTest('Typing "250" filters by Bottle Category (250 ml)', hasOnly250)

  // Test 2.25 search
  const cat225Search = simulateProductFiltering('2.25')
  const hasOnly225 = cat225Search.length === 3 && cat225Search.every(p => p.display_name.includes('2.25'))
  assertTest('Typing "2.25" filters by Bottle Category (2.25 litre)', hasOnly225)

  // Test empty field shows full product list
  const emptySearch = simulateProductFiltering('')
  assertTest('Empty field displays full product list', emptySearch.length === mockProducts.length)

  // Test duplicate prevention rule
  // Assuming current shop order already has Coke 250ml (id 'p1') and Sprite 250ml (id 'p4')
  const noDupsSearch = simulateProductFiltering('', ['p1', 'p4'])
  const containsNoDuplicates = !noDupsSearch.some(p => p.id === 'p1' || p.id === 'p4') && noDupsSearch.length === mockProducts.length - 2
  assertTest('Duplicate products selected elsewhere are hidden', containsNoDuplicates)

  console.log('\n--- 2. ROUTE EDIT PERMISSIONS & STATUS CHANGE WORKFLOW ---')
  const sim = new RoutePermissionSim()

  // Test Draft editing
  let draftEdited = false
  try {
    sim.addShopOrder('r-draft', 'Shop 1')
    draftEdited = true
  } catch (e) {
    draftEdited = false
  }
  assertTest('Draft route editing is allowed', draftEdited)

  // Test Ready To Load editing
  let readyEdited = false
  try {
    sim.addShopOrder('r-ready', 'Shop 2')
    readyEdited = true
  } catch (e) {
    readyEdited = false
  }
  assertTest('Ready To Load route editing is allowed', readyEdited)

  // Test Dispatched editing is blocked
  let dispatchedEdited = false
  try {
    sim.addShopOrder('r-dispatched', 'Shop 3')
    dispatchedEdited = true
  } catch (e) {
    dispatchedEdited = false
  }
  assertTest('Dispatched route editing is BLOCKED', !dispatchedEdited)

  // Test Dropped editing is blocked
  let droppedEdited = false
  try {
    sim.addShopOrder('r-dropped', 'Shop 4')
    droppedEdited = true
  } catch (e) {
    droppedEdited = false
  }
  assertTest('Dropped route editing is BLOCKED', !droppedEdited)

  // Test delete route status rules
  let draftDeleteAllowed = false
  try {
    sim.deleteRoute('r-draft')
    draftDeleteAllowed = true
  } catch (e) {}
  assertTest('Draft route deletion is allowed', draftDeleteAllowed)

  let dispatchedDeleteBlocked = true
  try {
    sim.deleteRoute('r-dispatched')
    dispatchedDeleteBlocked = false
  } catch (e) {}
  assertTest('Dispatched route deletion is BLOCKED', dispatchedDeleteBlocked)

  // Test status transition restrictions
  let invalidTransitionBlocked = false
  try {
    sim.updateRouteStatus('r-dispatched', 'Ready To Load')
  } catch (e) {
    invalidTransitionBlocked = true
  }
  assertTest('Dispatched -> Ready To Load transition is BLOCKED', invalidTransitionBlocked)

  // Test status revert to Draft
  let revertDraftAllowed = false
  try {
    sim.updateRouteStatus('r-dispatched', 'Draft')
    revertDraftAllowed = true
  } catch (e) {}
  assertTest('Dispatched -> Draft transition is ALLOWED', revertDraftAllowed)

  let droppedRevertDraftAllowed = false
  try {
    sim.updateRouteStatus('r-dropped', 'Draft')
    droppedRevertDraftAllowed = true
  } catch (e) {}
  assertTest('Dropped -> Draft transition is ALLOWED', droppedRevertDraftAllowed)

  console.log('\n======================================')
  if (allPassed) {
    console.log('FINAL RESULT: ALL TESTS PASSED (PASS)')
    process.exit(0)
  } else {
    console.log('FINAL RESULT: TESTS FAILED (FAIL)')
    process.exit(1)
  }
}

runVerification()
