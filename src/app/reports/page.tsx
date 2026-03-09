'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Download, BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [generating, setGenerating] = useState('')
  const { showToast } = useToast()

  const generateReport = async (type: string) => {
    if (!dateFrom || !dateTo) {
      showToast('Please select both from and to dates', 'warning')
      return
    }
    
    setGenerating(type)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, dateFrom, dateTo })
      })
      
      if (response.ok) {
        showToast(`${type} report generated successfully!`, 'success')
      } else {
        showToast(`Failed to generate ${type} report`, 'error')
      }
    } catch (error) {
      showToast(`Error generating ${type} report`, 'error')
    } finally {
      setGenerating('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Analytics and insights</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
          Export All
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
                placeholder="DD-MMM-YYYY"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
                placeholder="DD-MMM-YYYY"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Sales Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Monthly sales performance and trends</p>
            <Button 
              className="w-full" 
              onClick={() => generateReport('Sales')}
              disabled={generating === 'Sales'}
            >
              {generating === 'Sales' ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <PieChart className="h-5 w-5 text-green-600 dark:text-green-400" />
              Inventory Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Stock levels, movement and valuation</p>
            <Button 
              className="w-full" 
              onClick={() => generateReport('Inventory')}
              disabled={generating === 'Inventory'}
            >
              {generating === 'Inventory' ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Purchase Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Purchase order analysis and vendor performance</p>
            <Button 
              className="w-full" 
              onClick={() => generateReport('Purchase')}
              disabled={generating === 'Purchase'}
            >
              {generating === 'Purchase' ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}