# Nutri-Vision AI - API Integration Guide

## Overview

This comprehensive guide explains how to integrate backend APIs into the Nutri-Vision AI frontend. The app requires 4 core API services:

1. Food Logging & Recognition
2. AI Nutrition Insights
3. Meal Suggestions
4. Medical Alerts

---

## 1. Food Logging API Integration

### Purpose

Analyzes food descriptions, images, or voice input and returns detailed nutrition information.

### Frontend Integration Points

- **Location**: `/components/food-input-tabs.tsx`
- **Usage**: Text input, image upload, voice recording tabs

### Expected Backend API Endpoint

```
POST /api/food/analyze
```

### Expected Request Payload

#### Text Input Method

```json
{
  "type": "text",
  "input": "Grilled chicken breast with steamed broccoli and brown rice",
  "portion_size": "1 breast + 1 cup vegetables + 1 cup rice",
  "user_id": "user-uuid",
  "timestamp": "2024-11-05T12:30:00Z"
}
```

#### Image Upload Method

```json
{
  "type": "image",
  "image_url": "https://cdn.example.com/food-image.jpg",
  "image_data": "base64-encoded-image-string",
  "user_id": "user-uuid",
  "timestamp": "2024-11-05T12:30:00Z"
}
```

#### Voice Input Method

```json
{
  "type": "voice",
  "audio_url": "https://cdn.example.com/audio.mp3",
  "audio_data": "base64-encoded-audio-string",
  "user_id": "user-uuid",
  "timestamp": "2024-11-05T12:30:00Z"
}
```

### Expected Response

```json
{
  "success": true,
  "food_items": [
    {
      "name": "Grilled Chicken Breast",
      "serving_size": "1 breast (100g)",
      "calories": 165,
      "macros": {
        "protein": 31,
        "carbs": 0,
        "fat": 3.6
      },
      "micros": {
        "vitamin_b6": 0.88,
        "vitamin_b12": 0.3,
        "niacin": 8.9,
        "iron": 0.8
      },
      "confidence": 0.95,
      "allergens": []
    },
    {
      "name": "Steamed Broccoli",
      "serving_size": "1 cup (156g)",
      "calories": 55,
      "macros": {
        "protein": 3.7,
        "carbs": 11,
        "fat": 0.6
      },
      "micros": {
        "vitamin_c": 89.2,
        "vitamin_k": 101.6,
        "folate": 63
      },
      "confidence": 0.98,
      "allergens": []
    }
  ],
  "meal_summary": {
    "total_calories": 500,
    "total_protein": 44,
    "total_carbs": 100,
    "total_fat": 10,
    "meal_type": "lunch",
    "meal_quality_score": 8.5
  },
  "health_alerts": [],
  "meal_id": "meal-uuid-12345",
  "processed_at": "2024-11-05T12:30:15Z"
}
```

### Frontend Integration Code

Create a new file at `/app/api/food-logs/route.ts`:

