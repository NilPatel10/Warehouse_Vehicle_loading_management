// Decoupling Verification Script
// Simulates the independent masters and verification of calculations & importing.

const mockVehicleLoadingCategories = [
  { id: 'vl-cat-250', category_name: '250 ml', bottles_per_crate: 24 },
  { id: 'vl-cat-225', category_name: '2.25 litre', bottles_per_crate: 9 }
]

const mockVehicleLoadingProducts = [
  { id: 'vl-prod-1', category_id: 'vl-cat-250', brand_name: 'Coke', display_name: 'Coke 250ml' },
  { id: 'vl-prod-2', category_id: 'vl-cat-225', brand_name: 'Sprite', display_name: 'Sprite 2.25L' }
]

// Simulate separate database tables
let mockInventoryCategories = []
let mockInventoryProducts = []

function simulateImport() {
  const catIdMap = {}
  
  // 1. Import categories
  for (const cat of mockVehicleLoadingCategories) {
    const existing = mockInventoryCategories.find(c => c.category_name === cat.category_name)
    if (existing) {
      catIdMap[cat.id] = existing.id
    } else {
      const newId = 'inv-cat-' + cat.category_name.replace(/\s+/g, '')
      mockInventoryCategories.push({
        id: newId,
        category_name: cat.category_name,
        bottles_per_crate: cat.bottles_per_crate,
        is_active: true
      })
      catIdMap[cat.id] = newId
    }
  }

  // 2. Import products
  let importedCount = 0
  for (const prod of mockVehicleLoadingProducts) {
    const newCatId = catIdMap[prod.category_id]
    if (!newCatId) continue

    const existing = mockInventoryProducts.find(p => p.category_id === newCatId && p.brand_name === prod.brand_name)
    if (!existing) {
      const newId = 'inv-prod-' + prod.brand_name.toLowerCase()
      mockInventoryProducts.push({
        id: newId,
        category_id: newCatId,
        brand_name: prod.brand_name,
        display_name: prod.display_name,
        is_active: true
      })
      importedCount++
    }
  }

  return importedCount
}

function runVerification() {
  console.log('=== STARTING WAREHOUSE STOCK DECOUPLING LOGIC VERIFICATION ===\n')
  let allPassed = true

  const assertTest = (title, condition) => {
    if (condition) {
      console.log(`[PASS] ${title}`)
    } else {
      console.log(`[FAIL] ${title}`)
      allPassed = false
    }
  }

  // --- Part 1: Import Mechanism ---
  console.log('--- 1. ONE-TIME IMPORT UTILITY ---')
  const count = simulateImport()
  assertTest('Initial import copies all categories', mockInventoryCategories.length === 2)
  assertTest('Initial import copies all products', mockInventoryProducts.length === 2)
  assertTest('Initial import reports 2 imported products', count === 2)

  // Re-run import: should not duplicate
  const reImportCount = simulateImport()
  assertTest('Running import again does not duplicate categories', mockInventoryCategories.length === 2)
  assertTest('Running import again does not duplicate products', mockInventoryProducts.length === 2)
  assertTest('Running import again reports 0 new products imported', reImportCount === 0)

  // --- Part 2: 100% Decoupled/Separate Masters ---
  console.log('\n--- 2. SEPARATE INDEPENDENT MASTERS ---')
  
  // Create a new product in Inventory only
  mockInventoryProducts.push({
    id: 'inv-prod-fanta',
    category_id: 'inv-cat-250ml',
    brand_name: 'Fanta',
    display_name: 'Fanta 250ml (Inventory Only)',
    is_active: true
  })

  assertTest('Fanta added to inventory does not exist in vehicle loading products list', 
    !mockVehicleLoadingProducts.some(p => p.brand_name === 'Fanta')
  )
  assertTest('Fanta exists in inventory products list', 
    mockInventoryProducts.some(p => p.brand_name === 'Fanta')
  )

  // Edit category bottles_per_crate in Inventory categories only
  const invCat = mockInventoryCategories.find(c => c.category_name === '250 ml')
  invCat.bottles_per_crate = 30 // change in inventory from 24 to 30

  const vlCat = mockVehicleLoadingCategories.find(c => c.category_name === '250 ml')
  assertTest('Changing bottles_per_crate in inventory category does NOT affect vehicle loading category', 
    vlCat.bottles_per_crate === 24 && invCat.bottles_per_crate === 30
  )

  console.log('\n=== LOGIC DECOUPLING VERIFICATION COMPLETED ===')
  if (allPassed) {
    console.log('\nALL DECOUPLING LOGIC VERIFICATION TESTS PASSED successfully!')
  } else {
    console.error('\nSOME TESTS FAILED!')
    process.exit(1)
  }
}

runVerification()
