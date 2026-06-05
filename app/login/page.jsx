import { signInWithEmail, signUpWithEmail } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const error = resolvedSearchParams?.error
  const message = resolvedSearchParams?.message

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Warehouse sign in</CardTitle>
          <CardDescription>Use Supabase Auth for shared staff access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              {decodeURIComponent(message)}
            </div>
          ) : null}
          <form action={signInWithEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button className="w-full">Sign in</Button>
          </form>
          <form action={signUpWithEmail} className="space-y-4 border-t pt-5">
            <div className="space-y-2">
              <Label htmlFor="full_name">New staff name</Label>
              <Input id="full_name" name="full_name" placeholder="Warehouse staff" autoComplete="name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="email" type="email" placeholder="new@email.com" autoComplete="username email" required />
              <Input name="password" type="password" placeholder="Password" autoComplete="new-password" required />
            </div>
            <Button variant="secondary" className="w-full">Create staff account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
