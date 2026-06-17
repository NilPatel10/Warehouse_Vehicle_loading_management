'use client'

import { useState, useMemo } from 'react'
import { deleteCategory, deleteProduct, signOut, updateAppSetting, upsertCategory, upsertProduct, upsertScheme, deleteScheme } from '@/app/actions'
import { ImportBackupForm } from '@/components/settings/import-backup-form'
import { CreateStaffForm } from '@/components/settings/create-staff-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function SettingsForms({ categories, products, users, appSettings, schemes }) {
  const settings = Object.fromEntries(appSettings.map((setting) => [setting.key, setting.value]))

  const [catSearch, setCatSearch] = useState('')
  const [prodSearch, setProdSearch] = useState('')
  const [schemeSearch, setSchemeSearch] = useState('')

  const filteredCategories = useMemo(() => {
    const q = catSearch.toLowerCase()
    return categories.filter((c) => c.category_name.toLowerCase().includes(q))
  }, [categories, catSearch])

  const filteredProducts = useMemo(() => {
    const q = prodSearch.toLowerCase()
    return products.filter((p) => p.display_name.toLowerCase().includes(q) || p.brand_name.toLowerCase().includes(q))
  }, [products, prodSearch])

  const filteredSchemes = useMemo(() => {
    const q = schemeSearch.toLowerCase()
    return (schemes || []).filter((s) => s.scheme_name.toLowerCase().includes(q) || s.scheme_type.toLowerCase().includes(q))
  }, [schemes, schemeSearch])

  const [handleSignOut, signOutPending] = useFormAction(signOut, {
    loadingMessage: 'Signing out...',
    successMessage: 'Signed out successfully.'
  })

  return (
    <Accordion type="multiple" className="space-y-3">
      <AccordionItem value="categories" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Bottle Categories CRUD</span>
          <Badge variant="secondary" className="ml-auto">{categories.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          {/* Category configuration help note */}
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-semibold text-blue-900 dark:text-blue-200">📦 How Bottle Category settings affect calculations</p>
            <p><span className="font-medium">Bottles Per Crate</span> — Used to calculate full crates and loose bottles throughout the application. Example: Bottles Per Crate = 9 and Quantity = 15 → 1 full crate + 6 loose bottles. This value is used in every crate, water, and 250ml calculation.</p>
            <p><span className="font-medium">Free 250ml Per Bottle</span> ("Free 250 ml/crate" field) — Number of free 250ml bottles given per ordered bottle of this category. Example: value = 1 means every bottle of this size earns 1 free 250ml bottle. 18 ordered → 18 free 250ml bottles.</p>
            <p><span className="font-medium">Water/Crate for Category</span> — Category-level free water added automatically based on full crates. This is separate from the per-order manual water entry.</p>
            <p><span className="font-medium">Active / Inactive</span> — Inactive categories and their products will not appear in shop order forms. Existing orders are not affected.</p>
          </div>
          <Input
            placeholder="Search categories..."
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            className="mb-2"
          />
          <CategoryForm />
          {filteredCategories.map((category) => <CategoryForm key={category.id} category={category} />)}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="products" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Products/Brands CRUD</span>
          <Badge variant="secondary" className="ml-auto">{products.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          {/* Product configuration help note */}
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">🏷️ Product / Brand Configuration</p>
            <p><span className="font-medium">Display Name</span> — If left blank, the system will auto-generate it as "Brand Name + Category Name" (e.g. "Coke 2.25L"). Set a custom Display Name to override this.</p>
            <p><span className="font-medium">Category</span> — Determines the Bottles Per Crate and scheme settings for this product. Changing category will affect all future calculations for this product.</p>
            <p><span className="font-medium">Duplicate Prevention</span> — A product can only be added once within a single shop order. If you need to change a quantity, edit the existing entry instead of adding the product again.</p>
            <p><span className="font-medium">Active / Inactive</span> — Inactive products will not appear in new shop order forms. Existing order data is preserved.</p>
          </div>
          <Input
            placeholder="Search products..."
            value={prodSearch}
            onChange={(e) => setProdSearch(e.target.value)}
            className="mb-2"
          />
          <ProductForm categories={categories} />
          {filteredProducts.map((product) => <ProductForm key={product.id} product={product} categories={categories} />)}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="schemes" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Scheme Configuration</span>
          <Badge variant="secondary" className="ml-auto">{schemes?.length || 0}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Scheme Configuration allows you to define named bonus rules that apply to categories or all products.
          </p>
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">🎁 Scheme Types Explained</p>
            <p><span className="font-medium">Free Water</span> — Adds free water bottles per full crate. Can be set at the category level here, or entered manually per shop order on the route edit screen.</p>
            <p><span className="font-medium">Free 250ml</span> — Adds free 250ml bottles per ordered bottle of the linked category (when "Free 250ml enabled" is checked on the category). Example: scheme value = 1, 18 bottles ordered → 18 free 250ml bottles.</p>
            <p><span className="font-medium">Value Per Crate / Per Bottle</span> — The number of free items given. For Water: per full crate. For 250ml: per ordered bottle.</p>
            <p><span className="font-medium">Category</span> — Leave as "All Categories (Global)" to apply to all products, or select a specific category to restrict the scheme.</p>
          </div>
          <Input
            placeholder="Search schemes..."
            value={schemeSearch}
            onChange={(e) => setSchemeSearch(e.target.value)}
            className="mb-2"
          />
          <SchemeForm categories={categories} />
          {filteredSchemes.map((scheme) => <SchemeForm key={scheme.id} scheme={scheme} categories={categories} />)}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="users" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Users</span>
          <Badge variant="secondary" className="ml-auto">{users.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-2">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {users.map((user) => (
              <div key={user.id} className="rounded-md border p-3 bg-muted/10">
                <p className="font-semibold text-sm">{user.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 mt-3 space-y-3">
            <h4 className="text-sm font-semibold">Create New Staff Account</h4>
            <CreateStaffForm />
          </div>
          <form onSubmit={handleSignOut} className="pt-2">
            <Button type="submit" variant="outline" className="w-full" loading={signOutPending}>Sign out</Button>
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
        <AccordionContent className="space-y-4">
          {/* App settings explanation */}
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">⚙️ Application Configuration</p>
            <p><span className="font-medium text-foreground">Auto-delete old history</span> — Set to <code>true</code> to automatically delete routes older than the retention period when the History page is visited. Set to <code>false</code> to keep all history indefinitely. Default: <code>false</code>.</p>
            <p><span className="font-medium text-foreground">History retention days</span> — Number of days of route history to keep. Routes with a date older than this many days will be deleted when auto-delete is enabled. Default: <code>7</code> days. <span className="text-destructive font-medium">Warning: Deleted routes cannot be recovered.</span></p>
            <p><span className="font-medium text-foreground">Route lock timeout seconds</span> — How many seconds a user can hold the exclusive edit lock on a route before it expires and another user can take over. Default: <code>180</code> seconds (3 minutes). Increase this if staff frequently lose their lock during slow connections.</p>
          </div>
          <SettingForm label="Auto-delete old history (true/false)" keyName="history_auto_delete_enabled" value={settings.history_auto_delete_enabled || 'false'} />
          <SettingForm label="History retention days" keyName="history_retention_days" value={settings.history_retention_days || '7'} />
          <SettingForm label="Route lock timeout (seconds)" keyName="route_lock_timeout_seconds" value={settings.route_lock_timeout_seconds || '180'} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function CategoryForm({ category }) {
  const [handleUpsertCategory, upsertPending] = useFormAction(upsertCategory, {
    loadingMessage: category ? 'Updating category...' : 'Adding category...',
    successMessage: category ? 'Category updated successfully!' : 'Category added successfully!'
  })

  const [handleDeleteCategory, deletePending] = useFormAction(deleteCategory, {
    loadingMessage: 'Deleting category...',
    successMessage: 'Category deleted successfully!'
  })

  const isPending = upsertPending || deletePending

  const onDelete = () => {
    if (!confirm(`Are you sure you want to delete category "${category?.category_name}"?`)) return
    const formData = new FormData()
    formData.append('id', category.id)
    handleDeleteCategory(formData)
  }

  return (
    <form onSubmit={handleUpsertCategory} className="rounded-lg border p-3">
      <input type="hidden" name="id" value={category?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category name" name="category_name" value={category?.category_name} required disabled={isPending} />
        <Field label="Bottles per crate" name="bottles_per_crate" type="number" value={category?.bottles_per_crate || 1} required disabled={isPending} />
        <Field label="Free 250ml bottles per ordered bottle" name="free_250ml_per_crate" type="number" value={category?.free_250ml_per_crate || 0} disabled={isPending} />
        <Field label="Water bottles per full crate (category bonus)" name="water_bottles_per_crate" type="number" value={category?.water_bottles_per_crate || 0} disabled={isPending} />
        <Field label="Display order" name="display_order" type="number" value={category?.display_order || 0} disabled={isPending} />
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} disabled={isPending} suppressHydrationWarning />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Free 250ml enabled</Label>
          <input type="checkbox" name="free_250ml_enabled" defaultChecked={category?.free_250ml_enabled ?? false} disabled={isPending} suppressHydrationWarning />
        </div>
      </div>
      {/* Field impact notes */}
      <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">Bottles Per Crate</span> is used to calculate full crates, loose bottles and scheme quantities throughout the application.</p>
        <p><span className="font-medium">Free 250ml bottles per ordered bottle</span>: when "Free 250ml enabled" is checked, this many 250ml bottles are added per ordered bottle. Example: value = 1, order = 18 bottles → 18 free 250ml bottles.</p>
        <p><span className="font-medium">Water bottles per full crate</span>: category-level automatic water bonus per full crate, separate from the per-order water entry on each shop order.</p>
      </div>
      <div className="mt-2 rounded-md border border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/40 px-3 py-2 text-xs text-orange-800 dark:text-orange-300 space-y-1">
        <p className="font-semibold">⚠️ Avoid Double-Counting Water</p>
        <p>The category-level <span className="font-medium">Water bottles per full crate</span> value is added automatically to every order containing products from this category.</p>
        <p>If staff <span className="font-medium">also</span> enter a manual water scheme per shop order, <span className="font-semibold">both values will be added together</span> in the totals.</p>
        <p>Use <span className="font-medium">one method only</span>: either configure water here at the category level (set the per-order field to 0), or always enter it manually per order (set this field to 0).</p>
      </div>
      <Button type="submit" className="mt-3 w-full" loading={upsertPending} disabled={deletePending}>
        {category ? 'Update category' : 'Add category'}
      </Button>
      {category ? (
        <Button type="button" onClick={onDelete} variant="destructive" className="mt-2 w-full" loading={deletePending} disabled={upsertPending}>
          Delete category
        </Button>
      ) : null}
    </form>
  )
}

function ProductForm({ product, categories }) {
  const [handleUpsertProduct, upsertPending] = useFormAction(upsertProduct, {
    loadingMessage: product ? 'Updating product...' : 'Adding product...',
    successMessage: product ? 'Product updated successfully!' : 'Product added successfully!'
  })

  const [handleDeleteProduct, deletePending] = useFormAction(deleteProduct, {
    loadingMessage: 'Deleting product...',
    successMessage: 'Product deleted successfully!'
  })

  const isPending = upsertPending || deletePending

  const onDelete = () => {
    if (!confirm(`Are you sure you want to delete product "${product?.display_name}"?`)) return
    const formData = new FormData()
    formData.append('id', product.id)
    handleDeleteProduct(formData)
  }

  return (
    <form onSubmit={handleUpsertProduct} className="rounded-lg border p-3">
      <input type="hidden" name="id" value={product?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category_id" defaultValue={product?.category_id || ''} required disabled={isPending} suppressHydrationWarning className="h-11 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>
        </div>
        <Field label="Brand name" name="brand_name" value={product?.brand_name} required disabled={isPending} />
        <Field label="Display name" name="display_name" value={product?.display_name} disabled={isPending} />
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} disabled={isPending} suppressHydrationWarning />
        </div>
      </div>
      <Button type="submit" className="mt-3 w-full" loading={upsertPending} disabled={deletePending}>
        {product ? 'Update product' : 'Add product'}
      </Button>
      {product ? (
        <Button type="button" onClick={onDelete} variant="destructive" className="mt-2 w-full" loading={deletePending} disabled={upsertPending}>
          Delete product
        </Button>
      ) : null}
    </form>
  )
}

function SettingForm({ label, keyName, value }) {
  const [handleSaveSetting, isPending] = useFormAction(updateAppSetting, {
    loadingMessage: 'Saving app setting...',
    successMessage: 'App setting saved successfully!'
  })

  return (
    <form onSubmit={handleSaveSetting} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-3">
      <input type="hidden" name="key" value={keyName} />
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input name="value" defaultValue={value} disabled={isPending} />
      </div>
      <Button type="submit" loading={isPending}>Save</Button>
    </form>
  )
}

function Field({ label, name, value = '', type = 'text', required = false, disabled = false }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input name={name} type={type} defaultValue={value} required={required} disabled={disabled} suppressHydrationWarning />
    </div>
  )
}

function SchemeForm({ scheme, categories }) {
  const [handleUpsertScheme, upsertPending] = useFormAction(upsertScheme, {
    loadingMessage: scheme ? 'Updating scheme...' : 'Adding scheme...',
    successMessage: scheme ? 'Scheme updated successfully!' : 'Scheme added successfully!'
  })

  const [handleDeleteScheme, deletePending] = useFormAction(deleteScheme, {
    loadingMessage: 'Deleting scheme...',
    successMessage: 'Scheme deleted successfully!'
  })

  const isPending = upsertPending || deletePending

  const onDelete = () => {
    if (!confirm(`Are you sure you want to delete scheme "${scheme?.scheme_name}"?`)) return
    const formData = new FormData()
    formData.append('id', scheme.id)
    handleDeleteScheme(formData)
  }

  return (
    <form onSubmit={handleUpsertScheme} className="rounded-lg border p-3 bg-card">
      <input type="hidden" name="id" value={scheme?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Scheme name" name="scheme_name" value={scheme?.scheme_name} required disabled={isPending} />
        
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category_id" defaultValue={scheme?.category_id || ''} disabled={isPending} suppressHydrationWarning className="h-11 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All Categories (Global)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Scheme Type</Label>
          <select name="scheme_type" defaultValue={scheme?.scheme_type || 'free_water'} required disabled={isPending} suppressHydrationWarning className="h-11 w-full rounded-md border bg-background px-3 text-sm">
            <option value="free_water">Free Water</option>
            <option value="free_250ml">Free 250ml</option>
          </select>
        </div>

        <Field label="Value per crate" name="value_per_crate" type="number" value={scheme?.value_per_crate || 0} required disabled={isPending} />

        <div className="flex items-center justify-between rounded-md border p-3">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={scheme?.is_active ?? true} disabled={isPending} suppressHydrationWarning />
        </div>
      </div>
      <Button type="submit" className="mt-3 w-full" loading={upsertPending} disabled={deletePending}>
        {scheme ? 'Update scheme' : 'Add scheme'}
      </Button>
      {scheme ? (
        <Button type="button" onClick={onDelete} variant="destructive" className="mt-2 w-full" loading={deletePending} disabled={upsertPending}>
          Delete scheme
        </Button>
      ) : null}
    </form>
  )
}
