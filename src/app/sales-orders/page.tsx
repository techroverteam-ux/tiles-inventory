'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Filter, Download, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/ToastContext'

export default function SalesOrdersPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/sales-orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      showToast('Failed to load sales orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sales Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.filter(o => o.status !== 'CANCELLED').length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.filter(o => o.status === 'PENDING').length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{orders.filter(o => o.status === 'DELIVERED').length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{orders.reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Sales Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-spin" />
              <p>Loading sales orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>No sales orders found. Create your first sale order.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">₹{order.amount?.toLocaleString()}</p>
                      <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}