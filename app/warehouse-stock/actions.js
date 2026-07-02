'use server'

import { revalidatePath } from 'next/cache'
import { requireServerSupabase } from '@/lib/supabase/queries'

function readText(formData, key, fallback = '') {
  return String(formData.get(key) || fallback).trim()
}

function readNumber(formData, key, fallback = 0) {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

// ----------------------------------------------------
// INVENTORY BOTTLE CATEGORIES CRUD
// ----------------------------------------------------
export async function upsertInventoryCategory(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const payload = {
    category_name: readText(formData, 'category_name'),
    bottles_per_crate: readNumber(formData, 'bottles_per_crate', 1),
    display_order: readNumber(formData, 'display_order'),
    is_active: formData.get('is_active') === 'on',
    updated_by: user.id,
    updated_at: new Date().toISOString()
  }

  const query = id
    ? supabase.from('inventory_bottle_categories').update(payload).eq('id', id)
    : supabase.from('inventory_bottle_categories').insert({ ...payload, created_by: user.id })

  const { error } = await query
  if (error) return { error: error.message }
  revalidatePath('/warehouse-stock/settings')
  return { success: true, message: id ? 'Inventory Category updated successfully.' : 'Inventory Category added successfully.' }
}

export async function deleteInventoryCategory(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const { error } = await supabase.from('inventory_bottle_categories').delete().eq('id', id)
  if (error) return { error: error.message + ' (Ensure no inventory products are associated with this category.)' }
  revalidatePath('/warehouse-stock/settings')
  return { success: true, message: 'Inventory Category deleted successfully.' }
}

// ----------------------------------------------------
// INVENTORY PRODUCTS CRUD
// ----------------------------------------------------
export async function upsertInventoryProduct(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const brandName = readText(formData, 'brand_name')
  const categoryId = readText(formData, 'category_id')
  const explicitDisplayName = readText(formData, 'display_name')
  
  const { data: category } = await supabase.from('inventory_bottle_categories').select('category_name').eq('id', categoryId).single()
  const displayName = explicitDisplayName || `${brandName} ${category?.category_name || ''}`.trim()
  
  const payload = {
    category_id: categoryId,
    brand_name: brandName,
    display_name: displayName,
    is_active: formData.get('is_active') === 'on',
    updated_by: user.id,
    updated_at: new Date().toISOString()
  }

  const query = id
    ? supabase.from('inventory_products').update(payload).eq('id', id)
    : supabase.from('inventory_products').insert({ ...payload, created_by: user.id })

  const { error } = await query
  if (error) return { error: error.message }
  revalidatePath('/warehouse-stock/settings')
  return { success: true, message: id ? 'Inventory Product updated successfully.' : 'Inventory Product added successfully.' }
}

export async function deleteInventoryProduct(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const { error } = await supabase.from('inventory_products').delete().eq('id', id)
  if (error) return { error: error.message + ' (Ensure there is no transaction history or stock record for this product.)' }
  revalidatePath('/warehouse-stock/settings')
  return { success: true, message: 'Inventory Product deleted successfully.' }
}

// ----------------------------------------------------
// MANUAL PRODUCT IMPORT ACTION
// ----------------------------------------------------
export async function importProductsFromVehicleLoading() {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  try {
    // 1. Fetch all vehicle loading categories
    const { data: vlCategories, error: catErr } = await supabase.from('bottle_categories').select('*')
    if (catErr) throw new Error(catErr.message)

    // 2. Fetch all vehicle loading products
    const { data: vlProducts, error: prodErr } = await supabase.from('products').select('*')
    if (prodErr) throw new Error(prodErr.message)

    // 3. Map to keep track of imported categories: old_id -> new_id
    const catIdMap = {}

    for (const cat of vlCategories) {
      // Find if inventory category with matching name already exists
      const { data: existingCat } = await supabase
        .from('inventory_bottle_categories')
        .select('id')
        .eq('category_name', cat.category_name)
        .maybeSingle()

      if (existingCat) {
        catIdMap[cat.id] = existingCat.id
      } else {
        // Create new inventory category copy
        const { data: newCat, error: insCatErr } = await supabase
          .from('inventory_bottle_categories')
          .insert({
            category_name: cat.category_name,
            bottles_per_crate: cat.bottles_per_crate,
            display_order: cat.display_order,
            is_active: cat.is_active,
            created_by: user.id,
            updated_by: user.id
          })
          .select('id')
          .single()

        if (insCatErr) throw new Error(insCatErr.message)
        catIdMap[cat.id] = newCat.id
      }
    }

    // 4. Import products
    let importedCount = 0
    for (const prod of vlProducts) {
      const newCatId = catIdMap[prod.category_id]
      if (!newCatId) continue // skip if no category mapping found

      // Check if product already exists in inventory
      const { data: existingProd } = await supabase
        .from('inventory_products')
        .select('id')
        .eq('category_id', newCatId)
        .eq('brand_name', prod.brand_name)
        .maybeSingle()

      if (!existingProd) {
        const { error: insProdErr } = await supabase
          .from('inventory_products')
          .insert({
            category_id: newCatId,
            brand_name: prod.brand_name,
            display_name: prod.display_name,
            is_active: prod.is_active,
            created_by: user.id,
            updated_by: user.id
          })

        if (insProdErr) throw new Error(insProdErr.message)
        importedCount++
      }
    }

    revalidatePath('/warehouse-stock')
    revalidatePath('/warehouse-stock/settings')
    return { success: true, message: `Successfully imported categories and ${importedCount} products.` }
  } catch (err) {
    return { error: 'Import failed: ' + err.message }
  }
}

// ----------------------------------------------------
// DAMAGE REASONS CRUD
// ----------------------------------------------------
export async function upsertDamageReason(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const reasonName = readText(formData, 'reason_name')
  const isActive = formData.get('is_active') === 'on'

  if (!reasonName) {
    return { error: 'Reason name is required.' }
  }

  const payload = {
    reason_name: reasonName,
    is_active: isActive,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  }

  let query
  if (id) {
    query = supabase.from('damage_reasons').update(payload).eq('id', id)
  } else {
    query = supabase.from('damage_reasons').insert({
      ...payload,
      created_by: user.id
    })
  }

  const { error } = await query
  if (error) {
    if (error.code === '23505') {
      return { error: 'This damage reason already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/warehouse-stock/settings')
  return { success: true, message: id ? 'Damage reason updated successfully.' : 'Damage reason added successfully.' }
}

export async function deleteDamageReason(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  if (!id) return { error: 'Reason ID is required.' }

  const { error } = await supabase.from('damage_reasons').delete().eq('id', id)
  if (error) {
    return { error: 'Cannot delete reason as it is referenced by existing transactions. Try making it inactive instead.' }
  }

  revalidatePath('/warehouse-stock/settings')
  return { success: true, message: 'Damage reason deleted successfully.' }
}

// ----------------------------------------------------
// TRANSACTION LOGS
// ----------------------------------------------------
export async function createStockEntry(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const transactionDate = readText(formData, 'transaction_date')
  const referenceNumber = readText(formData, 'reference_number') || null
  const remarks = readText(formData, 'remarks') || null

  const productIds = formData.getAll('product_id').map(String).filter(Boolean)
  const quantitiesCrates = formData.getAll('quantity_crates').map(val => Number(val || 0))

  if (productIds.length === 0) {
    return { error: 'At least one product is required.' }
  }

  // 1. Duplicate check
  const uniqueProductIds = new Set(productIds)
  if (uniqueProductIds.size !== productIds.length) {
    return { error: 'Duplicate products are not allowed. Please enter each product once.' }
  }

  // Validate quantities and build items list
  const items = []
  for (let i = 0; i < productIds.length; i++) {
    const prodId = productIds[i]
    const crates = quantitiesCrates[i]

    if (!Number.isInteger(crates) || crates <= 0) {
      return { error: 'Quantity must be a positive whole number of crates.' }
    }

    // Get bottles per crate config from separate inventory_products
    const { data: product, error: prodErr } = await supabase
      .from('inventory_products')
      .select('*, bottle_categories:inventory_bottle_categories(*)')
      .eq('id', prodId)
      .single()

    if (prodErr || !product) {
      return { error: `Inventory product not found: ${prodId}` }
    }

    const bottlesPerCrate = product.bottle_categories?.bottles_per_crate || 24
    const totalBottles = crates * bottlesPerCrate

    items.push({
      product_id: prodId,
      quantity_bottles: totalBottles,
      created_by: user.id,
      updated_by: user.id
    })
  }

  // Start Transaction (via direct inserts; database triggers will handle stock updates and sequencing atomicity)
  const { data: tx, error: txErr } = await supabase
    .from('inventory_transactions')
    .insert({
      transaction_type: 'Stock Entry',
      transaction_date: transactionDate,
      reference_number: referenceNumber,
      remarks: remarks,
      created_by: user.id,
      updated_by: user.id
    })
    .select('id, transaction_number')
    .single()

  if (txErr) return { error: txErr.message }

  // Assign transaction_id to items
  const itemsWithTx = items.map(item => ({
    ...item,
    transaction_id: tx.id
  }))

  const { error: itemsErr } = await supabase
    .from('inventory_transaction_items')
    .insert(itemsWithTx)

  if (itemsErr) {
    // Attempt clean up of transaction header on failure
    await supabase.from('inventory_transactions').delete().eq('id', tx.id)
    return { error: itemsErr.message }
  }

  revalidatePath('/warehouse-stock')
  revalidatePath('/warehouse-stock/reports')
  return {
    success: true,
    redirect: '/warehouse-stock',
    message: `Stock entry ${tx.transaction_number} created successfully!`
  }
}

export async function createDamageEntry(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const transactionDate = readText(formData, 'transaction_date')
  const damageReasonId = readText(formData, 'damage_reason_id')
  const remarks = readText(formData, 'remarks') || null

  const productIds = formData.getAll('product_id').map(String).filter(Boolean)
  const quantitiesBottles = formData.getAll('quantity_bottles').map(val => Number(val || 0))

  if (!damageReasonId) {
    return { error: 'Damage reason is mandatory.' }
  }

  if (productIds.length === 0) {
    return { error: 'At least one product is required.' }
  }

  // 1. Duplicate check
  const uniqueProductIds = new Set(productIds)
  if (uniqueProductIds.size !== productIds.length) {
    return { error: 'Duplicate products are not allowed.' }
  }

  // 2. Fetch current stock levels to check for negative stock
  const { data: stocks, error: stockErr } = await supabase
    .from('inventory_stock')
    .select('product_id, current_stock_bottles')

  if (stockErr) return { error: stockErr.message }

  const stockMap = new Map((stocks || []).map(s => [s.product_id, s.current_stock_bottles]))

  // Validate quantities and check stock availability
  const items = []
  for (let i = 0; i < productIds.length; i++) {
    const prodId = productIds[i]
    const bottles = quantitiesBottles[i]

    if (!Number.isInteger(bottles) || bottles <= 0) {
      return { error: 'Damage quantity must be a positive whole number of bottles.' }
    }

    const currentStock = stockMap.get(prodId) || 0
    if (bottles > currentStock) {
      return { error: 'Requested quantity exceeds available stock.' }
    }

    items.push({
      product_id: prodId,
      quantity_bottles: bottles,
      created_by: user.id,
      updated_by: user.id
    })
  }

  // Insert Transaction Header
  const { data: tx, error: txErr } = await supabase
    .from('inventory_transactions')
    .insert({
      transaction_type: 'Damage Entry',
      transaction_date: transactionDate,
      damage_reason_id: damageReasonId,
      remarks: remarks,
      created_by: user.id,
      updated_by: user.id
    })
    .select('id, transaction_number')
    .single()

  if (txErr) return { error: txErr.message }

  // Assign transaction_id
  const itemsWithTx = items.map(item => ({
    ...item,
    transaction_id: tx.id
  }))

  const { error: itemsErr } = await supabase
    .from('inventory_transaction_items')
    .insert(itemsWithTx)

  if (itemsErr) {
    // Attempt clean up of transaction header
    await supabase.from('inventory_transactions').delete().eq('id', tx.id)
    if (itemsErr.message.includes('exceeds available stock') || itemsErr.message.includes('inventory_stock_current_stock_bottles_check')) {
      return { error: 'Requested quantity exceeds available stock.' }
    }
    return { error: itemsErr.message }
  }

  revalidatePath('/warehouse-stock')
  revalidatePath('/warehouse-stock/reports')
  return {
    success: true,
    redirect: '/warehouse-stock',
    message: `Damage entry ${tx.transaction_number} created successfully!`
  }
}
