import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function run() {
  console.log('Starting seed script...')

  const email = 'warehouseadmin123@mailinator.com'
  const password = 'password123'

  // 1. Sign up
  console.log('Signing up user:', email)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'System Admin'
      }
    }
  })

  if (signUpError) {
    console.log('Sign up error (might already exist):', signUpError.message)
  } else {
    console.log('Sign up result:', signUpData.user ? 'User created' : 'No user')
  }

  // 2. Sign in
  console.log('Signing in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error('Sign in failed:', signInError.message)
    process.exit(1)
  }

  const session = signInData.session
  const userId = signInData.user.id
  console.log('Signed in successfully! User ID:', userId)

  // Re-create supabase client with session headers to ensure RLS is satisfied
  const authSupabase = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  })

  // 3. Insert App Settings
  console.log('Seeding app settings...')
  const settings = [
    { key: 'history_auto_delete_enabled', value: 'false', updated_by: userId },
    { key: 'history_retention_days', value: '7', updated_by: userId },
    { key: 'route_lock_timeout_seconds', value: '180', updated_by: userId }
  ]

  const { error: settingsErr } = await authSupabase
    .from('app_settings')
    .upsert(settings, { onConflict: 'key' })

  if (settingsErr) {
    console.error('Error seeding app settings:', settingsErr.message)
  } else {
    console.log('App settings seeded.')
  }

  // 4. Insert Bottle Categories
  console.log('Seeding bottle categories...')
  const categories = [
    { category_name: '110 ml tetra pack', bottles_per_crate: 30, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 0, display_order: 10, is_active: true, created_by: userId, updated_by: userId },
    { category_name: '250 ml', bottles_per_crate: 24, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 1, display_order: 20, is_active: true, created_by: userId, updated_by: userId },
    { category_name: '500 ml', bottles_per_crate: 24, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 0, display_order: 30, is_active: true, created_by: userId, updated_by: userId },
    { category_name: '600 ml', bottles_per_crate: 24, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 0, display_order: 40, is_active: true, created_by: userId, updated_by: userId },
    { category_name: '750 ml', bottles_per_crate: 12, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 0, display_order: 50, is_active: true, created_by: userId, updated_by: userId },
    { category_name: '1 litre', bottles_per_crate: 12, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 0, display_order: 60, is_active: true, created_by: userId, updated_by: userId },
    { category_name: '2.25 litre', bottles_per_crate: 9, free_250ml_enabled: true, free_250ml_per_crate: 1, water_bottles_per_crate: 0, display_order: 70, is_active: true, created_by: userId, updated_by: userId },
    { category_name: 'tin', bottles_per_crate: 24, free_250ml_enabled: false, free_250ml_per_crate: 0, water_bottles_per_crate: 0, display_order: 80, is_active: true, created_by: userId, updated_by: userId }
  ]

  const { data: seededCategories, error: categoriesErr } = await authSupabase
    .from('bottle_categories')
    .upsert(categories, { onConflict: 'category_name' })
    .select('*')

  if (categoriesErr) {
    console.error('Error seeding categories:', categoriesErr.message)
    process.exit(1)
  }
  console.log(`Bottle categories seeded. Count: ${seededCategories.length}`)

  // 5. Insert Products
  console.log('Seeding products...')
  const brands = ['Coke', 'Thums Up', 'Sprite', 'Fanta', 'Limca']
  const targetCategoryNames = ['250 ml', '500 ml', '600 ml', '750 ml', '1 litre', '2.25 litre']
  
  const productsToSeed = []
  
  for (const catName of targetCategoryNames) {
    const cat = seededCategories.find(c => c.category_name === catName)
    if (!cat) continue
    
    for (const brand of brands) {
      productsToSeed.push({
        category_id: cat.id,
        brand_name: brand,
        display_name: `${brand} ${cat.category_name}`,
        is_active: true,
        created_by: userId,
        updated_by: userId
      })
    }
  }

  const { error: productsErr } = await authSupabase
    .from('products')
    .upsert(productsToSeed, { onConflict: 'category_id,brand_name' })

  if (productsErr) {
    console.error('Error seeding products:', productsErr.message)
  } else {
    console.log('Products seeded successfully.')
  }

  console.log('Database seeding completed!')
}

run()
