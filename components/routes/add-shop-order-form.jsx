import { addShopOrder } from '@/app/actions'
import { ProductLinesEditor } from '@/components/routes/product-lines-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddShopOrderForm({ routeId, products, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add shop order</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={addShopOrder} className="space-y-4">
          <input type="hidden" name="route_id" value={routeId} />
          <div className="space-y-2">
            <Label htmlFor="shop_name">Shop name</Label>
            <Input id="shop_name" name="shop_name" placeholder="Shree Beverages" required disabled={disabled} />
          </div>
          <ProductLinesEditor products={products} disabled={disabled} />
          <div className="space-y-2">
            <Label htmlFor="free_water_per_crate">Free water bottle/crate</Label>
            <Input
              id="free_water_per_crate"
              name="free_water_per_crate"
              type="number"
              min="0"
              defaultValue="0"
              disabled={disabled}
            />
          </div>
          <Button className="w-full" disabled={disabled}>Save shop order</Button>
        </form>
      </CardContent>
    </Card>
  )
}
