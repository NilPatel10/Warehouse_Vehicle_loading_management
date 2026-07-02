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

async function main() {
  const { data, error } = await supabase.from('damage_reasons').select('*')
  if (error) {
    console.error('Error fetching damage_reasons:', error.message)
    return
  }
  console.log('damage_reasons fetched successfully! Count:', data.length, 'Data:', data)
}

main()
