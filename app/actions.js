'use server'

import { revalidatePath } from 'next/cache'
import { requireServerSupabase } from '@/lib/supabase/queries'
import { todayISO } from '@/lib/utils'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'


function readText(formData, key, fallback = '') {
  return String(formData.get(key) || fallback).trim()
}

function readNumber(formData, key, fallback = 0) {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

async function assertRouteEditLock(supabase, routeId, userId) {
  const { data } = await supabase
    .from('route_locks')
    .select('route_id')
    .eq('route_id', routeId)
    .eq('locked_by', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!data) {
    throw new Error('Route edit lock is not active for this user.')
  }
}

export async function signInWithEmail(formData) {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) return { error: 'Supabase environment variables are missing.' }

  const email = readText(formData, 'email')
  const password = readText(formData, 'password')
  const remember = formData.get('remember') === 'on'

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const cookieStore = await cookies()
  if (remember) {
    cookieStore.set('sb-remember-me', 'true', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      secure: true,
      sameSite: 'lax'
    })
  } else {
    cookieStore.delete('sb-remember-me')
  }

  return { success: true, redirect: '/add-order', message: 'Signed in successfully!' }
}

export async function signUpWithEmail(formData) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key || url.includes('your-project-ref') || key.includes('your-supabase-publishable')) {
    return { error: 'Supabase environment variables are missing.' }
  }

  // Create a supabase client that doesn't persist session or touch cookies
  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  const email = readText(formData, 'email')
  const password = readText(formData, 'password')
  const fullName = readText(formData, 'full_name')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  if (error) return { error: error.message }

  revalidatePath('/settings')

  if (data && !data.session) {
    return {
      success: true,
      message: 'Staff account created. Please confirm via email link if enabled, or they can now sign in.'
    }
  }

  return { success: true, message: `Staff account for ${fullName || email} created successfully!` }
}

export async function signOut() {
  const { supabase } = await requireServerSupabase()
  if (supabase) await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete('sb-remember-me')
  return { success: true, redirect: '/login', message: 'Signed out successfully.' }
}

