import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

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
  auth: { persistSession: false, autoRefreshToken: false }
})

async function run() {
  console.log('Signing in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'warehouseadmin123@mailinator.com',
    password: 'password123'
  })

  if (signInError) {
    console.error('Sign in failed:', signInError.message)
    process.exit(1)
  }

  const authSupabase = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${signInData.session.access_token}`
      }
    }
  })

  console.log('Testing connection to damage_reasons table...')
  const { data, error } = await authSupabase.from('damage_reasons').select('id, reason_name').limit(1)
  if (error) {
    console.log('damage_reasons table does not exist or is not readable:', error.message)
  } else {
    console.log('damage_reasons table exists! Rows:', data)
  }
}

run()
