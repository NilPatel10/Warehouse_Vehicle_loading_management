'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ImportBackupForm() {
  const [status, setStatus] = useState('')

  async function importBackup(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const file = formData.get('backup')
    if (!file) return

    const text = await file.text()
    const response = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: text
    })

    setStatus(response.ok ? 'Backup imported successfully.' : 'Backup import failed.')
  }

  return (
    <form onSubmit={importBackup} className="space-y-3 rounded-lg border p-3">
      <div className="space-y-2">
        <Label htmlFor="backup">Import full backup</Label>
        <Input id="backup" name="backup" type="file" accept="application/json,.json" />
      </div>
      <Button type="submit" variant="outline" className="w-full">
        <Upload /> Import backup JSON
      </Button>
      {status ? <p className="text-sm font-semibold text-muted-foreground">{status}</p> : null}
    </form>
  )
}
