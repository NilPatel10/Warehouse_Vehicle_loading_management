export function calculateItem(item) {
  const quantity = Number(item.quantity || 0)
  const bottlesPerCrate = Number(item.products?.bottle_categories?.bottles_per_crate || item.bottles_per_crate || 1)
  const category = item.products?.bottle_categories || item.category || {}
  const fullCrates = Math.floor(quantity / bottlesPerCrate)
  const looseBottles = quantity % bottlesPerCrate
  const free250Enabled = Boolean(category.free_250ml_enabled)
  const free250PerCrate = Number(category.free_250ml_per_crate || 0)
  const waterPerCrate = Number(category.water_bottles_per_crate || 0)

  return {
    orderedQuantity: quantity,
    bottlesPerCrate,
    fullCrates,
    looseBottles,
    // This category-level water bonus is only used for products configured to add water freebies.
    configuredFreeWaterBottles: fullCrates * waterPerCrate,
    free250mlBottles: free250Enabled ? fullCrates * free250PerCrate : 0
  }
}

export function calculateShopOrder(order) {
  const items = order.order_items || []
  const manualWaterPerCrate = Number(order.free_water_per_crate || 0)

  const summary = items.reduce(
    (summary, item) => {
      const itemSummary = calculateItem(item)
      summary.orderedQuantity += itemSummary.orderedQuantity
      summary.fullCrates += itemSummary.fullCrates
      summary.looseBottles += itemSummary.looseBottles
      summary.free250mlBottles += itemSummary.free250mlBottles
      summary.configuredFreeWaterBottles += itemSummary.configuredFreeWaterBottles
      return summary
    },
    {
      orderedQuantity: 0,
      fullCrates: 0,
      looseBottles: 0,
      manualFreeWaterBottles: 0,
      configuredFreeWaterBottles: 0,
      freeWaterBottles: 0,
      free250mlBottles: 0
    }
  )

  // Free water bottles are calculated per order from total crates plus any category configured water bonus.
  summary.manualFreeWaterBottles = summary.fullCrates * manualWaterPerCrate
  summary.freeWaterBottles = summary.manualFreeWaterBottles + summary.configuredFreeWaterBottles
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
    totals.fullCrates += orderSummary.fullCrates
    totals.looseBottles += orderSummary.looseBottles
    totals.freeWaterBottles += orderSummary.freeWaterBottles
    totals.free250mlBottles += orderSummary.free250mlBottles

    for (const item of order.order_items || []) {
      const product = item.products
      const itemSummary = calculateItem(item)
      const itemManualFreeWater = itemSummary.fullCrates * Number(order.free_water_per_crate || 0)
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
      current.fullCrates += itemSummary.fullCrates
      current.looseBottles += itemSummary.looseBottles
      current.freeWaterBottles += itemManualFreeWater + itemSummary.configuredFreeWaterBottles
      current.free250mlBottles += itemSummary.free250mlBottles
      productMap.set(key, current)
    }
  }

  return {
    totals,
    products: Array.from(productMap.values()).sort((a, b) => a.productName.localeCompare(b.productName))
  }
}
