'use client'

import { useEffect } from 'react'

export default function RedirectTest() {
  useEffect(() => {
    console.log('🧪 RedirectTest: Component mounted')
    console.log('🧪 Current location:', window.location.href)
    
    // Test different redirect methods
    const testRedirect = () => {
      console.log('🧪 Testing redirect in 2 seconds...')
      setTimeout(() => {
        console.log('🧪 Attempting redirect to dashboard...')
        window.location.href = '/dashboard'
      }, 2000)
    }
    
    testRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="bg-card border border-border p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Redirect Test</h1>
        <p className="text-muted-foreground mb-4">Testing redirect functionality...</p>
        <p className="text-sm text-muted-foreground">Check console for logs</p>
        <div className="mt-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Manual Redirect to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}