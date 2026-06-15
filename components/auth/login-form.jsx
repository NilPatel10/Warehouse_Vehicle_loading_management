'use client'

import { signInWithEmail } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function LoginForm({ initialError, initialMessage }) {
  const [handleSignIn, signInPending] = useFormAction(signInWithEmail, {
    loadingMessage: 'Signing in...',
    successMessage: 'Signed in successfully!'
  })

  return (
    <div className="space-y-6">
      {initialError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {decodeURIComponent(initialError)}
        </div>
      ) : null}
      {initialMessage ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
          {decodeURIComponent(initialMessage)}
        </div>
      ) : null}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username email" required disabled={signInPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required disabled={signInPending} />
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            disabled={signInPending}
          />
          <Label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer">
            Remember me on this device
          </Label>
        </div>
        <Button type="submit" className="w-full" loading={signInPending}>
          Sign in
        </Button>
      </form>
    </div>
  )
}