```typescript
import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const foodData = await request.json()

  try {
    // Call your backend API
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/food/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
        },
        body: JSON.stringify({
          ...foodData,
          user_id: user.id,
        }),
      }
    )

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.statusText}`)
    }

    const mealData = await backendResponse.json()

    // Store in Supabase
    const { data: savedMeal, error } = await supabase
      .from("food_logs")
      .insert({
        user_id: user.id,
        description: foodData.input || foodData.image_url,
        log_type: foodData.type,
        calories: mealData.meal_summary.total_calories,
        protein: mealData.meal_summary.total_protein,
        carbs: mealData.meal_summary.total_carbs,
        fat: mealData.meal_summary.total_fat,
        logged_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json(mealData)
  } catch (error) {
    console.error("Food analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze food" },
      { status: 500 }
    )
  }
}
```

---

## 2. AI Nutrition Insights API Integration

### Purpose

Generates personalized nutrition advice based on user's health profile and logged food.

### Frontend Integration Points

- **Location**: `/components/ai-recommendations.tsx`
- **Usage**: Displays AI-generated insights on dashboard

### Expected Backend API Endpoint

```
POST /api/nutrition/insights
```

### Expected Request Payload

```json
{
  "user_id": "user-uuid",
  "time_period": "daily",
  "health_profile": {
    "age": 45,
    "gender": "Female",
    "activity_level": "Moderate",
    "medical_conditions": ["Diabetes Type 2", "Hypertension"],
    "dietary_restrictions": ["Low-Sodium"],
    "allergies": ["Shellfish"]
  },
  "food_logs_today": [
    {
      "meal_id": "meal-uuid",
      "food_items": ["Chicken", "Rice", "Vegetables"],
      "calories": 450,
      "macros": {
        "protein": 35,
        "carbs": 50,
        "fat": 12
      }
    }
  ],
  "goals": {
    "daily_calories": 2000,
    "daily_protein": 120,
    "daily_carbs": 200
  }
}
```

### Expected Response

```json
{
  "success": true,
  "insights": [
    {
      "type": "nutrition",
      "priority": "high",
      "title": "Protein Intake on Track",
      "description": "You've consumed 35g of protein so far. You're doing well! Try to include protein-rich foods in your next meals.",
      "suggestion": "Add a Greek yogurt snack (20g protein) this afternoon",
      "confidence": 0.92
    },
    {
      "type": "medical",
      "priority": "high",
      "title": "High Sodium Alert",
      "description": "Your sodium intake today is approaching the recommended limit for hypertension (1,200mg consumed of 2,300mg daily limit)",
      "suggestion": "Avoid processed foods and added salt for your remaining meals",
      "confidence": 0.95,
      "related_condition": "Hypertension"
    },
    {
      "type": "wellness",
      "priority": "medium",
      "title": "Hydration Reminder",
      "description": "You've had 4 glasses of water. Aim for 8 glasses daily to support metabolism.",
      "suggestion": "Drink another glass of water before your next meal",
      "confidence": 0.88
    }
  ],
  "daily_summary": {
    "calorie_progress": {
      "consumed": 450,
      "goal": 2000,
      "percentage": 22.5
    },
    "nutrition_score": 7.8,
    "health_status": "Good",
    "recommendations_count": 3
  },
  "generated_at": "2024-11-05T12:35:00Z"
}
```

### Frontend Integration Code

Create a new file at `/app/api/nutrition/insights/route.ts`:

```typescript
import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    // Fetch today's food logs
    const today = new Date().toISOString().split("T")[0]
    const { data: foodLogs, error: logsError } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", today)

    if (logsError) {
      console.warn("Failed to fetch food logs:", logsError)
    }

    // Fetch medical conditions
    const { data: conditions, error: conditionsError } = await supabase
      .from("medical_conditions")
      .select("*")
      .eq("user_id", user.id)

    if (conditionsError) {
      console.warn("Failed to fetch medical conditions:", conditionsError)
    }

    // Call backend API
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/nutrition/insights`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          health_profile: {
            age: userProfile?.age,
            gender: userProfile?.gender,
            activity_level: userProfile?.activity_level,
            medical_conditions: conditions?.map((c) => c.condition_name) || [],
          },
          food_logs_today: foodLogs || [],
        }),
      }
    )

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.statusText}`)
    }

    const insights = await backendResponse.json()

    // Store insights in Supabase
    if (insights.insights && insights.insights.length > 0) {
      const insightsToStore = insights.insights.map((insight: any) => ({
        user_id: user.id,
        insight_type: insight.type,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
      }))

      const { error: insertError } = await supabase
        .from("health_insights")
        .insert(insightsToStore)

      if (insertError) {
        console.warn("Failed to store insights:", insertError)
      }
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Insights generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate insights" },
      { status: 500 }
    )
  }
}
```

---

## 3. Meal Suggestions API Integration

### Purpose

Provides personalized meal recommendations based on health profile and daily nutrition goals.

### Frontend Integration Points

- **Location**: `/components/meal-suggestions.tsx`
- **Usage**: Shows suggested meals on dashboard

### Expected Backend API Endpoint

```
POST /api/meals/suggest
```

### Expected Request Payload

```json
{
  "user_id": "user-uuid",
  "health_profile": {
    "medical_conditions": ["Diabetes Type 2", "Hypertension"],
    "dietary_restrictions": ["Low-Sodium", "Low-Carb"],
    "allergies": ["Shellfish", "Peanuts"],
    "food_preferences": ["Mediterranean", "Asian"]
  },
  "current_nutrition": {
    "calories_consumed": 450,
    "calories_remaining": 1550,
    "protein_consumed": 35,
    "protein_remaining": 85,
    "carbs_consumed": 50,
    "carbs_remaining": 150
  },
  "meal_type": "lunch",
  "prep_time_minutes": 30
}
```

### Expected Response

```json
{
  "success": true,
  "meal_suggestions": [
    {
      "id": "meal-suggestion-1",
      "name": "Lemon Herb Grilled Salmon with Quinoa",
      "cuisine": "Mediterranean",
      "prep_time": "25 minutes",
      "difficulty": "medium",
      "nutrition": {
        "calories": 520,
        "protein": 45,
        "carbs": 35,
        "fat": 18
      },
      "benefits": [
        "High in Omega-3 fatty acids (heart health)",
        "Low glycemic index (blood sugar control)",
        "Supports healthy cholesterol levels"
      ],
      "why_recommended": "This meal fits perfectly into your remaining calories and provides excellent protein. The low glycemic index helps manage your diabetes.",
      "ingredients": [
        "Salmon fillet (6 oz)",
        "Quinoa (½ cup cooked)",
        "Lemon",
        "Herbs (thyme, rosemary)",
        "Olive oil (1 tbsp)"
      ],
      "allergen_safe": true,
      "recipe_url": "https://recipes.example.com/salmon-quinoa",
      "confidence": 0.96
    },
    {
      "id": "meal-suggestion-2",
      "name": "Vegetable Stir-Fry with Tofu",
      "cuisine": "Asian",
      "prep_time": "20 minutes",
      "difficulty": "easy",
      "nutrition": {
        "calories": 380,
        "protein": 28,
        "carbs": 42,
        "fat": 12
      },
      "benefits": [
        "High in fiber and antioxidants",
        "Low sodium preparation",
        "Excellent for weight management"
      ],
      "why_recommended": "Lower calorie option that still meets your nutritional needs. Perfect for managing hypertension with minimal sodium.",
      "ingredients": [
        "Extra firm tofu (8 oz)",
        "Mixed vegetables (broccoli, bell peppers, snap peas)",
        "Low-sodium soy sauce",
        "Garlic and ginger",
        "Sesame oil (½ tbsp)"
      ],
      "allergen_safe": true,
      "recipe_url": "https://recipes.example.com/tofu-stir-fry",
      "confidence": 0.92
    }
  ],
  "generated_at": "2024-11-05T12:40:00Z"
}
```

### Frontend Integration Code

Create a new file at `/app/api/meals/suggest/route.ts`:

```typescript
import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    // Fetch today's nutrition data
    const today = new Date().toISOString().split("T")[0]
    const { data: dailyNutrition } = await supabase
      .from("daily_nutrition")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .single()

    // Call backend API
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meals/suggest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          health_profile: userProfile,
          current_nutrition: dailyNutrition || {
            calories_consumed: 0,
            protein_consumed: 0,
            carbs_consumed: 0,
            fat_consumed: 0,
          },
        }),
      }
    )

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.statusText}`)
    }

    const suggestions = await backendResponse.json()
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Meal suggestions error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get meal suggestions" },
      { status: 500 }
    )
  }
}
```

