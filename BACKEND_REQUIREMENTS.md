# Backend Requirements - Nutri-Vision AI v2

## 📋 Overview

Nutri-Vision AI v2 uses **Supabase** as the primary backend, providing authentication, database, and real-time features out of the box. This document outlines the AI services and additional backend components needed.

## 🗄️ Primary Backend: Supabase

### Already Provided by Supabase
✅ **Authentication**: Email/password with JWT tokens  
✅ **PostgreSQL Database**: Relational data storage with RLS  
✅ **Row Level Security**: Built-in access control  
✅ **Real-time Subscriptions**: WebSocket connections  
✅ **RESTful API**: Auto-generated from database schema  
✅ **Storage**: File uploads (for food images)

### Supabase Configuration

**Database Tables** (already created via SQL):
- `profiles` - User health information
- `meals` - Food logs with nutrition data
- `health_alerts` - Medical condition warnings
- `daily_summaries` - Daily nutrition aggregates

**Row Level Security Policies**:
```sql
-- Users can only access their own data
CREATE POLICY "Users own data" ON profiles
  FOR ALL USING (auth.uid() = id);
```

---

## 🤖 Required AI Services

### 1. Food Recognition & Nutrition Analysis API

**Purpose**: Analyze text/image/voice input and return nutrition data

**Endpoint**: `POST /api/ai/analyze-food`

**Request**:
```json
{
  "input_type": "text" | "image" | "voice",
  "content": "2 eggs and toast" | "base64_image" | "audio_data",
  "user_id": "uuid",
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack"
}
```

**Response**:
```json
{
  "meal_name": "Scrambled Eggs with Toast",
  "food_items": [
    {
      "name": "Scrambled Eggs",
      "quantity": "2",
      "unit": "eggs"
    },
    {
      "name": "Whole Wheat Toast",
      "quantity": "2",
      "unit": "slices"
    }
  ],
  "nutrition": {
    "calories": 320,
    "protein": 18,
    "carbs": 28,
    "fat": 14,
    "sodium": 450,
    "fiber": 4
  },
  "confidence": 0.92
}
```

**Implementation Options**:

**Option A: OpenAI GPT-4 Vision (Recommended for MVP)**
```javascript
// Use GPT-4 for text and vision analysis
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function analyzeFoodText(description) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a nutrition expert. Analyze food descriptions and return detailed nutrition data in JSON format."
      },
      {
        role: "user",
        content: `Analyze this meal and return calories, protein, carbs, fat, sodium: "${description}"`
      }
    ],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

**Option B: Custom ML Model**
- Train on USDA Food Database
- Deploy with TensorFlow Serving
- Use YOLOv8 for image recognition
- Estimated cost: $500-1000/month for hosting

**Option C: Third-Party APIs**
- Nutritionix API ($100/month for 10k requests)
- Edamam Food Database API (Free tier available)
- Spoonacular API ($150/month)

**Recommended**: OpenAI GPT-4 for MVP, then migrate to custom model if needed

---

### 2. Medical Condition Alert Service

**Purpose**: Check logged food against user's medical conditions and generate alerts

**Endpoint**: `POST /api/ai/check-health-alerts`

**Request**:
```json
{
  "user_id": "uuid",
  "meal_data": {
    "calories": 320,
    "protein": 18,
    "carbs": 65,
    "fat": 14,
    "sodium": 850
  },
  "medical_conditions": ["Type 2 Diabetes", "Hypertension"],
  "allergies": ["Dairy", "Tree Nuts"]
}
```

**Response**:
```json
{
  "alerts": [
    {
      "type": "sodium",
      "severity": "warning",
      "message": "High sodium detected: 850mg in this meal. Daily limit for hypertension is 1500mg.",
      "recommendation": "Consider low-sodium alternatives"
    },
    {
      "type": "carbs",
      "severity": "info",
      "message": "65g carbs detected. Monitor blood sugar (Diabetes).",
      "recommendation": "Check blood glucose 2 hours after meal"
    }
  ],
  "is_safe": true
}
```

**Implementation**:
```javascript
// Simple rule-based system (can be enhanced with AI)
const HEALTH_RULES = {
  'Type 2 Diabetes': {
    carbs: { max_per_meal: 60, max_daily: 150, unit: 'g' }
  },
  'Hypertension': {
    sodium: { max_per_meal: 500, max_daily: 1500, unit: 'mg' }
  },
  'High Cholesterol': {
    saturated_fat: { max_per_meal: 20, max_daily: 50, unit: 'g' }
  },
  'Kidney Disease': {
    protein: { max_per_meal: 25, max_daily: 80, unit: 'g' }
  }
}

