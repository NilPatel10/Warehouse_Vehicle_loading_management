export function getCrateSizes(data) {
  let categories = []
  if (Array.isArray(data)) {
    categories = data
  } else if (data) {
    categories = data.all_categories || []
    if (categories.length === 0) {
      const orders = data.shop_orders || (data.order_items ? [data] : [])
      for (const order of orders) {
        for (const item of order.order_items || []) {
          const cat = item.products?.bottle_categories || item.category
          if (cat && cat.category_name) {
            if (!categories.some(c => c.category_name === cat.category_name)) {
              categories.push(cat)
            }
          }
        }
      }
    }
  }

  const findCrateSize = (queryStr) => {
    const cleanQuery = queryStr.toLowerCase().replace(/[^a-z0-9]/g, '')
    const found = categories.find(c => {
      const cleanName = c.category_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return cleanName.includes(cleanQuery)
    })
    return found ? Number(found.bottles_per_crate) : null
  }

  let waterCrateSize = findCrateSize('water')
  let free250CrateSize = findCrateSize('250ml') || findCrateSize('250 ml')

  if (waterCrateSize === null) waterCrateSize = 24
  if (free250CrateSize === null) free250CrateSize = 24

  return {
    waterCrateSize,
    free250CrateSize
  }
}

export function calculateItem(item) {
  const quantity = Number(item.quantity || 0)
  const bottlesPerCrate = Number(item.products?.bottle_categories?.bottles_per_crate || item.bottles_per_crate || 1)
  const category = item.products?.bottle_categories || item.category || {}
  // Full crates = integer floor division (e.g. 15 ÷ 9 = 1 full crate, not 1.66)
  const fullCrates = Math.floor(quantity / bottlesPerCrate)
  const looseBottles = quantity % bottlesPerCrate
  const free250Enabled = Boolean(category.free_250ml_enabled)
  const free250PerCrate = Number(category.free_250ml_per_crate || 0)
  const categoryWaterPerCrate = Number(category.water_bottles_per_crate || 0)

  // Fractional water calculation for tests
  const configuredFreeWaterBottles = (quantity / bottlesPerCrate) * categoryWaterPerCrate

  return {
    orderedQuantity: quantity,
    bottlesPerCrate,
    fullCrates,
    looseBottles,
    categoryWaterPerCrate,
    configuredFreeWaterBottles,
    // Free 250ml = quantity * (free_250ml_per_crate / bottles_per_crate)
    free250mlBottles: free250Enabled ? quantity * (free250PerCrate / bottlesPerCrate) : 0
  }
}

export function calculateShopOrder(order) {
  const items = order.order_items || []
  const manualWaterPerCrate = Number(order.free_water_per_crate || 0)
  const useManual = manualWaterPerCrate > 0

  let manualFreeWaterBottles = 0
  let configuredFreeWaterBottles = 0

  const summary = items.reduce(
    (summary, item) => {
      const itemSummary = calculateItem(item)
      summary.orderedQuantity += itemSummary.orderedQuantity
      summary.fullCrates += itemSummary.fullCrates
      summary.looseBottles += itemSummary.looseBottles
      summary.free250mlBottles += itemSummary.free250mlBottles

      manualFreeWaterBottles += (itemSummary.orderedQuantity / itemSummary.bottlesPerCrate) * manualWaterPerCrate
      configuredFreeWaterBottles += itemSummary.configuredFreeWaterBottles

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

  summary.freeWaterBottles = useManual ? manualFreeWaterBottles : configuredFreeWaterBottles
  summary.manualFreeWaterBottles = manualFreeWaterBottles
  summary.configuredFreeWaterBottles = configuredFreeWaterBottles

  summary.freeWaterBottles = Math.round(summary.freeWaterBottles)
  summary.free250mlBottles = Math.round(summary.free250mlBottles)

  const { waterCrateSize, free250CrateSize } = getCrateSizes(order)
  summary.freeWaterCrates = Math.floor(summary.freeWaterBottles / waterCrateSize)
  summary.freeWaterLoose = summary.freeWaterBottles % waterCrateSize
  summary.free250mlCrates = Math.floor(summary.free250mlBottles / free250CrateSize)
  summary.free250mlLoose = summary.free250mlBottles % free250CrateSize

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

      // Apply the same priority rule per item for the product-level breakdown using fractional calculations
      const itemWater = useManual
        ? (itemSummary.orderedQuantity / itemSummary.bottlesPerCrate) * manualWaterPerCrate
        : itemSummary.configuredFreeWaterBottles

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

  const { waterCrateSize, free250CrateSize } = getCrateSizes(route)
  totals.freeWaterCrates = Math.floor(totals.freeWaterBottles / waterCrateSize)
  totals.freeWaterLoose = totals.freeWaterBottles % waterCrateSize
  totals.free250mlCrates = Math.floor(totals.free250mlBottles / free250CrateSize)
  totals.free250mlLoose = totals.free250mlBottles % free250CrateSize

  return {
    totals,
    products: consolidatedProducts.sort((a, b) => a.productName.localeCompare(b.productName))
  }
}
