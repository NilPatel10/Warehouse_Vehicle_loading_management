'use client'

import { Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ShareRouteExport({ routeName, json }) {
  async function shareRoute() {
    const file = new File([json], `${routeName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-route.json`, {
      type: 'application/json'
    })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: routeName,
        text: 'Warehouse route backup',
        files: [file]
      })
      return
    }

    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button type="button" className="w-full" onClick={shareRoute}>
      {typeof navigator !== 'undefined' && navigator.canShare ? <Share2 /> : <Download />}
      Share or download route JSON
    </Button>
  )
}