function checkHealthAlerts(mealData, conditions) {
  const alerts = []
  
  conditions.forEach(condition => {
    const rules = HEALTH_RULES[condition]
    if (!rules) return
    
    Object.entries(rules).forEach(([nutrient, limits]) => {
      if (mealData[nutrient] > limits.max_per_meal) {
        alerts.push({
          type: nutrient,
          severity: mealData[nutrient] > limits.max_per_meal * 1.5 ? 'danger' : 'warning',
          message: `High ${nutrient} detected: ${mealData[nutrient]}${limits.unit} in this meal.`,
          recommendation: `Limit for ${condition} is ${limits.max_per_meal}${limits.unit} per meal.`
        })
      }
    })
  })
  
  return { alerts, is_safe: alerts.filter(a => a.severity === 'danger').length === 0 }
}
```

---

### 3. AI Nutrition Recommendations Service

**Purpose**: Generate personalized meal suggestions and nutrition insights

**Endpoint**: `POST /api/ai/recommendations`

**Request**:
```json
{
  "user_id": "uuid",
  "current_nutrition": {
    "calories": 1200,
    "protein": 45,
    "carbs": 150,
    "fat": 40
  },
  "goals": {
    "daily_calories": 2000,
    "daily_protein": 150,
    "daily_carbs": 250,
    "daily_fat": 65
  },
  "medical_conditions": ["Type 2 Diabetes"],
  "dietary_restrictions": ["Vegetarian"],
  "meal_type": "dinner"
}
```

**Response**:
```json
{
  "insights": [
    {
      "type": "nutrition_gap",
      "message": "You're 105g short on protein today. Try Greek yogurt or chickpeas.",
      "priority": "high"
    },
    {
      "type": "goal_progress",
      "message": "Great job staying within your carb goals! (Diabetes-friendly)",
      "priority": "info"
    }
  ],
  "meal_suggestions": [
    {
      "meal_name": "Grilled Tofu with Quinoa and Roasted Vegetables",
      "calories": 450,
      "protein": 35,
      "reason": "High protein, diabetes-friendly, vegetarian",
      "ingredients": ["firm tofu", "quinoa", "bell peppers", "zucchini"]
    },
    {
      "meal_name": "Lentil Curry with Brown Rice",
      "calories": 400,
      "protein": 28,
      "reason": "Plant-based protein, low GI for blood sugar control",
      "ingredients": ["red lentils", "brown rice", "spinach", "tomatoes"]
    }
  ]
}
```

**Implementation with OpenAI**:
```javascript
async function generateRecommendations(userData) {
  const prompt = `
You are a nutrition AI assistant. Based on this user's data:
- Current intake: ${JSON.stringify(userData.current_nutrition)}
- Daily goals: ${JSON.stringify(userData.goals)}
- Medical conditions: ${userData.medical_conditions.join(', ')}
- Dietary restrictions: ${userData.dietary_restrictions.join(', ')}

Generate:
1. Nutrition insights (what they're missing, what they're doing well)
2. 3 meal suggestions for ${userData.meal_type} that fit their needs

Return as JSON with 'insights' and 'meal_suggestions' arrays.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a certified nutritionist and health coach." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

---

### 4. Voice-to-Text Service

**Purpose**: Convert voice recordings to text for food logging

**Endpoint**: `POST /api/ai/voice-to-text`

**Request**:
```json
{
  "audio_data": "base64_encoded_audio",
  "language": "en-US"
}
```

**Response**:
```json
{
  "text": "I had two eggs and toast for breakfast",
  "confidence": 0.95
}
```

**Implementation Options**:

**Option A: Web Speech API (Frontend - Already Working)**
```javascript
// No backend needed - runs in browser
const recognition = new webkitSpeechRecognition()
recognition.lang = 'en-US'
recognition.onresult = (event) => {
  const text = event.results[0][0].transcript
  // Send text to food analysis API
}
```

**Option B: Google Cloud Speech-to-Text (Backend)**
```javascript
const speech = require('@google-cloud/speech')
const client = new speech.SpeechClient()

async function transcribeAudio(audioBase64) {
  const request = {
    audio: { content: audioBase64 },
    config: {
      encoding: 'LINEAR16',
      languageCode: 'en-US',
    },
  }
  
  const [response] = await client.recognize(request)
  return response.results[0].alternatives[0].transcript
}
```

**Recommended**: Use Web Speech API (free, already implemented)

---

## 🚀 Deployment Architecture

### Recommended Setup

```
Frontend (Vercel)
     ↓
Supabase (Database + Auth)
     ↓
AI Services (Serverless Functions)
     ↓
External APIs (OpenAI, Nutritionix)
```

### Option 1: Serverless Functions (Recommended for MVP)

**Deploy AI services as Next.js API routes**

```javascript
// app/api/ai/analyze-food/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  const { input_type, content, user_id } = await request.json()
  
  // Call OpenAI API
  const nutrition = await analyzeFoodWithAI(content)
  
  // Save to Supabase
  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id,
      raw_input: content,
      input_method: input_type,
      ...nutrition
    })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(nutrition)
}

