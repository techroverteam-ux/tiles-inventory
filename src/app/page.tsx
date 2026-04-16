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
  AlertTriangle,
  Download,
  Loader2,
  Check
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
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const hasSalesData = salesData && salesData.length > 0
  const hasLowStockData = lowStockItems && lowStockItems.length > 0
  const hasRecentOrders = recentOrders && recentOrders.length > 0

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

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const doc = new jsPDF()
      
      try {
        const logoUrl = encodeURI('/HOT LOGO TRANSPARENT.PNG')
        const img = new Image()
        img.src = logoUrl
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true)
          img.onerror = () => reject(new Error('Image failed to load'))
        })
        doc.addImage(img, 'PNG', 14, 10, 40, 20)
      } catch (err) {
        console.warn('Could not load logo for PDF:', err)
      }

      // Title
      doc.setFontSize(22)
      doc.setTextColor(40, 40, 40)
      doc.text("House of Tiles", 60, 20)
      
      doc.setFontSize(14)
      doc.setTextColor(100, 100, 100)
      doc.text("Executive Dashboard Report", 60, 28)
      
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40)
      
      // Horizontal Line
      doc.setDrawColor(200, 200, 200)
      doc.line(14, 45, 196, 45)

      // Stats Section
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text("Overview", 14, 55)

      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
          ['Total Brands (Active Partners)', stats.totalBrands],
          ['Total Categories', stats.totalCategories],
          ['Total Sizes', stats.totalSizes],
          ['Total Products in Catalog', stats.totalProducts.toLocaleString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [88, 28, 135] },
        margin: { left: 14, right: 14 }
      })

      const lastAutoTable = (doc as any).lastAutoTable

      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text("Inventory & Orders", 14, lastAutoTable.finalY + 15)

      autoTable(doc, {
        startY: lastAutoTable.finalY + 20,
        head: [['Metric', 'Value']],
        body: [
          ['Low Stock Items (Needs Attention)', stats.lowStockItems],
          ['Pending Purchase Orders', stats.purchaseOrders],
          ['Total Sales Transactions', stats.salesOrders.toLocaleString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [88, 28, 135] },
        bodyStyles: { textColor: [40, 40, 40] },
        margin: { left: 14, right: 14 },
        didParseCell: function(data) {
          if (data.row.index === 0 && data.section === 'body' && stats.lowStockItems > 0) {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      })

      const secondAutoTable = (doc as any).lastAutoTable

      if (salesData && salesData.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text("Financial Performance (Monthly)", 14, secondAutoTable.finalY + 15)
        
        autoTable(doc, {
          startY: secondAutoTable.finalY + 20,
          head: [['Month', 'Sales Revenue (INR)', 'Purchase Costs (INR)']],
          body: salesData.map(d => [d.month, parseFloat(d.sales).toLocaleString(), parseFloat(d.purchases).toLocaleString()]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 14, right: 14 }
        })
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${i} of ${pageCount} - House of Tiles Internal Document`,
          14,
          doc.internal.pageSize.height - 10
        )
      }

      doc.save(`HouseOfTiles_Report_${new Date().toISOString().split('T')[0]}.pdf`)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (error) {
      console.error('Error generating PDF report:', error)
      alert("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
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
    <div className="admin-page">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex items-center justify-between gap-4 p-4 sm:p-6 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-border/50 shadow-premium bg-gradient-to-br from-primary/10 via-transparent to-transparent transition-all duration-500 hover:border-primary/20"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:gap-1">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight leading-tight">Dashboard</h1>
          <p className="hidden sm:flex text-xs text-muted-foreground font-medium items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-primary/60" />
            Real-time Insights
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
          <Button 
            variant="outline" 
            className={`rounded-xl border-border/50 font-bold transition-all h-11 px-6 shadow-sm gap-2 ${downloadSuccess ? 'bg-success/10 text-success hover:bg-success/20 border-success/30' : 'hover:bg-muted/50'}`}
            onClick={handleGenerateReport}
            disabled={isGenerating || loading}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 
             downloadSuccess ? <Check className="h-4 w-4" /> : 
             <Download className="h-4 w-4" />}
            {isGenerating ? 'Generating...' : 
             downloadSuccess ? 'Downloaded!' : 
             'Generate Report'}
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
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

      {(hasSalesData || hasLowStockData) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sales Chart */}
          {hasSalesData && (
            <Card className={cn(
              "border-border/50 rounded-[2rem] overflow-hidden glass-card shadow-premium group",
              hasLowStockData ? "lg:col-span-8" : "lg:col-span-12"
            )}>
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
          )}

          {/* Low Stock Alert */}
          {hasLowStockData && (
            <Card className={cn(
              "border-border/50 rounded-[2rem] overflow-hidden glass-card shadow-premium group flex flex-col h-full",
              hasSalesData ? "lg:col-span-4" : "lg:col-span-12"
            )}>
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
                  {lowStockItems.map((item, index) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {hasRecentOrders && (
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
              {recentOrders.map((order) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
