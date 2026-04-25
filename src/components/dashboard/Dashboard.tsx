'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCard } from './dashboard-card'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Palette,
  Layers,
  Ruler,
  Users,
  DollarSign,
  FileText
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useToast } from '@/contexts/ToastContext'

interface DashboardStats {
  totalProducts: number
  totalBrands: number
  totalCategories: number
  totalSizes: number
  purchaseOrders: number
  salesOrders: number
  lowStockItems: number
  monthlySales: number
}

interface ChartData {
  month: string
  sales: number
  purchases: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    totalSizes: 0,
    purchaseOrders: 0,
    salesOrders: 0,
    lowStockItems: 0,
    monthlySales: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsRes, chartRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/sales-data')
        ])

        if (!statsRes.ok || !chartRes.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const statsData = await statsRes.json()
        const chartDataFromApi = await chartRes.json()

        setStats(statsData)
        setChartData(chartDataFromApi)
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
        showToast('Failed to load dashboard data', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [showToast])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted/30" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl animate-pulse bg-muted/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your inventory overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package className="h-6 w-6" />}
            href="/admin/products"
            color="primary"
          />
          <DashboardCard
            title="Brands"
            value={stats.totalBrands}
            icon={<Palette className="h-6 w-6" />}
            href="/admin/brands"
            color="success"
          />
          <DashboardCard
            title="Categories"
            value={stats.totalCategories}
            icon={<Layers className="h-6 w-6" />}
            href="/admin/categories"
            color="warning"
          />
          <DashboardCard
            title="Sizes"
            value={stats.totalSizes}
            icon={<Ruler className="h-6 w-6" />}
            href="/admin/sizes"
            color="info"
          />
          <DashboardCard
            title="Purchase Orders"
            value={stats.purchaseOrders}
            subtitle="pending"
            icon={<ShoppingCart className="h-6 w-6" />}
            href="/admin/purchase-orders"
            color="primary"
          />
          <DashboardCard
            title="Sales Orders"
            value={stats.salesOrders}
            icon={<FileText className="h-6 w-6" />}
            href="/admin/sales-orders"
            color="success"
          />
          <DashboardCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<AlertCircle className="h-6 w-6" />}
            href="/admin/inventory"
            color="destructive"
          />
          <DashboardCard
            title="Monthly Sales"
            value={`₹${stats.monthlySales.toLocaleString()}`}
            icon={<TrendingUp className="h-6 w-6" />}
            href="/admin/reports"
            color="info"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales vs Purchases Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales vs Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} />
                    <Line type="monotone" dataKey="purchases" stroke="var(--success)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Bar Chart for Comparison */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="sales" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="purchases" fill="var(--success)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