export async function createRoute(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const routeName = readText(formData, 'route_name')
  const routeDate = readText(formData, 'route_date', todayISO())
  const notes = readText(formData, 'notes')

  const { data, error } = await supabase
    .from('routes')
    .insert({
      route_name: routeName,
      route_date: routeDate,
      notes,
      status: 'Draft',
      created_by: user.id,
      updated_by: user.id
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/add-order')
  revalidatePath('/orders')
  return { success: true, redirect: `/routes/${data.id}/edit`, message: 'Route created successfully!' }
}

export async function addShopOrder(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const routeId = readText(formData, 'route_id')
  const orderId = readText(formData, 'order_id')
  const shopName = readText(formData, 'shop_name')
  const freeWaterPerCrate = readNumber(formData, 'free_water_per_crate')

  try {
    await assertRouteEditLock(supabase, routeId, user.id)
  } catch (err) {
    return { error: err.message }
  }

  let order
  let orderError

  if (orderId) {
    // Update existing shop order
    const { data, error } = await supabase
      .from('shop_orders')
      .update({
        shop_name: shopName,
        free_water_per_crate: freeWaterPerCrate,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('id')
      .single()

    order = data
    orderError = error
  } else {
    // Insert new shop order
    const { data, error } = await supabase
      .from('shop_orders')
      .insert({
        route_id: routeId,
        shop_name: shopName,
        free_water_per_crate: freeWaterPerCrate,
        created_by: user.id,
        updated_by: user.id
      })
      .select('id')
      .single()

    order = data
    orderError = error
  }

  if (orderError) return { error: orderError.message }

  // If updating, delete existing items first to overwrite
  if (orderId) {
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('shop_order_id', orderId)

    if (deleteError) return { error: deleteError.message }
  }

  const productIds = formData.getAll('product_id').map(String).filter(Boolean)
  const quantities = formData.getAll('quantity').map((value) => Number(value || 0))

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
  const items = productIds
    .map((productId, index) => ({
      shop_order_id: order.id,
      product_id: productId,
      quantity: quantities[index] || 0,
      created_by: user.id,
      updated_by: user.id
    }))
    .filter((item) => item.quantity > 0)

  if (items.length > 0) {
    const { error: itemError } = await supabase.from('order_items').insert(items)
    if (itemError) return { error: itemError.message }
  }

  await supabase.from('routes').update({ updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', routeId)

  revalidatePath(`/routes/${routeId}`)
  revalidatePath(`/routes/${routeId}/edit`)
  revalidatePath('/orders')
  return { success: true, message: orderId ? 'Shop order updated successfully!' : 'Shop order saved successfully!' }
}

export async function updateRouteStatus(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const routeId = readText(formData, 'route_id')
  const status = readText(formData, 'status')

  try {
    await assertRouteEditLock(supabase, routeId, user.id)
  } catch (err) {
    return { error: err.message }
  }

  const { error } = await supabase
    .from('routes')
    .update({ status, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', routeId)

  if (error) return { error: error.message }

  revalidatePath(`/routes/${routeId}`)
  revalidatePath('/orders')
  revalidatePath('/history')
  return { success: true, message: `Route status updated to ${status}!` }
}

export async function deleteOrderItem(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const routeId = readText(formData, 'route_id')
  const itemId = readText(formData, 'item_id')
  
  try {
    await assertRouteEditLock(supabase, routeId, user.id)
  } catch (err) {
    return { error: err.message }
  }

  const { error } = await supabase.from('order_items').delete().eq('id', itemId)
  if (error) return { error: error.message }

  await supabase.from('routes').update({ updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', routeId)
  revalidatePath(`/routes/${routeId}`)
  revalidatePath(`/routes/${routeId}/edit`)
  return { success: true, message: 'Order item deleted successfully.' }
}

export async function deleteShopOrder(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const routeId = readText(formData, 'route_id')
  const orderId = readText(formData, 'order_id')
  
  try {
    await assertRouteEditLock(supabase, routeId, user.id)
  } catch (err) {
    return { error: err.message }
  }

  const { error } = await supabase.from('shop_orders').delete().eq('id', orderId)
  if (error) return { error: error.message }

  await supabase.from('routes').update({ updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', routeId)
  revalidatePath(`/routes/${routeId}`)
  revalidatePath(`/routes/${routeId}/edit`)
  return { success: true, message: 'Shop order deleted successfully.' }
}

export async function upsertCategory(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const payload = {
    category_name: readText(formData, 'category_name'),
    bottles_per_crate: readNumber(formData, 'bottles_per_crate', 1),
    free_250ml_enabled: formData.get('free_250ml_enabled') === 'on',
    free_250ml_per_crate: readNumber(formData, 'free_250ml_per_crate'),
    water_bottles_per_crate: readNumber(formData, 'water_bottles_per_crate'),
    display_order: readNumber(formData, 'display_order'),
    is_active: formData.get('is_active') === 'on',
    updated_by: user.id
  }

  const query = id
    ? supabase.from('bottle_categories').update(payload).eq('id', id)
    : supabase.from('bottle_categories').insert({ ...payload, created_by: user.id })

  const { error } = await query
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: id ? 'Category updated successfully.' : 'Category added successfully.' }
}

export async function upsertProduct(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const brandName = readText(formData, 'brand_name')
  const categoryId = readText(formData, 'category_id')
  const explicitDisplayName = readText(formData, 'display_name')
  const { data: category } = await supabase.from('bottle_categories').select('category_name').eq('id', categoryId).single()
  const displayName = explicitDisplayName || `${brandName} ${category?.category_name || ''}`.trim()
  const payload = {
    category_id: categoryId,
    brand_name: brandName,
    display_name: displayName,
    is_active: formData.get('is_active') === 'on',
    updated_by: user.id
  }

  const query = id
    ? supabase.from('products').update(payload).eq('id', id)
    : supabase.from('products').insert({ ...payload, created_by: user.id })

  const { error } = await query
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: id ? 'Product updated successfully.' : 'Product added successfully.' }
}

export async function deleteCategory(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const { error } = await supabase.from('bottle_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: 'Category deleted successfully.' }
}

export async function deleteProduct(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: 'Product deleted successfully.' }
}

export async function updateAppSetting(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const key = readText(formData, 'key')
  const value = readText(formData, 'value')
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_by: user.id }, { onConflict: 'key' })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: 'App setting saved successfully.' }
}

export async function deleteRoute(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const routeId = readText(formData, 'route_id')

  try {
    // Assert edit lock for safety on deletion
    const { data: route } = await supabase.from('routes').select('route_date').eq('id', routeId).single()
    const today = new Date().toISOString().slice(0, 10)
    if (route && route.route_date >= today) {
      await assertRouteEditLock(supabase, routeId, user.id)
    }
  } catch (err) {
    return { error: err.message }
  }

  const { error } = await supabase.from('routes').delete().eq('id', routeId)
  if (error) return { error: error.message }

  revalidatePath('/add-order')
  revalidatePath('/orders')
  revalidatePath('/history')
  return { success: true, redirect: '/orders', message: 'Route deleted successfully.' }
}

export async function upsertScheme(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const payload = {
    category_id: readText(formData, 'category_id') || null,
    scheme_name: readText(formData, 'scheme_name'),
    scheme_type: readText(formData, 'scheme_type'),
    value_per_crate: readNumber(formData, 'value_per_crate', 0),
    is_active: formData.get('is_active') === 'on',
    updated_by: user.id
  }

  const query = id
    ? supabase.from('scheme_configurations').update(payload).eq('id', id)
    : supabase.from('scheme_configurations').insert({ ...payload, created_by: user.id })

  const { error } = await query
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: id ? 'Scheme updated successfully.' : 'Scheme added successfully.' }
}

export async function deleteScheme(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) return { error: 'Authentication required. Please sign in.' }

  const id = readText(formData, 'id')
  const { error } = await supabase.from('scheme_configurations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true, message: 'Scheme deleted successfully.' }
}

