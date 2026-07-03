'use client'

import { useState, useMemo } from 'react'
import {
  upsertInventoryCategory,
  deleteInventoryCategory,
  upsertInventoryProduct,
  deleteInventoryProduct,
  upsertDamageReason,
  deleteDamageReason,
  importProductsFromVehicleLoading
} from '@/app/warehouse-stock/actions'
import { updateAppSetting } from '@/app/actions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormAction } from '@/lib/hooks/use-form-action'
import { DownloadCloud, Info } from 'lucide-react'

export function InventorySettingsForms({ categories, products, damageReasons, appSettings }) {
  const settings = Object.fromEntries(appSettings.map((setting) => [setting.key, setting.value]))

  const [catSearch, setCatSearch] = useState('')
  const [prodSearch, setProdSearch] = useState('')

  const filteredCategories = useMemo(() => {
    const q = catSearch.toLowerCase()
    return categories.filter((c) => c.category_name.toLowerCase().includes(q))
  }, [categories, catSearch])

  const filteredProducts = useMemo(() => {
    const q = prodSearch.toLowerCase()
    return products.filter((p) => p.display_name.toLowerCase().includes(q) || p.brand_name.toLowerCase().includes(q))
  }, [products, prodSearch])

  const [handleImport, importPending] = useFormAction(importProductsFromVehicleLoading, {
    loadingMessage: 'Importing categories and products...',
    successMessage: 'Import complete!'
  })

  const onImportTrigger = () => {
    if (confirm('Import categories and products from the Vehicle Loading module? Existing matches with the same names will be matched to prevent duplicates.')) {
      handleImport()
    }
  }

  return (
    <Accordion type="multiple" className="space-y-3">
      {/* Decoupling Manual Import Banner */}
      <Card className="border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <DownloadCloud className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Import Master Data</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Copy existing product and category definitions from the Vehicle Loading module to kickstart your inventory database. This action runs once and does not automatically sync future changes.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={onImportTrigger}
            loading={importPending}
            loadingText="Importing..."
          >
            Import Products & Categories
          </Button>
        </CardContent>
      </Card>

      {/* Categories Accordion */}
      <AccordionItem value="categories" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Inventory Categories CRUD</span>
          <Badge variant="secondary" className="ml-auto">{categories.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <Input
            placeholder="Search category..."
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            className="mb-2"
          />
          <InventoryCategoryForm onSaveSuccess={() => setCatSearch('')} />
          {filteredCategories.map((category) => (
            <InventoryCategoryForm key={category.id} category={category} />
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* Products Accordion */}
      <AccordionItem value="products" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Inventory Products CRUD</span>
          <Badge variant="secondary" className="ml-auto">{products.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <Input
            placeholder="Search product..."
            value={prodSearch}
            onChange={(e) => setProdSearch(e.target.value)}
            className="mb-2"
          />
          <InventoryProductForm categories={categories} onSaveSuccess={() => setProdSearch('')} />
          {filteredProducts.map((product) => (
            <InventoryProductForm key={product.id} product={product} categories={categories} />
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* Damage Reasons Accordion */}
      <AccordionItem value="damage-reasons" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>
          <span>Damage Reasons CRUD</span>
          <Badge variant="secondary" className="ml-auto">{damageReasons.length}</Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <DamageReasonForm />
          {damageReasons.map((reason) => (
            <DamageReasonForm key={reason.id} reason={reason} />
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* Transaction Prefixes Accordion */}
      <AccordionItem value="prefixes" className="rounded-lg border bg-card px-3">
        <AccordionTrigger>Transaction Settings</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <SettingForm
            label="Stock Entry Prefix"
            keyName="inventory_se_prefix"
            value={settings.inventory_se_prefix || 'SE'}
          />
          <SettingForm
            label="Damage Entry Prefix"
            keyName="inventory_de_prefix"
            value={settings.inventory_de_prefix || 'DE'}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// Subform for Inventory Categories
function InventoryCategoryForm({ category, onSaveSuccess }) {
  const [handleUpsert, upsertPending] = useFormAction(upsertInventoryCategory, {
    loadingMessage: category ? 'Updating category...' : 'Adding category...',
    successMessage: 'Inventory Category Saved',
    onSuccess: (result, formEl) => {
      if (!category && formEl) {
        formEl.reset()
        const target = formEl.querySelector('[name="category_name"]')
        if (target) target.focus()
        if (onSaveSuccess) onSaveSuccess()
      }
    }
  })

  const [handleDelete, deletePending] = useFormAction(deleteInventoryCategory, {
    loadingMessage: 'Deleting category...',
    successMessage: 'Inventory Category Deleted'
  })

  const isPending = upsertPending || deletePending

  const onDelete = () => {
    if (!confirm(`Are you sure you want to delete category "${category?.category_name}"?`)) return
    const formData = new FormData()
    formData.append('id', category.id)
    handleDelete(formData)
  }

  return (
    <form onSubmit={handleUpsert} className="rounded-lg border p-3 bg-muted/10 space-y-3">
      <input type="hidden" name="id" value={category?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category name" name="category_name" value={category?.category_name} required disabled={isPending} />
        <Field label="Bottles per crate" name="bottles_per_crate" type="number" value={category?.bottles_per_crate || 24} required disabled={isPending} />
        <Field label="Display order" name="display_order" type="number" value={category?.display_order || 0} disabled={isPending} />
        <div className="flex items-center justify-between rounded-md border p-3 bg-background">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} disabled={isPending} suppressHydrationWarning />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" loading={upsertPending} disabled={deletePending}>
          {category ? 'Update' : 'Add Category'}
        </Button>
        {category && (
          <Button type="button" onClick={onDelete} variant="destructive" loading={deletePending} disabled={upsertPending}>
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}

// Subform for Inventory Products
function InventoryProductForm({ product, categories, onSaveSuccess }) {
  const [handleUpsert, upsertPending] = useFormAction(upsertInventoryProduct, {
    loadingMessage: product ? 'Updating product...' : 'Adding product...',
    successMessage: 'Inventory Product Saved',
    onSuccess: (result, formEl) => {
      if (!product && formEl) {
        formEl.reset()
        const target = formEl.querySelector('[name="brand_name"]')
        if (target) target.focus()
        if (onSaveSuccess) onSaveSuccess()
      }
    }
  })

  const [handleDelete, deletePending] = useFormAction(deleteInventoryProduct, {
    loadingMessage: 'Deleting product...',
    successMessage: 'Inventory Product Deleted'
  })

  const isPending = upsertPending || deletePending

  const onDelete = () => {
    if (!confirm(`Are you sure you want to delete product "${product?.display_name}"?`)) return
    const formData = new FormData()
    formData.append('id', product.id)
    handleDelete(formData)
  }

  return (
    <form onSubmit={handleUpsert} className="rounded-lg border p-3 bg-muted/10 space-y-3">
      <input type="hidden" name="id" value={product?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <select
            name="category_id"
            defaultValue={product?.category_id || ''}
            required
            disabled={isPending}
            suppressHydrationWarning
            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.category_name}</option>
            ))}
          </select>
        </div>
        <Field label="Brand name" name="brand_name" value={product?.brand_name} required disabled={isPending} />
        <Field label="Display name" name="display_name" value={product?.display_name} placeholder="Leave blank to auto-generate" disabled={isPending} />
        <div className="flex items-center justify-between rounded-md border p-3 bg-background">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} disabled={isPending} suppressHydrationWarning />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" loading={upsertPending} disabled={deletePending}>
          {product ? 'Update' : 'Add Product'}
        </Button>
        {product && (
          <Button type="button" onClick={onDelete} variant="destructive" loading={deletePending} disabled={upsertPending}>
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}

// Subform for Damage Reasons
function DamageReasonForm({ reason }) {
  const [handleUpsert, upsertPending] = useFormAction(upsertDamageReason, {
    loadingMessage: reason ? 'Updating reason...' : 'Adding reason...',
    successMessage: 'Damage Reason Saved',
    onSuccess: (result, formEl) => {
      if (!reason && formEl) {
        formEl.reset()
        const target = formEl.querySelector('[name="reason_name"]')
        if (target) target.focus()
      }
    }
  })

  const [handleDelete, deletePending] = useFormAction(deleteDamageReason, {
    loadingMessage: 'Deleting reason...',
    successMessage: 'Damage Reason Deleted'
  })

  const isPending = upsertPending || deletePending

  const onDelete = () => {
    if (!confirm(`Delete reason "${reason?.reason_name}"?`)) return
    const formData = new FormData()
    formData.append('id', reason.id)
    handleDelete(formData)
  }

  return (
    <form onSubmit={handleUpsert} className="rounded-lg border p-3 bg-muted/10 space-y-3">
      <input type="hidden" name="id" value={reason?.id || ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Reason name" name="reason_name" value={reason?.reason_name} required disabled={isPending} />
        <div className="flex items-center justify-between rounded-md border p-3 bg-background">
          <Label>Active</Label>
          <input type="checkbox" name="is_active" defaultChecked={reason?.is_active ?? true} disabled={isPending} suppressHydrationWarning />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" loading={upsertPending} disabled={deletePending}>
          {reason ? 'Update' : 'Add Reason'}
        </Button>
        {reason && (
          <Button type="button" onClick={onDelete} variant="destructive" loading={deletePending} disabled={upsertPending}>
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}

// Helper form for saving app settings
function SettingForm({ label, keyName, value }) {
  const [handleSave, isPending] = useFormAction(updateAppSetting, {
    loadingMessage: 'Saving...',
    successMessage: 'Saved'
  })

  return (
    <form onSubmit={handleSave} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-3">
      <input type="hidden" name="key" value={keyName} />
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input name="value" defaultValue={value} disabled={isPending} />
      </div>
      <Button type="submit" loading={isPending}>Save</Button>
    </form>
  )
}

// Reusable text input field helper
function Field({ label, name, value = '', type = 'text', required = false, disabled = false }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input name={name} type={type} defaultValue={value} required={required} disabled={disabled} suppressHydrationWarning />
    </div>
  )
}
