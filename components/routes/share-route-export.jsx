'use client'

import { Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ShareRouteExport({ routeName, json }) {
  async function shareRoute() {
    try {
      const file = new File([json], `${routeName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-route.json`, {
        type: 'application/json'
      })

      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: routeName,
          text: 'Warehouse route backup',
          files: [file]
        })
        toast.success('Route shared successfully!')
        return
      }

      const url = URL.createObjectURL(file)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.name
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Route JSON downloaded successfully!')
    } catch (err) {
      toast.error('Failed to export route: ' + err.message)
    }
  }

  return (
    <Button type="button" className="w-full" onClick={shareRoute}>
      {typeof navigator !== 'undefined' && navigator.canShare ? <Share2 /> : <Download />}
      Share or download route JSON
    </Button>
  )
}
