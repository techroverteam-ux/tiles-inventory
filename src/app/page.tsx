'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const salesData = [
  { month: 'Jan', sales: 4000, purchases: 2400 },
  { month: 'Feb', sales: 3000, purchases: 1398 },
  { month: 'Mar', sales: 2000, purchases: 9800 },
  { month: 'Apr', sales: 2780, purchases: 3908 },
  { month: 'May', sales: 1890, purchases: 4800 },
  { month: 'Jun', sales: 2390, purchases: 3800 },
]

const lowStockItems = [
  { name: 'Ceramic Floor Tile 60x60', stock: 5, minStock: 20 },
  { name: 'Marble Wall Tile 30x30', stock: 8, minStock: 15 },
  { name: 'Porcelain Tile 80x80', stock: 3, minStock: 10 },
]

const recentOrders = [
  { id: 'PO001', type: 'Purchase', brand: 'Kajaria', amount: 45000, status: 'Pending' },
  { id: 'SO001', type: 'Sales', customer: 'ABC Builders', amount: 25000, status: 'Delivered' },
  { id: 'PO002', type: 'Purchase', brand: 'Somany', amount: 32000, status: 'Received' },
]

export default function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-xs md:text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Monthly Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">₹2,45,000</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">5 pending delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-600">12</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Sales vs Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" />
                <Bar dataKey="purchases" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 text-red-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 md:p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-xs md:text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Min stock: {item.minStock}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">{item.stock} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 rounded-full ${
                    order.type === 'Purchase' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {order.type === 'Purchase' ? 
                      <ShoppingCart className="h-3 md:h-4 w-3 md:w-4 text-green-600" /> : 
                      <TrendingUp className="h-3 md:h-4 w-3 md:w-4 text-blue-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">{order.id}</p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {order.type === 'Purchase' ? order.brand : order.customer}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm md:text-base">₹{order.amount.toLocaleString()}</p>
                  <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="text-xs">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}