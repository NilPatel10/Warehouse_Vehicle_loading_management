'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireServerSupabase } from '@/lib/supabase/queries'
import { todayISO } from '@/lib/utils'

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
  if (envMissing) redirect('/login?error=missing-env')

  const email = readText(formData, 'email')
  const password = readText(formData, 'password')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  redirect('/add-order')
}

export async function signUpWithEmail(formData) {
  const { supabase, envMissing } = await requireServerSupabase()
  if (envMissing) redirect('/login?error=missing-env')

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
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  if (data && !data.session) {
    redirect(`/login?message=${encodeURIComponent('Staff account created. Please check your email to confirm and activate your account.')}`)
  }

  redirect('/add-order')
}

export async function signOut() {
  const { supabase } = await requireServerSupabase()
  if (supabase) await supabase.auth.signOut()
  redirect('/login')
}

export async function createRoute(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

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

  if (error) throw new Error(error.message)

  revalidatePath('/add-order')
  revalidatePath('/orders')
  redirect(`/routes/${data.id}/edit`)
}

export async function addShopOrder(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const routeId = readText(formData, 'route_id')
  const shopName = readText(formData, 'shop_name')
  const freeWaterPerCrate = readNumber(formData, 'free_water_per_crate')

  await assertRouteEditLock(supabase, routeId, user.id)

  const { data: order, error: orderError } = await supabase
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

  if (orderError) throw new Error(orderError.message)

  const productIds = formData.getAll('product_id').map(String).filter(Boolean)
  const quantities = formData.getAll('quantity').map((value) => Number(value || 0))
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
    if (itemError) throw new Error(itemError.message)
  }

  await supabase.from('routes').update({ updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', routeId)

  revalidatePath(`/routes/${routeId}`)
  revalidatePath(`/routes/${routeId}/edit`)
  revalidatePath('/orders')
}

export async function updateRouteStatus(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const routeId = readText(formData, 'route_id')
  const status = readText(formData, 'status')

  await assertRouteEditLock(supabase, routeId, user.id)

  const { error } = await supabase
    .from('routes')
    .update({ status, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', routeId)

  if (error) throw new Error(error.message)

  revalidatePath(`/routes/${routeId}`)
  revalidatePath('/orders')
  revalidatePath('/history')
}

export async function deleteOrderItem(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const routeId = readText(formData, 'route_id')
  const itemId = readText(formData, 'item_id')
  await assertRouteEditLock(supabase, routeId, user.id)

  const { error } = await supabase.from('order_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)

  await supabase.from('routes').update({ updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', routeId)
  revalidatePath(`/routes/${routeId}`)
  revalidatePath(`/routes/${routeId}/edit`)
}

export async function deleteShopOrder(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const routeId = readText(formData, 'route_id')
  const orderId = readText(formData, 'order_id')
  await assertRouteEditLock(supabase, routeId, user.id)

  const { error } = await supabase.from('shop_orders').delete().eq('id', orderId)
  if (error) throw new Error(error.message)

  await supabase.from('routes').update({ updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', routeId)
  revalidatePath(`/routes/${routeId}`)
  revalidatePath(`/routes/${routeId}/edit`)
}

export async function upsertCategory(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

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
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function upsertProduct(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

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
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteCategory(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const id = readText(formData, 'id')
  const { error } = await supabase.from('bottle_categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteProduct(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const id = readText(formData, 'id')
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateAppSetting(formData) {
  const { supabase, user, envMissing } = await requireServerSupabase()
  if (envMissing || !user) redirect('/login')

  const key = readText(formData, 'key')
  const value = readText(formData, 'value')
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_by: user.id }, { onConflict: 'key' })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
