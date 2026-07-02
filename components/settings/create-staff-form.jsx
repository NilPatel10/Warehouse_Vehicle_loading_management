'use client'

import { signUpWithEmail } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function CreateStaffForm() {
  const [handleSignUp, signUpPending] = useFormAction(signUpWithEmail, {
    loadingMessage: 'Creating staff account...',
    successMessage: 'Account Created'
  })

  return (
    <form onSubmit={handleSignUp} className="space-y-4 rounded-lg border p-4 bg-muted/20">
      <div className="space-y-2">
        <Label htmlFor="full_name">Staff Name</Label>
        <Input id="full_name" name="full_name" placeholder="Warehouse staff" autoComplete="name" disabled={signUpPending} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="new@email.com" autoComplete="username email" required disabled={signUpPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Password" autoComplete="new-password" required disabled={signUpPending} />
        </div>
      </div>
      <Button type="submit" variant="secondary" className="w-full" loading={signUpPending} loadingText="Creating">
        Create staff account
      </Button>
    </form>
  )
}