---

## 4. Medical Alerts API Integration

### Purpose

Detects health risks like medication-food interactions, allergen warnings, and dangerous nutrient combinations.

### Frontend Integration Points

- **Location**: `/components/medical-condition-alerts.tsx`
- **Usage**: Shows urgent health warnings

### Expected Backend API Endpoint

```
POST /api/health/alerts
```

### Expected Request Payload

```json
{
  "user_id": "user-uuid",
  "health_data": {
    "medical_conditions": ["Diabetes Type 2", "Hypertension"],
    "medications": [
      {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "twice daily"
      },
      {
        "name": "Lisinopril",
        "dosage": "10mg",
        "frequency": "once daily"
      }
    ],
    "allergies": ["Shellfish (anaphylaxis)", "Peanuts (hives)"]
  },
  "food_items_logged": [
    {
      "name": "Grilled Salmon",
      "macros": {
        "sodium": 85,
        "potassium": 415,
        "vitamin_k": 0
      }
    },
    {
      "name": "Brown Rice",
      "macros": {
        "sodium": 5,
        "potassium": 84,
        "vitamin_k": 0.8
      }
    }
  ],
  "daily_totals": {
    "sodium": 2800,
    "potassium": 3200
  }
}
```

### Expected Response

```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert-1",
      "severity": "high",
      "type": "medication_interaction",
      "title": "Potential Medication Interaction",
      "message": "High potassium intake detected (3,200mg). This may interact with your Lisinopril (ACE inhibitor), which can increase potassium levels dangerously.",
      "affected_medication": "Lisinopril",
      "recommendation": "Limit potassium intake to <2,000mg daily. Avoid high-potassium foods like bananas, spinach, and sweet potatoes.",
      "action_required": true,
      "action_items": [
        "Contact your doctor to check potassium levels",
        "Adjust your diet to reduce potassium intake"
      ],
      "generated_at": "2024-11-05T12:45:00Z"
    },
    {
      "id": "alert-2",
      "severity": "high",
      "type": "allergen_warning",
      "title": "Allergen Detected",
      "message": "Warning: Shellfish detected in your logged food. You have a severe shellfish allergy (anaphylaxis)!",
      "allergen": "Shellfish",
      "severity_level": "Anaphylaxis",
      "recommendation": "DO NOT CONSUME. Call emergency services if you have already ingested this food and experiencing symptoms.",
      "action_required": true,
      "emergency_contact": true,
      "generated_at": "2024-11-05T12:45:00Z"
    },
    {
      "id": "alert-3",
      "severity": "medium",
      "type": "sodium_warning",
      "title": "High Sodium Intake Alert",
      "message": "Your sodium intake today (2,800mg) exceeds the recommended limit for hypertension (2,300mg). This is 122% of your daily target.",
      "affected_condition": "Hypertension",
      "risk": "elevated",
      "recommendation": "Reduce sodium for remaining meals. Avoid: soy sauce, canned foods, processed meats, salted snacks.",
      "current_sodium": 2800,
      "daily_limit": 2300,
      "generated_at": "2024-11-05T12:45:00Z"
    }
  ],
  "alert_count": 3,
  "critical_alerts": 2
}
```

