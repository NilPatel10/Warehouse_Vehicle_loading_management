'use client'

import { useEffect, useMemo, useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

export function RouteLockClient({ routeId, userId, timeoutSeconds = 180, children }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [lockState, setLockState] = useState({ loading: true, canEdit: false, owner: null })

  useEffect(() => {
    let alive = true
    let intervalId

    async function claimLock() {
      // Route locking is renewed by the active editor so other staff stay in read-only mode.
      const { data, error } = await supabase.rpc('claim_route_lock', {
        p_route_id: routeId,
        p_timeout_seconds: timeoutSeconds
      })

      if (!alive) return
      if (error || !data || data.locked_by !== userId) {
        const { data: existing } = await supabase
          .from('route_locks')
          .select('*, users(full_name, email)')
          .eq('route_id', routeId)
          .maybeSingle()
        setLockState({ loading: false, canEdit: false, owner: existing?.users || null })
        return
      }

      setLockState({ loading: false, canEdit: true, owner: null })
    }

    claimLock()
    intervalId = window.setInterval(claimLock, Math.max(30, Math.floor(timeoutSeconds / 2)) * 1000)

    return () => {
      alive = false
      window.clearInterval(intervalId)
      supabase.rpc('release_route_lock', { p_route_id: routeId })
    }
  }, [routeId, supabase, timeoutSeconds, userId])

  if (lockState.loading) {
    return <Badge variant="secondary"><Lock /> Checking lock</Badge>
  }

  if (!lockState.canEdit) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          This route is locked by {lockState.owner?.full_name || lockState.owner?.email || 'another user'}. You can view it in read-only mode.
        </div>
        {children({ canEdit: false })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
        <span className="inline-flex items-center gap-2"><Unlock className="h-4 w-4" /> Edit lock active</span>
      </div>
      {children({ canEdit: true })}
    </div>
  )
}
