const BACKEND_URL = 'https://nv-food-logging-api.onrender.com'

async function testRenderAPI() {
  console.log('🧪 Testing Nutri-Vision API on Render...\n')
  console.log('Backend URL:', BACKEND_URL, '\n')

  // Test 1: Root endpoint
  console.log('📍 Test 1: Root Endpoint')
  try {
    const response = await fetch(BACKEND_URL)
    const data = await response.json()
    console.log('✅ Root:', JSON.stringify(data, null, 2), '\n')
  } catch (error) {
    console.error('❌ Root Failed:', error.message, '\n')
  }

  // Test 2: Health Check
  console.log('📍 Test 2: Health Check')
  try {
    const response = await fetch(`${BACKEND_URL}/health`)
    const data = await response.json()
    console.log('✅ Health:', JSON.stringify(data, null, 2), '\n')
  } catch (error) {
    console.error('❌ Health Failed:', error.message, '\n')
  }

  // Test 3: Config Check
  console.log('📍 Test 3: Config Check')
  try {
    const response = await fetch(`${BACKEND_URL}/config`)
    const data = await response.json()
    console.log('✅ Config:', JSON.stringify(data, null, 2), '\n')
  } catch (error) {
    console.error('❌ Config Failed:', error.message, '\n')
  }

  // Test 4: Text Analysis (simple)
  console.log('📍 Test 4: Text Analysis - Simple')
  try {
    const response = await fetch(`${BACKEND_URL}/analyze/text`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: 'apple',
        include_usda: true 
      })
    })
    const data = await response.json()
    console.log('✅ Text Analysis Result:')
    console.log('  - Success:', data.success)
    console.log('  - Items detected:', data.items?.length)
    console.log('  - Total calories:', data.totals?.calories)
    console.log('  - Processing time:', data.processing_time + 's')
    if (data.items && data.items.length > 0) {
      console.log('  - First item:', data.items[0].name, '-', data.items[0].macros.calories, 'cal')
    }
    console.log('')
  } catch (error) {
    console.error('❌ Text Analysis Failed:', error.message, '\n')
  }

  // Test 5: Text Analysis (complex)
  console.log('📍 Test 5: Text Analysis - Complex')
  try {
    const response = await fetch(`${BACKEND_URL}/analyze/text`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: '2 medium apples and 150g grilled chicken breast',
        include_usda: true 
      })
    })
    const data = await response.json()
    console.log('✅ Complex Analysis Result:')
    console.log('  - Success:', data.success)
    console.log('  - Items detected:', data.items?.length)
    console.log('  - Total calories:', data.totals?.calories)
    console.log('  - Total protein:', data.totals?.protein + 'g')
    console.log('  - Items:')
    data.items?.forEach((item, i) => {
      console.log(`    ${i + 1}. ${item.quantity} ${item.unit} ${item.name} (${item.macros.calories} cal)`)
    })
    console.log('')
  } catch (error) {
    console.error('❌ Complex Analysis Failed:', error.message, '\n')
  }

  console.log('✅ Testing Complete!')
}

testRenderAPI()