### Frontend Integration Code

Create a new file at `/app/api/health/alerts/route.ts`:

```typescript
import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch user health data
    const { data: medicalConditions } = await supabase
      .from("medical_conditions")
      .select("*")
      .eq("user_id", user.id)

    const { data: allergies } = await supabase
      .from("food_allergies")
      .select("*")
      .eq("user_id", user.id)

    const { data: medications } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", user.id)

    // Fetch today's food logs
    const today = new Date().toISOString().split("T")[0]
    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", today)

    // Calculate daily totals
    const dailyTotals = foodLogs?.reduce(
      (acc, log) => ({
        calories: (acc.calories || 0) + (log.calories || 0),
        protein: (acc.protein || 0) + (log.protein || 0),
        carbs: (acc.carbs || 0) + (log.carbs || 0),
        fat: (acc.fat || 0) + (log.fat || 0),
        sodium: (acc.sodium || 0) + (log.sodium || 0),
        potassium: (acc.potassium || 0) + (log.potassium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0 }
    )

    // Call backend API
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health/alerts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          health_data: {
            medical_conditions: medicalConditions?.map((c) => c.condition_name) || [],
            medications: medications || [],
            allergies:
              allergies?.map((a) => `${a.allergen} (${a.severity})`) || [],
          },
          food_items_logged: foodLogs || [],
          daily_totals: dailyTotals,
        }),
      }
    )

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.statusText}`)
    }

    const alerts = await backendResponse.json()

    // Store high-priority alerts in Supabase
    if (alerts.alerts && alerts.alerts.length > 0) {
      const highPriorityAlerts = alerts.alerts
        .filter((alert: any) => alert.severity === "high")
        .map((alert: any) => ({
          user_id: user.id,
          insight_type: "alert",
          title: alert.title,
          description: alert.message,
          priority: "high",
        }))

      if (highPriorityAlerts.length > 0) {
        const { error: insertError } = await supabase
          .from("health_insights")
          .insert(highPriorityAlerts)

        if (insertError) {
          console.warn("Failed to store alerts:", insertError)
        }
      }
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error("Health alerts error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate alerts" },
      { status: 500 }
    )
  }
}
```

---

## Implementation Steps Summary

### Step 1: Set Up Environment Variables

Add these variables to your `.env.local` file:

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.com
BACKEND_API_KEY=your-secure-api-key-here
```

