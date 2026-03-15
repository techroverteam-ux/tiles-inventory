'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileStatsCard, MobileCard, MobileCardHeader, MobileCardField } from '@/components/ui/mobile-card'
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    monthlySales: 0,
    purchaseOrders: 0,
    lowStockItems: 0
  })
  const [salesData, setSalesData] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats')
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch sales data
      const salesResponse = await fetch('/api/dashboard/sales-data')
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        setSalesData(salesData)
      }

      // Fetch low stock items
      const lowStockResponse = await fetch('/api/dashboard/low-stock')
      if (lowStockResponse.ok) {
        const lowStockData = await lowStockResponse.json()
        setLowStockItems(lowStockData)
      }

      // Fetch recent orders
      const ordersResponse = await fetch('/api/dashboard/recent-orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Package className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground md:hidden">Overview of your inventory</p>
      </div>

      {/* Mobile Stats Cards */}
      <div className="grid grid-cols-2 md:hidden gap-3">
        <MobileStatsCard
          title="Products"
          value={stats.totalProducts.toLocaleString()}
          subtitle="Active items"
          icon={<Package className="h-4 w-4 text-primary" />}
        />
        <MobileStatsCard
          title="Sales"
          value={`₹${(stats.monthlySales / 1000).toFixed(0)}K`}
          subtitle="This month"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        />
        <MobileStatsCard
          title="Orders"
          value={stats.purchaseOrders}
          subtitle="Active"
          icon={<ShoppingCart className="h-4 w-4 text-primary" />}
        />
        <MobileStatsCard
          title="Low Stock"
          value={stats.lowStockItems}
          subtitle="Need attention"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        />
      </div>

      {/* Desktop Stats Cards */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Monthly Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{stats.monthlySales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.purchaseOrders}</div>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-foreground">Sales vs Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', fontSize: '12px' }} />
                <Bar dataKey="sales" fill="hsl(var(--primary))" />
                <Bar dataKey="purchases" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">No low stock items</p>
              ) : (
                lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Min stock: {item.minStock}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs ml-2">{item.stock} left</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders - Mobile Optimized */}
      <div className="md:hidden">
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Orders</h2>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <MobileCard>
              <p className="text-muted-foreground text-center py-4 text-sm">No recent orders</p>
            </MobileCard>
          ) : (
            recentOrders.map((order) => (
              <MobileCard key={order.id}>
                <MobileCardHeader
                  title={order.id}
                  subtitle={order.type === 'Purchase' ? order.brand : order.customer}
                  badge={<Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="text-xs">{order.status}</Badge>}
                />
                <MobileCardField
                  label="Amount"
                  value={`₹${order.amount.toLocaleString()}`}
                />
                <MobileCardField
                  label="Type"
                  value={order.type}
                />
              </MobileCard>
            ))
          )}
        </div>
      </div>

      {/* Recent Orders - Desktop */}
      <Card className="bg-card border-border hidden md:block">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      order.type === 'Purchase' ? 'bg-primary/10' : 'bg-primary/10'
                    }`}>
                      {order.type === 'Purchase' ? 
                        <ShoppingCart className="h-4 w-4 text-primary" /> : 
                        <TrendingUp className="h-4 w-4 text-primary" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-base text-foreground">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.type === 'Purchase' ? order.brand : order.customer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-base text-foreground">₹{order.amount.toLocaleString()}</p>
                    <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
