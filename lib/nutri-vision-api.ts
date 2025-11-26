interface NutriVisionTextRequest {
  text: string
  include_usda?: boolean
}

interface NutriVisionFoodItem {
  name: string
  quantity: number
  unit: string
  macros: {
    calories: number
    protein: number
    carbs: number
    fats: number
    fiber?: number
    sugar?: number
  }
  confidence: number
  source: string
  notes?: string | null
  usda_food_id?: string | null
  logmeal_food_id?: string | null
}

interface NutriVisionResponse {
  success: boolean
  input_type: 'text' | 'image' | 'voice'
  raw_input: string
  items: NutriVisionFoodItem[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fats: number
    fiber?: number
    sugar?: number
  }
  processing_time: number
  warnings: string[]
  metadata: {
    usda_configured: boolean
    logmeal_configured: boolean
    items_with_usda: number
    items_with_mock: number
    usda_lookup_enabled?: boolean
  }
}

export class NutriVisionAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

    if (!this.baseUrl) {
      throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured in environment variables')
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.detail || errorMessage
        } catch {
          // If can't parse error as JSON, use default message
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while calling Nutri-Vision API')
    }
  }

  async analyzeText(text: string): Promise<NutriVisionResponse> {
    return this.makeRequest<NutriVisionResponse>('/analyze/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        include_usda: true,
      }),
    })
  }

  async analyzeImage(imageFile: File): Promise<NutriVisionResponse> {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('include_nutrition', 'true')

    return this.makeRequest<NutriVisionResponse>('/analyze/image', {
      method: 'POST',
      body: formData,
    })
  }

  async healthCheck(): Promise<{ status: string; version?: string }> {
    return this.makeRequest('/health')
  }

  async getConfig(): Promise<any> {
    return this.makeRequest('/config')
  }
}

export const nutriVisionAPI = new NutriVisionAPI()