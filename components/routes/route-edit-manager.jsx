'use client'

import { useState } from 'react'
import { RouteLockClient } from '@/components/routes/route-lock-client'
import { AddShopOrderForm } from '@/components/routes/add-shop-order-form'
import { StatusActions } from '@/components/routes/status-actions'
import { LoadingSummary } from '@/components/routes/loading-summary'
import { ShopOrderList } from '@/components/routes/shop-order-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RouteEditManager({ route, products, userId, timeoutSeconds }) {
  const [editingOrder, setEditingOrder] = useState(null)

  return (
    <RouteLockClient routeId={route.id} userId={userId} timeoutSeconds={timeoutSeconds}>
      {({ canEdit }) => (
        <>
          <AddShopOrderForm
            routeId={route.id}
            products={products}
            disabled={!canEdit}
            editingOrder={editingOrder}
            onCancelEdit={() => setEditingOrder(null)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusActions route={route} disabled={!canEdit} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Loading summary</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingSummary route={route} />
            </CardContent>
          </Card>
          <ShopOrderList
            route={route}
            editable={canEdit}
            onEditOrder={(order) => setEditingOrder(order)}
          />
        </>
      )}
    </RouteLockClient>
  )
}
