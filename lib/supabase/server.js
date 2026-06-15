import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key || url.includes('your-project-ref') || key.includes('your-supabase-publishable')) {
    return null
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          const rememberMe = cookieStore.get('sb-remember-me')?.value === 'true'
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = { ...options }
            if (!rememberMe) {
              delete finalOptions.maxAge
              delete finalOptions.expires
            }
            cookieStore.set(name, value, finalOptions)
          })
        } catch {
          // Server Components cannot always write cookies; middleware refresh handles auth continuity.
        }
      }
    }
  })
}
