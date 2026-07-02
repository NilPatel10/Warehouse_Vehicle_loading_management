import { calculateRouteSummary, getCrateSizes } from '../lib/calculations.js'

function runTests() {
  console.log('=== STARTING PACKAGING CALCULATION VALIDATION ===\n')
  let allPassed = true

  const assertEqual = (name, actual, expected) => {
    if (actual === expected) {
      console.log(`[PASS] ${name}`)
    } else {
      console.error(`[FAIL] ${name} (Expected: ${expected}, Got: ${actual})`)
      allPassed = false
    }
  }

  // Define mock categories configuration
  const mockCategories = [
    { id: 'cat-250', category_name: '250 ml', bottles_per_crate: 28 },
    { id: 'cat-water', category_name: 'Water', bottles_per_crate: 24 }
  ]

  // Test Case 1 & 2: Exact Full Crate & Partial Crate logic directly in getCrateSizes/calculate
  console.log('--- TEST 1: Exact Full Crate & Partial Crate ---')
  const { waterCrateSize, free250CrateSize } = getCrateSizes(mockCategories)
  assertEqual('getCrateSizes for 250ml finds 28', free250CrateSize, 28)
  assertEqual('getCrateSizes for water finds 24', waterCrateSize, 24)

  // 250ml Exact Crate: 84 bottles / 28 per crate
  const exactCrates = Math.floor(84 / free250CrateSize)
  const exactLoose = 84 % free250CrateSize
  assertEqual('84 Bottles / 28 per crate: Crates', exactCrates, 3)
  assertEqual('84 Bottles / 28 per crate: Loose', exactLoose, 0)

  // 250ml Partial Crate: 75 bottles / 28 per crate
  const partialCrates = Math.floor(75 / free250CrateSize)
  const partialLoose = 75 % free250CrateSize
  assertEqual('75 Bottles / 28 per crate: Crates', partialCrates, 2)
  assertEqual('75 Bottles / 28 per crate: Loose', partialLoose, 19)

  // Water Partial Crate: 53 bottles / 24 per crate
  const waterCrates = Math.floor(53 / waterCrateSize)
  const waterLoose = 53 % waterCrateSize
  assertEqual('53 Bottles / 24 per crate: Crates', waterCrates, 2)
  assertEqual('53 Bottles / 24 per crate: Loose', waterLoose, 5)


  // Test Case 3 & 4: Route Level Consolidation with Mixed Bottle Categories
  console.log('\n--- TEST 2: Route Level Consolidation with Mixed Bottle Categories ---')
  // We construct a mock route where:
  // - Order 1 has 18 bottles of 2.25L (9 per crate) -> 2 full crates
  //   - Category '2.25 litre' has water_bottles_per_crate: 26 -> 2 crates * 26 = 52 water bottles
  //   - Category '2.25 litre' has free_250ml_enabled: true, free_250ml_per_crate: 36 -> 18 bottles * (36/9) = 72 free 250ml bottles
  // - Order 2 has 9 bottles of 2.25L (9 per crate) -> 1 full crate
  //   - manual override: free_water_per_crate = 1 -> 1 crate * 1 = 1 water bottle
  //   - free 250ml: 9 bottles * (36/9) = 36 free 250ml bottles
  // Total Free Water = 52 + 1 = 53 Bottles
  // Total Free 250ml = 72 + 36 = 108 Bottles
  const mockRoute = {
    all_categories: mockCategories,
    shop_orders: [
      {
        free_water_per_crate: 0,
        order_items: [
          {
            quantity: 18,
            products: {
              id: 'prod-2.25',
              display_name: 'Coke 2.25L',
              bottle_categories: {
                category_name: '2.25 litre',
                bottles_per_crate: 9,
                free_250ml_enabled: true,
                free_250ml_per_crate: 36,
                water_bottles_per_crate: 26
              }
            }
          }
        ]
      },
      {
        free_water_per_crate: 1, // manual override
        order_items: [
          {
            quantity: 9,
            products: {
              id: 'prod-2.25-2',
              display_name: 'Sprite 2.25L',
              bottle_categories: {
                category_name: '2.25 litre',
                bottles_per_crate: 9,
                free_250ml_enabled: true,
                free_250ml_per_crate: 36,
                water_bottles_per_crate: 0
              }
            }
          }
        ]
      }
    ]
  }

  const summary = calculateRouteSummary(mockRoute)
  assertEqual('Route consolidated Free Water Bottles', summary.totals.freeWaterBottles, 53)
  assertEqual('Route consolidated Free Water Crates (53 / 24)', summary.totals.freeWaterCrates, 2)
  assertEqual('Route consolidated Free Water Loose (53 % 24)', summary.totals.freeWaterLoose, 5)

  assertEqual('Route consolidated Free 250ml Bottles', summary.totals.free250mlBottles, 108)
  assertEqual('Route consolidated Free 250ml Crates (108 / 28)', summary.totals.free250mlCrates, 3)
  assertEqual('Route consolidated Free 250ml Loose (108 % 28)', summary.totals.free250mlLoose, 24)


  // Test Case 5: Configuration Change (modifying categories settings)
  console.log('\n--- TEST 3: Configuration Change ---')
  const changedCategories = [
    { id: 'cat-250', category_name: '250 ml', bottles_per_crate: 24 }, // changed from 28 to 24
    { id: 'cat-water', category_name: 'Water', bottles_per_crate: 10 } // changed from 24 to 10
  ]
  const mockRouteWithChangedConfig = {
    ...mockRoute,
    all_categories: changedCategories
  }
  const summaryChanged = calculateRouteSummary(mockRouteWithChangedConfig)

  assertEqual('After Config Change: Free Water Bottles remains same', summaryChanged.totals.freeWaterBottles, 53)
  assertEqual('After Config Change: Free Water Crates (53 / 10)', summaryChanged.totals.freeWaterCrates, 5)
  assertEqual('After Config Change: Free Water Loose (53 % 10)', summaryChanged.totals.freeWaterLoose, 3)

  assertEqual('After Config Change: Free 250ml Bottles remains same', summaryChanged.totals.free250mlBottles, 108)
  assertEqual('After Config Change: Free 250ml Crates (108 / 24)', summaryChanged.totals.free250mlCrates, 4)
  assertEqual('After Config Change: Free 250ml Loose (108 % 24)', summaryChanged.totals.free250mlLoose, 12)

  console.log('\n==================================================')
  if (allPassed) {
    console.log('FINAL VALIDATION RESULT: ALL TESTS PASSED (PASS)')
    process.exit(0)
  } else {
    console.error('FINAL VALIDATION RESULT: TESTS FAILED (FAIL)')
    process.exit(1)
  }
}

runTests()
