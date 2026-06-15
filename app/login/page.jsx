import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

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
        <CardContent>
          <LoginForm initialError={error} initialMessage={message} />
        </CardContent>
      </Card>
    </div>
  )
}
