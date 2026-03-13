// Simple login test script
async function testLogin() {
  try {
    console.log('Testing login API...')
    
    const response = await fetch('https://tiles-inventory.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tiles.com',
        password: 'admin123'
      }),
      credentials: 'include'
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('Response data:', data)
    
    if (response.ok) {
      console.log('✅ Login successful!')
      
      // Test session verification
      console.log('Testing session verification...')
      const verifyResponse = await fetch('https://tiles-inventory.vercel.app/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      })
      
      console.log('Verify response status:', verifyResponse.status)
      const verifyData = await verifyResponse.json()
      console.log('Verify response data:', verifyData)
      
    } else {
      console.log('❌ Login failed:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testLogin()