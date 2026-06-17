export function calculateItem(item) {
  const quantity = Number(item.quantity || 0)
  const bottlesPerCrate = Number(item.products?.bottle_categories?.bottles_per_crate || item.bottles_per_crate || 1)
  const category = item.products?.bottle_categories || item.category || {}
  // Full crates = integer floor division (e.g. 15 ÷ 9 = 1 full crate, not 1.66)
  const fullCrates = Math.floor(quantity / bottlesPerCrate)
  const looseBottles = quantity % bottlesPerCrate
  const free250Enabled = Boolean(category.free_250ml_enabled)
  // free_250ml_per_crate stores the rate per ordered bottle (business rule: 1 free 250ml per ordered bottle)
  const free250PerBottle = Number(category.free_250ml_per_crate || 0)
  // Category-level configured water: uses FULL CRATES (integer) — not float division
  const categoryWaterPerCrate = Number(category.water_bottles_per_crate || 0)

  return {
    orderedQuantity: quantity,
    bottlesPerCrate,
    fullCrates,
    looseBottles,
    // Stored separately so calculateShopOrder can apply the priority rule
    categoryWaterPerCrate,
    // Free 250ml = ordered quantity × rate per bottle (e.g. 18 bottles × 1 = 18 free 250ml)
    free250mlBottles: free250Enabled ? quantity * free250PerBottle : 0
  }
}

export function calculateShopOrder(order) {
  const items = order.order_items || []
  const manualWaterPerCrate = Number(order.free_water_per_crate || 0)

  // PRIORITY RULE:
  // If manual_water_per_crate > 0  → use ONLY manual value (ignore category)
  // Else                            → use ONLY category value
  const useManual = manualWaterPerCrate > 0

  const summary = items.reduce(
    (summary, item) => {
      const itemSummary = calculateItem(item)
      summary.orderedQuantity += itemSummary.orderedQuantity
      summary.fullCrates += itemSummary.fullCrates
      summary.looseBottles += itemSummary.looseBottles
      summary.free250mlBottles += itemSummary.free250mlBottles

      if (useManual) {
        // Manual override: full crates × manual rate — category scheme ignored
        summary.freeWaterBottles += itemSummary.fullCrates * manualWaterPerCrate
      } else {
        // Category default: full crates × category-configured rate
        summary.freeWaterBottles += itemSummary.fullCrates * itemSummary.categoryWaterPerCrate
      }

      return summary
    },
    {
      orderedQuantity: 0,
      fullCrates: 0,
      looseBottles: 0,
      freeWaterBottles: 0,
      free250mlBottles: 0
    }
  )

  summary.freeWaterBottles = Math.round(summary.freeWaterBottles)
  summary.free250mlBottles = Math.round(summary.free250mlBottles)

  // Expose which scheme was used and the effective rate for UI display
  summary.waterSchemeSource = useManual ? 'manual' : 'category'
  summary.effectiveWaterPerCrate = useManual
    ? manualWaterPerCrate
    : (() => {
        // Derive category rate from first item that has one (same for all items in order)
        for (const item of items) {
          const rate = Number(item.products?.bottle_categories?.water_bottles_per_crate || 0)
          if (rate > 0) return rate
        }
        return 0
      })()

  return summary
}

export function calculateRouteSummary(route) {
  const productMap = new Map()
  const totals = {
    orderedQuantity: 0,
    fullCrates: 0,
    looseBottles: 0,
    freeWaterBottles: 0,
    free250mlBottles: 0
  }

  for (const order of route.shop_orders || []) {
    const orderSummary = calculateShopOrder(order)
    totals.orderedQuantity += orderSummary.orderedQuantity
    totals.freeWaterBottles += orderSummary.freeWaterBottles
    totals.free250mlBottles += orderSummary.free250mlBottles

    const manualWaterPerCrate = Number(order.free_water_per_crate || 0)
    const useManual = manualWaterPerCrate > 0

    for (const item of order.order_items || []) {
      const product = item.products
      const itemSummary = calculateItem(item)

      // Apply the same priority rule per item for the product-level breakdown
      const itemWater = useManual
        ? itemSummary.fullCrates * manualWaterPerCrate
        : itemSummary.fullCrates * itemSummary.categoryWaterPerCrate

      const key = product?.id || item.product_id
      const current = productMap.get(key) || {
        productId: key,
        productName: product?.display_name || 'Unknown product',
        orderedQuantity: 0,
        bottlesPerCrate: itemSummary.bottlesPerCrate,
        fullCrates: 0,
        looseBottles: 0,
        freeWaterBottles: 0,
        free250mlBottles: 0
      }
      current.orderedQuantity += itemSummary.orderedQuantity
      current.freeWaterBottles += itemWater
      current.free250mlBottles += itemSummary.free250mlBottles
      productMap.set(key, current)
    }
  }

  const consolidatedProducts = Array.from(productMap.values()).map((product) => {
    const fullCrates = Math.floor(product.orderedQuantity / product.bottlesPerCrate)
    const looseBottles = product.orderedQuantity % product.bottlesPerCrate

    totals.fullCrates += fullCrates
    totals.looseBottles += looseBottles

    return {
      ...product,
      fullCrates,
      looseBottles,
      freeWaterBottles: Math.round(product.freeWaterBottles),
      free250mlBottles: Math.round(product.free250mlBottles)
    }
  })

  return {
    totals,
    products: consolidatedProducts.sort((a, b) => a.productName.localeCompare(b.productName))
  }
}
