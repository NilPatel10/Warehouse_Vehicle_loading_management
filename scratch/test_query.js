import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read env variables manually without dotenv package dependency
const envFile = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[key] = value.trim()
  }
})
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

const routeSelect = `
  *,
  created_by_user:users!routes_created_by_fkey(id, full_name, email),
  updated_by_user:users!routes_updated_by_fkey(id, full_name, email),
  route_locks(*, users(id, full_name, email)),
  shop_orders(
    *,
    order_items(
      *,
      products(
        *,
        bottle_categories(*)
      )
    )
  )
`

async function run() {
  console.log('Logging in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'warehouseadmin123@mailinator.com',
    password: 'password123'
  })

  if (signInError) {
    console.error('Sign in failed:', signInError.message)
    process.exit(1)
  }

  const session = signInData.session
  console.log('Signed in successfully!')

  const authSupabase = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  })

  console.log('Fetching first route...')
  const { data: routeList, error: listError } = await authSupabase.from('routes').select('id, route_name').limit(1)
  if (listError) {
    console.error('Error listing routes:', listError)
    process.exit(1)
  }
  
  if (routeList.length === 0) {
    console.log('No routes found in the database. Creating one to test.')
    const { data: newRoute, error: createError } = await authSupabase
      .from('routes')
      .insert({
        route_name: 'Test Route',
        route_date: new Date().toISOString().slice(0, 10),
        status: 'Draft',
        created_by: signInData.user.id,
        updated_by: signInData.user.id
      })
      .select('id')
      .single()
    if (createError) {
      console.error('Error creating route:', createError)
      process.exit(1)
    }
    routeList.push(newRoute)
  }

  const routeId = routeList[0].id
  console.log(`Testing full getRoute query for route ID: ${routeId}...`)
  
  const { data, error } = await authSupabase.from('routes').select(routeSelect).eq('id', routeId).single()
  if (error) {
    console.error('QUERY FAILED WITH ERROR:')
    console.error(JSON.stringify(error, null, 2))
  } else {
    console.log('QUERY SUCCEEDED! Data fields:', Object.keys(data))
    console.log('Route Locks count:', data.route_locks?.length)
    console.log('Created by user:', data.created_by_user)
  }
}

run()
