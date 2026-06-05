import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EnvWarning() {
  return (
    <div className="p-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-base text-amber-950">Supabase is not configured</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`, then run the SQL files in `supabase/`.
        </CardContent>
      </Card>
    </div>
  )
}
