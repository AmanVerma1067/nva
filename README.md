# Nutri-Vision AI - Smart Nutrition Tracker

A focused, AI-powered nutrition tracking platform with goal-based recommendations and medical condition awareness built with Next.js 14 and Supabase.

## 🎯 Core Features

### Smart Food Logging
- **Text Input with Voice-to-Text**: Type or speak your meals naturally
- **Image Recognition**: Take photos of your food for automatic logging
- **AI Analysis**: Automatic macro calculation (calories, protein, carbs, fat)

### Health-Aware Tracking
- **Medical Condition Alerts**: Real-time warnings for foods that conflict with your conditions
  - Diabetes → High carb warnings
  - Hypertension → High sodium alerts
  - Allergies → Immediate allergen detection
- **Dietary Restrictions**: Respects vegetarian, vegan, gluten-free, etc.
- **Goal-Based Tracking**: Monitor progress toward weight loss, muscle gain, or wellness goals

### AI-Powered Recommendations
- **Daily Nutrition Suggestions**: "You're 35g short on protein today - try Greek yogurt"
- **Goal-Aligned Meal Ideas**: Meal suggestions based on your specific health goals
- **Smart Insights**: AI analyzes your patterns and provides actionable advice

### Simple Dashboard
- **Today's Stats**: Calories, water intake, and macro breakdown
- **Recent Meals**: Quick view of what you've logged
- **Weekly Trends**: 7-day nutrition chart
- **Health Alerts**: Priority warnings for dietary conflicts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nutri-vision-ai.git
cd nutri-vision-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

Create a Supabase project at [supabase.com](https://supabase.com)

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  age INTEGER,
  gender TEXT,
  activity_level TEXT,
  primary_goal TEXT,
  medical_conditions TEXT[],
  dietary_restrictions TEXT[],
  food_allergies TEXT,
  daily_calorie_goal INTEGER DEFAULT 2000,
  daily_protein_goal INTEGER DEFAULT 150,
  daily_carbs_goal INTEGER DEFAULT 250,
  daily_fat_goal INTEGER DEFAULT 65,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_name TEXT,
  meal_time TIMESTAMP DEFAULT NOW(),
  meal_type TEXT,
  input_method TEXT,
  raw_input TEXT,
  food_items JSONB,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  sodium INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Health alerts table
CREATE TABLE health_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily summaries table
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE UNIQUE,
  total_calories INTEGER DEFAULT 0,
  total_protein INTEGER DEFAULT 0,
  total_carbs INTEGER DEFAULT 0,
  total_fat INTEGER DEFAULT 0,
  total_sodium INTEGER DEFAULT 0,
  water_intake INTEGER DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own meals" ON meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own alerts" ON health_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own summaries" ON daily_summaries FOR ALL USING (auth.uid() = user_id);
```

4. **Configure environment variables**

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

### First Time Setup
1. Click "Get Started"
2. Create an account (email + password)
3. Complete 2-step health profile:
   - **Step 1**: Age, gender, activity level, primary goal
   - **Step 2**: Medical conditions, dietary restrictions, allergies

### Daily Usage
1. **Log Food**: Click "Log Your Food"
   - Type: "2 eggs and toast" or click 🎤 to speak
   - Upload: Take a photo of your meal
2. **Check Dashboard**: See your daily progress
3. **Review Alerts**: Health warnings appear automatically
4. **Track Progress**: View weekly nutrition trends

## 🔧 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Accessible component library
- **Recharts**: Data visualization

### Backend
- **Supabase**: Database, authentication, and real-time features
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Built-in authentication

### Key Dependencies
```json
{
  "next": "14.2.16",
  "react": "^18",
  "typescript": "^5",
  "@supabase/supabase-js": "^2.45.4",
  "@supabase/ssr": "^0.5.2",
  "@supabase/auth-helpers-nextjs": "^0.8.7",
  "recharts": "latest",
  "lucide-react": "^0.454.0"
}
```

## 📊 Database Schema

### Tables
- **profiles**: User health information
- **meals**: Food logs with nutrition data
- **health_alerts**: Medical condition warnings
- **daily_summaries**: Aggregated daily nutrition

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## 🔐 Security & Privacy

- **Supabase Authentication**: Secure email/password auth
- **Row Level Security**: Database-level access control
- **HTTPS Only**: All data encrypted in transit
- **No Third-Party Tracking**: Your health data stays private

## 🎨 Design Philosophy

- **Focused**: Only essential features, no bloat
- **Fast**: Optimized for quick food logging
- **Smart**: AI does the heavy lifting
- **Safe**: Medical awareness built-in
- **Simple**: Clean, intuitive interface

## 🧪 Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📖 Project Structure

```
nutri-vision-ai/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── onboarding/        # Health profile setup
│   ├── profile/           # User profile
│   └── settings/          # App settings
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth-flow.tsx     # Authentication logic
│   ├── health-onboarding.tsx  # Onboarding wizard
│   ├── main-dashboard.tsx     # Dashboard layout
│   └── food-input-tabs.tsx    # Food logging UI
├── lib/                   # Utilities
│   └── supabase.ts       # Supabase client
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-key
```

## 🗺️ Roadmap

### Current Version (v2.0)
- ✅ Simplified 2-step onboarding
- ✅ Voice-to-text in food logging
- ✅ AI nutrition recommendations
- ✅ Medical condition alerts
- ✅ Goal-based meal suggestions
- ✅ Supabase integration

### Planned Features
- [ ] Barcode scanner for packaged foods
- [ ] Meal history search and filtering
- [ ] Custom food database
- [ ] Nutrition goal customization
- [ ] Weekly/monthly reports
- [ ] Social sharing (optional)

## 💡 Usage Tips

### For Best Results
- **Be Specific**: "100g grilled chicken" is better than just "chicken"
- **Log Consistently**: Daily tracking gives better AI insights
- **Review Alerts**: Pay attention to health warnings
- **Update Profile**: Keep medical conditions current
- **Check Trends**: Weekly chart shows patterns

### Voice Logging Tips
- Speak naturally: "I had scrambled eggs and toast for breakfast"
- Include portions: "One cup of oatmeal with blueberries"
- Works in Chrome/Edge (Web Speech API required)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## 🆘 Support

### Issues & Bugs
- [GitHub Issues](https://github.com/yourusername/nutri-vision-ai/issues)

### Questions
- Email: support@nutri-vision.ai
- Documentation: [docs.nutri-vision.ai](https://docs.nutri-vision.ai)

## ⚠️ Medical Disclaimer

This application provides nutritional information and should not replace professional medical advice. Always consult with your healthcare provider for medical decisions.

---

**Built with ❤️ for healthier living**

*Nutri-Vision AI - Simple, smart, and safe nutrition tracking*
