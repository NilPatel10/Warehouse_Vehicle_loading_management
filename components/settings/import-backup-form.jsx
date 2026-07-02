'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function ImportBackupForm() {
  const [loading, setLoading] = useState(false)

  async function importBackup(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const file = formData.get('backup')
    if (!file || !file.name) {
      toast.error('Please select a backup JSON file first.')
      return
    }

    setLoading(true)

    try {
      const text = await file.text()
      JSON.parse(text) // Client-side check

      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      })

      if (response.ok) {
        toast.success('Backup Imported')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        const errData = await response.json().catch(() => ({}))
        toast.error(errData.error || 'Backup import failed.')
      }
    } catch (err) {
      toast.error('Invalid JSON file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={importBackup} className="space-y-3 rounded-lg border p-3">
      <div className="space-y-2">
        <Label htmlFor="backup">Import full backup</Label>
        <Input id="backup" name="backup" type="file" accept="application/json,.json" disabled={loading} required />
      </div>
      <Button type="submit" variant="outline" className="w-full" loading={loading} loadingText="Importing">
        <Upload /> Import backup JSON
      </Button>
    </form>
  )
}
