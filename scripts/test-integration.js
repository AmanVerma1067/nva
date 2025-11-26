// Test script to verify backend connection
async function testBackendIntegration() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  
  console.log('🧪 Testing Nutri-Vision API Integration...\n')
  
  // Test 1: Health Check
  try {
    const health = await fetch(`${backendUrl}/health`)
    const healthData = await health.json()
    console.log('✅ Health Check:', healthData)
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message)
  }
  
  // Test 2: Config Check
  try {
    const config = await fetch(`${backendUrl}/config`)
    const configData = await config.json()
    console.log('✅ Config Check:', configData)
  } catch (error) {
    console.error('❌ Config Check Failed:', error.message)
  }
  
  // Test 3: Text Analysis
  try {
    const text = await fetch(`${backendUrl}/analyze/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'apple', include_usda: true })
    })
    const textData = await text.json()
    console.log('✅ Text Analysis:', textData.items?.length, 'items detected')
  } catch (error) {
    console.error('❌ Text Analysis Failed:', error.message)
  }
}

testBackendIntegration()