**Important**: Never commit `.env.local` to version control. Add it to `.gitignore`.

### Step 2: Create API Route Handlers

Create the following files with the provided code:

- `/app/api/food-logs/route.ts`
- `/app/api/nutrition/insights/route.ts`
- `/app/api/meals/suggest/route.ts`
- `/app/api/health/alerts/route.ts`

### Step 3: Update Component API Calls

The frontend components should call these endpoints:

```typescript
// In food-input-tabs.tsx
const response = await fetch("/api/food-logs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(foodData),
})

// In ai-recommendations.tsx
const response = await fetch("/api/nutrition/insights")

// In meal-suggestions.tsx
const response = await fetch("/api/meals/suggest")

// In medical-condition-alerts.tsx
const response = await fetch("/api/health/alerts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(alertData),
})
```

### Step 4: Testing Checklist

Verify each integration works correctly:

- [ ] Food logging creates entry in database
- [ ] Nutritional data displays correctly on dashboard
- [ ] AI insights appear within 2 seconds
- [ ] Meal suggestions match user's health profile
- [ ] Medical alerts trigger for dangerous combinations
- [ ] Notification popups work correctly
- [ ] All data syncs with Supabase in real-time
- [ ] Error messages display gracefully
- [ ] App handles offline mode for cached data

---

## Error Handling

### Standardized Error Response Format

All API endpoints should return this error structure:

```json
{
  "error": "Descriptive error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "details": "Additional context if available",
  "timestamp": "2024-11-05T12:45:00Z"
}
```

### Frontend Error Handling

The frontend displays errors using toast notifications:

```typescript
if (!response.ok) {
  const error = await response.json()
  toast({
    title: "Error",
    description: error.error || "Something went wrong. Please try again.",
    variant: "destructive",
  })
  return
}
```

### Common Error Codes

- `AUTH_REQUIRED` - User not authenticated
- `INVALID_INPUT` - Request payload validation failed
- `BACKEND_ERROR` - Backend API unavailable or error
- `DATABASE_ERROR` - Supabase operation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limiting & Caching Strategy

### API Call Frequency

