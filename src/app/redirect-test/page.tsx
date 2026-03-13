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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Redirect Test</h1>
        <p className="text-gray-600 mb-4">Testing redirect functionality...</p>
        <p className="text-sm text-gray-500">Check console for logs</p>
        <div className="mt-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Manual Redirect to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}