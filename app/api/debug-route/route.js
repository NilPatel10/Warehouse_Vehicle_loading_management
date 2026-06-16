import { NextResponse } from 'next/server'
import { calculateItem, calculateShopOrder, calculateRouteSummary } from '@/lib/calculations'

export async function GET() {
  const results = {
    testCalculateItemFractionalWater: 'PENDING',
    testCalculateShopOrderFractionalWater: 'PENDING',
    testCalculateRouteSummaryFractionalWater: 'PENDING'
  }

  try {
    // 1. Test calculateItem with fractional crates
    // Category has water_bottles_per_crate = 3 and bottles_per_crate = 9.
    // Order 15 bottles. Fractional crates = 15/9 = 1.667.
    // Expected configuredFreeWaterBottles = 1.667 * 3 = 5.
    const item = {
      quantity: 15,
      products: {
        display_name: 'Test Product 2.25L',
        bottle_categories: {
          category_name: '2.25Litre',
          bottles_per_crate: 9,
          free_250ml_enabled: true,
          free_250ml_per_crate: 9,
          water_bottles_per_crate: 3
        }
      }
    }
    const itemSummary = calculateItem(item)
    if (
      Math.abs(itemSummary.configuredFreeWaterBottles - 5) < 0.01 &&
      Math.abs(itemSummary.free250mlBottles - 15) < 0.01
    ) {
      results.testCalculateItemFractionalWater = 'PASS'
    } else {
      results.testCalculateItemFractionalWater = `FAIL (configuredFreeWaterBottles: ${itemSummary.configuredFreeWaterBottles}, free250ml: ${itemSummary.free250mlBottles})`
    }

    // 2. Test calculateShopOrder with fractional crates consolidation
    // Order has 2 items: 5 bottles and 4 bottles of 9/crate. Total quantity = 9 bottles = 1 crate.
    // manualWaterPerCrate = 4.
    // Expected manualFreeWaterBottles = 4.
    const order = {
      free_water_per_crate: 4,
      order_items: [
        {
          quantity: 5,
          products: {
            id: 'prod-1',
            display_name: 'Product 1',
            bottle_categories: {
              bottles_per_crate: 9,
              free_250ml_enabled: false,
              free_250ml_per_crate: 0,
              water_bottles_per_crate: 0
            }
          }
        },
        {
          quantity: 4,
          products: {
            id: 'prod-2',
            display_name: 'Product 2',
            bottle_categories: {
              bottles_per_crate: 9,
              free_250ml_enabled: false,
              free_250ml_per_crate: 0,
              water_bottles_per_crate: 0
            }
          }
        }
      ]
    }
    const orderSummary = calculateShopOrder(order)
    if (orderSummary.manualFreeWaterBottles === 4) {
      results.testCalculateShopOrderFractionalWater = 'PASS'
    } else {
      results.testCalculateShopOrderFractionalWater = `FAIL (manualFreeWaterBottles: ${orderSummary.manualFreeWaterBottles}, expected 4)`
    }

    // 3. Test calculateRouteSummary
    const route = {
      shop_orders: [order]
    }
    const routeSummary = calculateRouteSummary(route)
    if (
      routeSummary.totals.freeWaterBottles === 4 &&
      routeSummary.products[0].freeWaterBottles === 2 && // Coke/Sprite split proportionally
      routeSummary.products[1].freeWaterBottles === 2
    ) {
      results.testCalculateRouteSummaryFractionalWater = 'PASS'
    } else {
      results.testCalculateRouteSummaryFractionalWater = `FAIL (totals.freeWaterBottles: ${routeSummary.totals.freeWaterBottles}, products: ${JSON.stringify(routeSummary.products)})`
    }

  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }

  const overallPass = Object.values(results).every(status => status === 'PASS')
  return NextResponse.json({
    overallPass,
    results
  })
}