| Endpoint | Cache Duration | Max Calls per User |
|----------|---------------|-------------------|
| Food Analysis | 1 hour | 50/day |
| Insights Generation | 24 hours | 10/day |
| Meal Suggestions | 24 hours | 20/day |
| Medical Alerts | No cache (real-time) | 100/day |

### Implementation

Add caching middleware to API routes:

```typescript
// Example for meal suggestions
const CACHE_KEY = `meal-suggestions-${user.id}-${today}`
const cached = await redis.get(CACHE_KEY)

if (cached) {
  return NextResponse.json(JSON.parse(cached))
}

// Fetch from backend...
await redis.set(CACHE_KEY, JSON.stringify(suggestions), "EX", 86400) // 24 hours
```

---

## Security Considerations

### Authentication & Authorization

1. **User Authentication**: All endpoints verify user session via Supabase
2. **Backend Authorization**: API calls use Bearer token authentication
3. **Rate Limiting**: Implement per-user rate limits to prevent abuse
4. **Input Validation**: Sanitize all user inputs before processing

### Data Protection

1. **Encryption**: Sensitive health data encrypted at rest in Supabase
2. **Row Level Security (RLS)**: Enable RLS policies on all tables
3. **HTTPS Only**: Enforce HTTPS for all API communications
4. **No Console Logging**: Never log sensitive data in production

### Example RLS Policy

```sql
-- Only users can access their own data
CREATE POLICY "Users can only access own records"
ON food_logs FOR ALL
USING (auth.uid() = user_id);
```

---

## Performance Optimization

### Backend Optimization

1. **Batch Requests**: Combine multiple API calls when possible
2. **Async Processing**: Use webhooks for long-running operations
3. **Response Compression**: Enable gzip compression for large responses
4. **CDN Integration**: Serve static assets through CDN

### Frontend Optimization

1. **Lazy Loading**: Load components only when needed
2. **Debouncing**: Debounce search and input fields
3. **Optimistic UI Updates**: Update UI immediately, sync in background
4. **Progressive Loading**: Show skeleton screens while data loads

```typescript
// Example: Debounced food search
import { useDebouncedCallback } from 'use-debounce'

const debouncedSearch = useDebouncedCallback((query: string) => {
  searchFood(query)
}, 500)
```

---

## Database Schema Requirements

### Required Supabase Tables

#### 1. `food_logs` Table

```sql
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  log_type VARCHAR(20) CHECK (log_type IN ('text', 'image', 'voice')),
  calories INTEGER,
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  sodium DECIMAL(10,2),
  potassium DECIMAL(10,2),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_at);
```

#### 2. `medical_conditions` Table

```sql
CREATE TABLE medical_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_name VARCHAR(100) NOT NULL,
  diagnosed_date DATE,
  severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `food_allergies` Table

```sql
CREATE TABLE food_allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen VARCHAR(100) NOT NULL,
  severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe', 'anaphylaxis')),
  reactions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `medications` Table