async function analyzeFoodWithAI(description: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a nutrition expert. Return JSON with: meal_name, food_items array, and nutrition object (calories, protein, carbs, fat, sodium)."
      },
      {
        role: "user",
        content: `Analyze: "${description}"`
      }
    ],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

**Pros**: Easy deployment, scales automatically, pay per use  
**Cons**: Cold starts, 10-second timeout on free tier

---

### Option 2: Dedicated Backend Server

**Node.js/Express server hosted separately**

```javascript
// server.js
const express = require('express')
const app = express()

app.post('/api/ai/analyze-food', async (req, res) => {
  // Food analysis logic
})

app.post('/api/ai/check-health-alerts', async (req, res) => {
  // Health alerts logic
})

app.post('/api/ai/recommendations', async (req, res) => {
  // Recommendations logic
})

app.listen(3001, () => console.log('AI Backend running on 3001'))
```

**Deployment**: Railway, Render, DigitalOcean ($5-10/month)  
**Pros**: More control, no timeouts, can cache models  
**Cons**: Need to manage scaling, more expensive

---

## 💰 Cost Estimate (Monthly)

### Minimal MVP
- **Supabase**: $0 (Free tier: 500MB database, 50k auth users)
- **OpenAI API**: $20-50 (GPT-4: ~$0.03 per food analysis)
- **Vercel Hosting**: $0 (Free tier)
- **Total**: ~$20-50/month

### Production (1000 active users, ~10 meals/day each)
- **Supabase**: $25 (Pro plan)
- **OpenAI API**: $200-500 (10k requests/day at $0.03 each)
- **Vercel Pro**: $20 (for serverless functions)
- **Storage**: $10 (food images)
- **Total**: ~$255-555/month

---

## 🔧 Development Setup

### 1. Set up Supabase
Already complete ✅

### 2. Create AI Service API Routes

Create these files:

```
app/
├── api/
│   ├── ai/
│   │   ├── analyze-food/
│   │   │   └── route.ts
│   │   ├── check-health/
│   │   │   └── route.ts
│   │   └── recommendations/
│   │       └── route.ts
```

### 3. Environment Variables

Add to `.env.local`:
```env
# Supabase (already have)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# AI Services (add these)
OPENAI_API_KEY=sk-xxx
NUTRITIONIX_API_KEY=xxx (optional)
GOOGLE_SPEECH_API_KEY=xxx (optional)
```

### 4. Test APIs

```bash
# Test food analysis
curl -X POST http://localhost:3000/api/ai/analyze-food \
  -H "Content-Type: application/json" \
  -d '{"input_type":"text","content":"2 eggs and toast","user_id":"xxx"}'
```

---

## 📊 Database Triggers (Supabase)

### Auto-update Daily Summaries

```sql
-- Trigger to update daily_summaries when meal is logged
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat, meals_logged)
  VALUES (
    NEW.user_id,
    DATE(NEW.meal_time),
    NEW.calories,
    NEW.protein,
    NEW.carbs,
    NEW.fat,
    1
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = daily_summaries.total_calories + NEW.calories,
    total_protein = daily_summaries.total_protein + NEW.protein,
    total_carbs = daily_summaries.total_carbs + NEW.carbs,
    total_fat = daily_summaries.total_fat + NEW.fat,
    meals_logged = daily_summaries.meals_logged + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_logged_trigger
AFTER INSERT ON meals
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();
```

---

## 🎯 Implementation Priority

### Phase 1: Core Backend (Week 1)
1. ✅ Supabase setup complete
2. ⏳ Food analysis API (OpenAI integration)
3. ⏳ Basic health alerts (rule-based)
4. ⏳ Save meals to database

### Phase 2: AI Features (Week 2)
5. ⏳ Nutrition recommendations
6. ⏳ Meal suggestions
7. ⏳ Daily summaries calculation
8. ⏳ Health alert generation

### Phase 3: Polish (Week 3)
9. ⏳ Image recognition optimization
10. ⏳ Performance tuning
11. ⏳ Error handling & logging
12. ⏳ Caching strategies

---

## 🔐 Security Considerations

- **API Keys**: Store in environment variables, never in frontend code
- **Rate Limiting**: Prevent API abuse (use Vercel rate limiting)
- **Input Validation**: Sanitize all user inputs before AI processing
- **Supabase RLS**: Already enforced at database level
- **HTTPS Only**: Required for production (Vercel provides free SSL)
- **CORS**: Configure allowed origins in API routes

---

## 📚 Recommended Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [USDA Food Database API](https://fdc.nal.usda.gov/api-guide.html)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)

---

## 🚨 Common Issues & Solutions

### Issue: OpenAI API timeout in serverless function
**Solution**: Use streaming responses or implement queue system

### Issue: High OpenAI costs
**Solution**: 
- Cache common food items in database
- Use GPT-3.5-turbo for simple queries ($0.002 per request)
- Batch multiple food items in one request

### Issue: Image uploads not working
**Solution**: Use Supabase Storage for images, then send URL to vision API

### Issue: Slow response times
**Solution**: 
- Implement caching with Redis
- Use database indexes on frequently queried columns
- Optimize AI prompts for faster responses

---

## 📈 Monitoring & Logging

### Recommended Tools
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database queries and performance
- **OpenAI Usage Dashboard**: Track API costs and usage
- **Sentry**: Error tracking and monitoring

### Key Metrics to Track
- Food analysis API response time
- OpenAI API costs per user
- Database query performance
- Daily active users
- Meal logging success rate

---

**Next Steps**: 
1. Set up OpenAI API key
2. Create first API route for food analysis
3. Test with sample meals
4. Add health alerts logic
5. Implement recommendations

Keep it simple and iterate! 🚀
