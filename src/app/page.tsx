'use client'

import { useState, useEffect } from 'react'
import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Palette, 
  Ruler, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { containerVariants, itemVariants } from '@/lib/motion'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBrands: 0,
    totalCategories: 0,
    totalSizes: 0,
    totalProducts: 0,
    monthlySales: 0,
    purchaseOrders: 0,
    salesOrders: 0,
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
      const statsResponse = await fetch('/api/dashboard/stats')
      if (statsResponse.ok) setStats(await statsResponse.json())

      const salesResponse = await fetch('/api/dashboard/sales-data')
      if (salesResponse.ok) setSalesData(await salesResponse.json())

      const lowStockResponse = await fetch('/api/dashboard/low-stock')
      if (lowStockResponse.ok) setLowStockItems(await lowStockResponse.json())

      const ordersResponse = await fetch('/api/dashboard/recent-orders')
      if (ordersResponse.ok) setRecentOrders(await ordersResponse.json())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container space-y-8">
        <div className="space-y-2">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted/40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col gap-4 p-6 glass rounded-[2.5rem] border border-border/50 shadow-premium bg-gradient-to-br from-primary/10 via-transparent to-transparent sm:flex-row sm:items-center sm:justify-between transition-all duration-500 hover:border-primary/20"
      >
        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight">House of Tiles Dashboard</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary/60" />
            Real-time insights and operational overview of your business
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end px-4 border-r border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">System Status</span>
            <div className="flex items-center gap-1.5 text-success font-bold text-xs uppercase leading-none">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Operational
            </div>
          </div>
          <Button variant="outline" className="rounded-xl border-border/50 font-bold hover:bg-muted/50 transition-all h-11 px-6 shadow-sm">
            Generate Report
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Brands"
            value={stats.totalBrands}
            subtitle="Active Partners"
            icon={<Users />}
            href="/brands"
            color="primary"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Categories"
            value={stats.totalCategories}
            subtitle="Types of products"
            icon={<Palette />}
            href="/categories"
            color="info"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Sizes"
            value={stats.totalSizes}
            subtitle="Variations available"
            icon={<Ruler />}
            href="/sizes"
            color="warning"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Products"
            value={stats.totalProducts.toLocaleString()}
            subtitle="Total items in catalog"
            icon={<Package />}
            href="/products"
            color="success"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Inventory"
            value={stats.totalProducts.toLocaleString()}
            subtitle="In-stock units"
            icon={<Package />}
            href="/inventory"
            color="primary"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Purchase Orders"
            value={stats.purchaseOrders}
            subtitle="Incoming stock orders"
            icon={<ShoppingCart />}
            href="/purchase-orders"
            color="info"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Sales Orders"
            value={stats.salesOrders.toLocaleString()}
            subtitle="Total transactions"
            icon={<TrendingUp />}
            href="/sales-orders"
            color="success"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Low Stock"
            value={stats.lowStockItems}
            subtitle="Items need attention"
            icon={<AlertTriangle />}
            href="/inventory?status=low-stock"
            color="destructive"
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-8 border-border/50 rounded-[2rem] overflow-hidden glass-card shadow-premium group">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-8 py-6">
            <CardTitle className="text-xl font-extrabold flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              Financial Performance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px' 
                  }} 
                />
                <Bar dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="lg:col-span-4 border-border/50 rounded-[2rem] overflow-hidden glass-card shadow-premium group flex flex-col h-full">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-8 py-6">
            <CardTitle className="text-xl font-extrabold flex items-center gap-3 text-destructive">
              <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive transition-all duration-500 group-hover:scale-110 group-hover:bg-destructive group-hover:text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Inventory Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-y-auto no-scrollbar flex-1">
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-medium">All stock levels healthy</p>
                </div>
              ) : (
                lowStockItems.map((item, index) => (
                  <Link href={`/inventory?id=${item.id}`} key={index}>
                    <motion.div 
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3.5 bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 rounded-xl transition-colors mb-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Min Stock: {item.minStock}</p>
                      </div>
                      <Badge variant="destructive" className="ml-2 font-black rounded-lg">
                        {item.stock} left
                      </Badge>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50 rounded-[2rem] overflow-hidden glass-card shadow-premium group">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-8 py-6 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-extrabold flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-info/10 text-info transition-all duration-500 group-hover:scale-110 group-hover:bg-info group-hover:text-white">
              <ShoppingCart className="h-5 w-5" />
            </div>
            Latest Transactions
          </CardTitle>
          <Link href="/sales-orders">
            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10 px-4">
              Explore History
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-12 font-medium">No recent activity recorded</p>
            ) : (
              recentOrders.map((order) => (
                <Link 
                  key={order.id} 
                  href={order.type === 'Purchase' ? `/purchase-orders?id=${order.id}` : `/sales-orders?id=${order.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-all duration-300 ${
                        order.type === 'Purchase' ? 'bg-info/10 text-info group-hover:bg-info group-hover:text-white' : 'bg-success/10 text-success group-hover:bg-success group-hover:text-white'
                      }`}>
                        {order.type === 'Purchase' ? 
                          <ShoppingCart className="h-5 w-5" /> : 
                          <TrendingUp className="h-5 w-5" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{order.id}</p>
                          <Badge variant="outline" className="text-[10px] font-black uppercase py-0 px-2 rounded-full">
                            {order.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {order.type === 'Purchase' ? order.brand : order.customer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-foreground mb-1">₹{order.amount.toLocaleString()}</p>
                      <Badge 
                        className={cn(
                          "text-[10px] font-bold py-0 rounded-md",
                          order.status === 'Delivered' ? 'bg-success/20 text-success hover:bg-success/30 border-transparent' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