```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  dosage VARCHAR(50),
  frequency VARCHAR(100),
  start_date DATE,
  end_date DATE,
  prescribing_doctor VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `health_insights` Table

```sql
CREATE TABLE health_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) CHECK (insight_type IN ('nutrition', 'medical', 'wellness', 'alert')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_insights_user_priority ON health_insights(user_id, priority, is_read);
```

#### 6. `daily_nutrition` Table

```sql
CREATE TABLE daily_nutrition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  calories_consumed INTEGER DEFAULT 0,
  protein_consumed DECIMAL(10,2) DEFAULT 0,
  carbs_consumed DECIMAL(10,2) DEFAULT 0,
  fat_consumed DECIMAL(10,2) DEFAULT 0,
  sodium_consumed DECIMAL(10,2) DEFAULT 0,
  potassium_consumed DECIMAL(10,2) DEFAULT 0,
  calories_goal INTEGER,
  protein_goal DECIMAL(10,2),
  carbs_goal DECIMAL(10,2),
  fat_goal DECIMAL(10,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

#### 7. `users` Table (Extended Profile)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  age INTEGER,
  gender VARCHAR(20),
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level VARCHAR(50) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_restrictions TEXT[],
  food_preferences TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Monitoring & Logging

### Application Monitoring

Implement comprehensive logging for debugging and monitoring:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
    // Send to error tracking service (e.g., Sentry)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data)
  },
}
```

### Key Metrics to Track

1. **API Response Times**: Monitor latency for each endpoint
2. **Error Rates**: Track failed requests and error types
3. **User Engagement**: Food logs per day, feature usage
4. **Health Alert Frequency**: Number and types of alerts triggered
5. **Backend API Availability**: Uptime and response times

### Recommended Tools

- **Error Tracking**: Sentry or Rollbar
- **Performance Monitoring**: Vercel Analytics or New Relic
- **Log Aggregation**: LogRocket or Datadog
- **Uptime Monitoring**: UptimeRobot or Pingdom

---

## API Versioning Strategy

### Version Format

Use URL-based versioning for API endpoints:

```
https://api.example.com/v1/food/analyze
https://api.example.com/v2/food/analyze
```

### Version Migration Plan

When introducing breaking changes:

1. **Announce deprecation** 90 days in advance
2. **Support both versions** during transition period
3. **Provide migration guide** with code examples
4. **Monitor usage** of deprecated endpoints
5. **Sunset old version** after transition period

### Frontend Version Handling

```typescript
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${API_VERSION}/food/analyze`
```

---

## Webhook Integration (Optional)

### Purpose

For long-running operations like image analysis or complex meal planning, use webhooks to notify the frontend when processing is complete.

### Webhook Endpoint Setup

Backend sends POST request to your webhook endpoint:

```typescript
// app/api/webhooks/food-analysis/route.ts
import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const signature = request.headers.get("x-webhook-signature")
  
  if (!verifyWebhookSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const payload = await request.json()
  const { user_id, meal_id, analysis_result } = payload

  const supabase = await createSupabaseServer()

  // Update food log with analysis results
  const { error } = await supabase
    .from("food_logs")
    .update({
      calories: analysis_result.calories,
      protein: analysis_result.protein,
      carbs: analysis_result.carbs,
      fat: analysis_result.fat,
    })
    .eq("id", meal_id)

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  // Trigger real-time update to frontend via Supabase Realtime
  return NextResponse.json({ success: true })
}
```

---

## Real-Time Updates with Supabase

### Enable Realtime Subscriptions

Listen for database changes in your components:

```typescript
// components/dashboard.tsx
import { useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'

export function Dashboard() {
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Subscribe to food_logs changes
    const channel = supabase
      .channel('food_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_logs',
        },
        (payload) => {
          console.log('New food log:', payload.new)
          // Update UI with new data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <div>Dashboard Content</div>
}
```

---

## Testing Strategy

### Unit Tests

Test individual API route handlers:

```typescript
// __tests__/api/food-logs.test.ts
import { POST } from '@/app/api/food-logs/route'
import { NextRequest } from 'next/server'

describe('POST /api/food-logs', () => {
  it('returns 401 when user is not authenticated', async () => {
    const request = new NextRequest('http://localhost/api/food-logs', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('successfully logs food item', async () => {
    // Mock authenticated user
    // Test food logging logic
  })
})
```

### Integration Tests

Test full API flow from frontend to backend:

```typescript
// __tests__/integration/food-logging.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodInputTabs } from '@/components/food-input-tabs'

describe('Food Logging Integration', () => {
  it('logs food and displays nutrition data', async () => {
    render(<FoodInputTabs />)

    const input = screen.getByPlaceholderText('Describe your meal...')
    fireEvent.change(input, { target: { value: 'Chicken breast' } })

    const submitButton = screen.getByText('Log Food')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('165 calories')).toBeInTheDocument()
    })
  })
})
```

