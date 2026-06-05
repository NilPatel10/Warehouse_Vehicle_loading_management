import { deleteCategory, deleteProduct, signOut, updateAppSetting, upsertCategory, upsertProduct } from '@/app/actions'
import { ImportBackupForm } from '@/components/settings/import-backup-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function SettingsForms({ categories, products, users, appSettings }) {
  const settings = Object.fromEntries(appSettings.map((setting) => [setting.key, setting.value]))

  return (
    <Accordion type="multiple" className="space-y-3">
      <AccordionItem value="categories" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Bottle Categories CRUD</span>
          <Badge variant="secondary" className="ml-auto">{categories.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <CategoryForm />
          {categories.map((category) => <CategoryForm key={category.id} category={category} />)}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="products" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Products/Brands CRUD</span>
          <Badge variant="secondary" className="ml-auto">{products.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <ProductForm categories={categories} />
          {products.map((product) => <ProductForm key={product.id} product={product} categories={categories} />)}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="schemes" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>Scheme Configuration</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Category forms control free 250 ml bottles and configured water-per-crate values. Manual free water bottle/crate is entered per shop order.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="users" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Users</span>
          <Badge variant="secondary" className="ml-auto">{users.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-md border p-3">
              <p className="font-semibold">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          ))}
          <form action={signOut}>
            <Button variant="outline" className="w-full">Sign out</Button>
          </form>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="backup" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>Route Export / Backup</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <p>Use each route’s Export button for a single route JSON backup.</p>
              <p>Full backup/import endpoints are included at `/api/backup/export` and `/api/backup/import` for authenticated staff.</p>
            </CardContent>
          </Card>
          <Button asChild className="w-full">
            <a href="/api/backup/export" download>Export full backup JSON</a>
          </Button>
          <ImportBackupForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="app" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>App Settings</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <SettingForm label="Auto-delete old history" keyName="history_auto_delete_enabled" value={settings.history_auto_delete_enabled || 'false'} />
          <SettingForm label="History retention days" keyName="history_retention_days" value={settings.history_retention_days || '7'} />
          <SettingForm label="Route lock timeout seconds" keyName="route_lock_timeout_seconds" value={settings.route_lock_timeout_seconds || '180'} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function CategoryForm({ category }) {
  return (
    <form action={upsertCategory} className="rounded-lg border p-3">
      <input type="hidden" name="id" value={category?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category name" name="category_name" value={category?.category_name} required />
        <Field label="Bottles per crate" name="bottles_per_crate" type="number" value={category?.bottles_per_crate || 1} required />
        <Field label="Free 250 ml/crate" name="free_250ml_per_crate" type="number" value={category?.free_250ml_per_crate || 0} />
        <Field label="Water/crate for category" name="water_bottles_per_crate" type="number" value={category?.water_bottles_per_crate || 0} />
        <Field label="Display order" name="display_order" type="number" value={category?.display_order || 0} />
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} suppressHydrationWarning />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Free 250 ml enabled</Label>
          <input type="checkbox" name="free_250ml_enabled" defaultChecked={category?.free_250ml_enabled ?? false} suppressHydrationWarning />
        </div>
      </div>
      <Button className="mt-3 w-full">{category ? 'Update category' : 'Add category'}</Button>
      {category ? (
        <Button formAction={deleteCategory} variant="destructive" className="mt-2 w-full">
          Delete category
        </Button>
      ) : null}
    </form>
  )
}

function ProductForm({ product, categories }) {
  return (
    <form action={upsertProduct} className="rounded-lg border p-3">
      <input type="hidden" name="id" value={product?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category_id" defaultValue={product?.category_id || ''} required suppressHydrationWarning className="h-11 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>
        </div>
        <Field label="Brand name" name="brand_name" value={product?.brand_name} required />
        <Field label="Display name" name="display_name" value={product?.display_name} />
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} suppressHydrationWarning />
        </div>
      </div>
      <Button className="mt-3 w-full">{product ? 'Update product' : 'Add product'}</Button>
      {product ? (
        <Button formAction={deleteProduct} variant="destructive" className="mt-2 w-full">
          Delete product
        </Button>
      ) : null}
    </form>
  )
}

function SettingForm({ label, keyName, value }) {
  return (
    <form action={updateAppSetting} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-3">
      <input type="hidden" name="key" value={keyName} />
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input name="value" defaultValue={value} />
      </div>
      <Button>Save</Button>
    </form>
  )
}

function Field({ label, name, value = '', type = 'text', required = false }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input name={name} type={type} defaultValue={value} required={required} suppressHydrationWarning />
    </div>
  )
}
