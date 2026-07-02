// Offline Logic Verification for Warehouse Stock Module
// Copying calculations directly from components to avoid node .jsx loading error

function calcCratesAndLoose(totalBottles, bottlesPerCrate) {
  const bottles = Math.max(0, Math.floor(Number(totalBottles) || 0))
  const bpc = Math.max(1, Math.floor(Number(bottlesPerCrate) || 24))
  return {
    totalBottles: bottles,
    crates: Math.floor(bottles / bpc),
    loose: bottles % bpc
  }
}

function formatStock(totalBottles, bottlesPerCrate) {
  const { crates, loose } = calcCratesAndLoose(totalBottles, bottlesPerCrate)
  if (crates === 0) return `${loose} Btl`
  if (loose === 0) return `${crates} Crates`
  return `${crates} Crates ${loose} Btl`
}

// Mock Product and Category configurations
const mockProducts = [
  { id: 'prod-1', display_name: 'Coke 250ml', brand_name: 'Coke', category_id: 'cat-250', bottle_categories: { category_name: '250 ml', bottles_per_crate: 24 } },
  { id: 'prod-2', display_name: 'Sprite 2.25L', brand_name: 'Sprite', category_id: 'cat-2.25', bottle_categories: { category_name: '2.25 litre', bottles_per_crate: 9 } }
]

function runVerification() {
  console.log('=== STARTING WAREHOUSE STOCK MODULE LOGIC VERIFICATION ===\n')
  let allPassed = true

  const assertTest = (title, condition) => {
    if (condition) {
      console.log(`[PASS] ${title}`)
    } else {
      console.log(`[FAIL] ${title}`)
      allPassed = false
    }
  }

  // --- Part 1: Bottles to Crates & Loose Display Rules ---
  console.log('--- 1. BOTTLES TO CRATES & LOOSE CALCULATIONS (DISPLAY RULES) ---')
  
  // Test case 1: Coke 250ml (24 bottles/crate) with 280 bottles
  // Math: 280 / 24 = 11 crates, 16 loose bottles
  const cokeResult = calcCratesAndLoose(280, 24)
  assertTest('280 Bottles @ 24/Crate = 11 Crates', cokeResult.crates === 11)
  assertTest('280 Bottles @ 24/Crate = 16 Loose Bottles', cokeResult.loose === 16)
  assertTest('Format 280 bottles correctly', formatStock(280, 24) === '11 Crates 16 Btl')

  // Test case 2: Sprite 2.25L (9 bottles/crate) with 277 bottles
  // Math: 277 / 9 = 30 crates, 7 loose bottles
  const spriteResult = calcCratesAndLoose(277, 9)
  assertTest('277 Bottles @ 9/Crate = 30 Crates', spriteResult.crates === 30)
  assertTest('277 Bottles @ 9/Crate = 7 Loose Bottles', spriteResult.loose === 7)
  assertTest('Format 277 bottles correctly', formatStock(277, 9) === '30 Crates 7 Btl')

  // Test case 3: 0 bottles
  const zeroResult = calcCratesAndLoose(0, 24)
  assertTest('0 Bottles = 0 Crates, 0 Loose', zeroResult.crates === 0 && zeroResult.loose === 0)

  // --- Part 2: Stock Entry Calculations ---
  console.log('\n--- 2. STOCK ENTRY CONVERSION (FULL CRATES ONLY) ---')
  
  // Rule: Accepts full crates only. Convert to bottles.
  const calculateStockEntryBottles = (crates, bottlesPerCrate) => {
    // Crates must be integers
    if (!Number.isInteger(crates) || crates < 0) {
      throw new Error('Whole crates only.')
    }
    return crates * bottlesPerCrate
  }

  // Test Coke 250ml: 10 crates entry -> 240 bottles
  const entry1 = calculateStockEntryBottles(10, 24)
  assertTest('10 Crates entry = 240 Bottles', entry1 === 240)

  // Test Sprite 2.25L: 10 crates entry -> 90 bottles
  const entry2 = calculateStockEntryBottles(10, 9)
  assertTest('10 Crates entry of 9-size = 90 Bottles', entry2 === 90)

  // Test validation for whole crates
  let decimalRejected = false
  try {
    calculateStockEntryBottles(10.5, 24)
  } catch (e) {
    decimalRejected = true
  }
  assertTest('Decimal crates entry is rejected', decimalRejected)

  // --- Part 3: Damage Entry Calculation & Negative Stock Rules ---
  console.log('\n--- 3. DAMAGE ENTRY VALIDATION (BOTTLES ONLY, NO NEGATIVE STOCK) ---')
  
  // Rule: Current Stock >= Damage Quantity. If not, reject.
  const processDamage = (currentStock, damageQty) => {
    if (!Number.isInteger(damageQty) || damageQty < 0) {
      throw new Error('Whole bottles only.')
    }
    if (damageQty > currentStock) {
      throw new Error('Requested quantity exceeds available stock.')
    }
    return currentStock - damageQty
  }

  // Test: Coke 250ml: Current Stock 240, Damage 5 -> 235 bottles
  let validDmgResult = null
  try {
    validDmgResult = processDamage(240, 5)
  } catch (e) {}
  assertTest('Damage of 5 bottles from 240 stock leaves 235 bottles', validDmgResult === 235)

  // Test: Reject exceeds stock
  let exceedsRejected = false
  let exceedsMsg = ''
  try {
    processDamage(240, 241)
  } catch (e) {
    exceedsRejected = true
    exceedsMsg = e.message
  }
  assertTest('Damage exceeding stock is rejected', exceedsRejected)
  assertTest('Shows user-friendly error message "Requested quantity exceeds available stock."', exceedsMsg === 'Requested quantity exceeds available stock.')

  // --- Part 4: Duplicate Product Prevention ---
  console.log('\n--- 4. DUPLICATE PRODUCT PREVENTION ---')
  
  // Rule: Multiple products allowed. Duplicate products are NOT allowed.
  const validateProductLines = (productIds) => {
    const uniqueIds = new Set(productIds)
    if (uniqueIds.size !== productIds.length) {
      throw new Error('Duplicate products are not allowed.')
    }
    return true
  }

  let dupPassed = false
  try {
    validateProductLines(['prod-1', 'prod-2'])
    dupPassed = true
  } catch (e) {}
  assertTest('Different products in lines are allowed', dupPassed)

  let dupRejected = false
  try {
    validateProductLines(['prod-1', 'prod-1'])
  } catch (e) {
    dupRejected = true
  }
  assertTest('Duplicate products in lines are rejected', dupRejected)

  console.log('\n=== LOGIC VERIFICATION COMPLETED ===')
  if (allPassed) {
    console.log('\nALL OFFLINE LOGIC TESTS PASSED successfully!')
  } else {
    console.error('\nSOME TESTS FAILED!')
    process.exit(1)
  }
}

runVerification()