### End-to-End Tests

Use Playwright or Cypress for E2E testing:

```typescript
// e2e/food-logging.spec.ts
import { test, expect } from '@playwright/test'

test('user can log food and see nutrition data', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard')
  
  await page.fill('[data-testid="food-input"]', 'Grilled chicken')
  await page.click('[data-testid="log-food-button"]')
  
  await expect(page.locator('[data-testid="calories"]')).toContainText('165')
})
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: "Unauthorized" Error

**Symptoms**: 401 error when calling API routes

**Solutions**:
- Verify user is logged in via Supabase Auth
- Check JWT token is valid and not expired
- Ensure RLS policies are configured correctly

```typescript
// Debug: Check user session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

#### Issue 2: Backend API Not Responding

**Symptoms**: 500 error or timeout when calling backend

**Solutions**:
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check backend API is running and accessible
- Verify API key is valid
- Check CORS settings on backend

```typescript
// Debug: Test backend connection
const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`)
console.log('Backend status:', response.status)
```

#### Issue 3: Data Not Saving to Supabase

**Symptoms**: No error but data doesn't appear in database

**Solutions**:
- Check RLS policies allow insert operations
- Verify table columns match insert data
- Check for database constraints violations
- Review Supabase logs in dashboard

```typescript
// Debug: Check insert response
const { data, error } = await supabase.from('food_logs').insert(logData).select()
console.log('Insert result:', { data, error })
```

#### Issue 4: Slow API Response Times

**Symptoms**: Pages load slowly or timeout

**Solutions**:
- Implement caching for frequently accessed data
- Optimize database queries with indexes
- Use pagination for large datasets
- Enable database connection pooling
- Consider implementing CDN for static assets

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in production
- [ ] Database migrations applied to production database
- [ ] RLS policies enabled and tested
- [ ] API rate limits configured
- [ ] Error tracking service integrated (Sentry)
- [ ] Monitoring and logging set up
- [ ] SSL certificates configured
- [ ] CORS settings configured on backend
- [ ] All tests passing

### Post-Deployment

- [ ] Verify all API endpoints responding correctly
- [ ] Test food logging functionality
- [ ] Verify AI insights generation
- [ ] Test meal suggestions
- [ ] Verify medical alerts triggering
- [ ] Check error tracking dashboard
- [ ] Monitor API response times
- [ ] Verify database connections stable
- [ ] Test with real user accounts
- [ ] Document any production-specific configurations

---

## Support and Maintenance

### Backend API Requirements

Ensure your backend team provides:

1. **API Documentation**: OpenAPI/Swagger docs for all endpoints
2. **Health Check Endpoint**: `/health` endpoint for monitoring
3. **Webhook Documentation**: If using async processing
4. **Rate Limit Information**: Current limits and how to request increases
5. **SLA Commitments**: Expected uptime and response times
6. **Support Contact**: Email/Slack for API issues

### Regular Maintenance Tasks

#### Weekly
- Review error logs and fix critical issues
- Monitor API response times
- Check database performance

#### Monthly
- Update dependencies to latest stable versions
- Review and optimize slow database queries
- Analyze user engagement metrics
- Check for outdated cached data

#### Quarterly
- Security audit of API endpoints
- Review and update RLS policies
- Optimize database indexes
- Load testing and performance optimization

---

## Additional Resources

### Documentation Links

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

### Example Projects

Check the `/examples` directory in the repository for:
- Complete API integration examples
- Sample test suites
- Common use case implementations

### Getting Help

- **Technical Issues**: Create issue in GitHub repository
- **Backend API Questions**: Contact backend team via Slack
- **Database Issues**: Check Supabase dashboard logs
- **General Questions**: Email support@nutri-vision.com

---

## Changelog

### Version 1.0.0 (2024-11-05)

- Initial API integration guide
- Four core API endpoints documented
- Database schema defined
- Security and performance guidelines established