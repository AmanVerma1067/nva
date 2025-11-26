"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, TrendingUp, AlertTriangle, Clock, Zap, Loader2 } from "lucide-react"
import { FoodInputTabs } from "@/components/food-input-tabs"
import { NutritionChart } from "@/components/nutrition-chart"
import { AIRecommendations } from "@/components/ai-recommendations"
import { MedicalConditionAlerts } from "@/components/medical-condition-alerts"
import { MealSuggestions } from "@/components/meal-suggestions"
import { useToast } from "@/hooks/use-toast"

interface FoodLog {
  id: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  logged_at: string
  log_type: string
  confidence?: number
  source?: string
}

interface DailyNutrition {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber?: number
  total_sugar?: number
  water_intake_glasses?: number
}

export function MainDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State for real data
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    total_fiber: 0,
    total_sugar: 0,
    water_intake_glasses: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Goals (you can make these configurable later)
  const [calorieGoal] = useState(2000)
  const [proteinGoal] = useState(120)
  const [carbsGoal] = useState(250)
  const [fatGoal] = useState(80)
  const [waterGoal] = useState(8)

  // Fetch food logs from API
  const fetchFoodLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/food-logs?date=${today}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch food logs')
      }
      
      const data = await response.json()
      setFoodLogs(data)
    } catch (error) {
      console.error('Error fetching food logs:', error)
      toast({
        title: "Error",
        description: "Failed to load food logs. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  // Fetch daily nutrition summary
  const fetchDailyNutrition = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/daily-nutrition?date=${today}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily nutrition')
      }
      
      const data = await response.json()
      setDailyNutrition({
        total_calories: data.total_calories || 0,
        total_protein: data.total_protein || 0,
        total_carbs: data.total_carbs || 0,
        total_fat: data.total_fat || 0,
        total_fiber: data.total_fiber || 0,
        total_sugar: data.total_sugar || 0,
        water_intake_glasses: data.water_intake_glasses || 0,
      })
    } catch (error) {
      console.error('Error fetching daily nutrition:', error)
      toast({
        title: "Error",
        description: "Failed to load nutrition data. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchFoodLogs(), fetchDailyNutrition()])
      setIsLoading(false)
    }
    
    if (user) {
      loadData()
    }
  }, [user])

  // Listen for food log updates
  useEffect(() => {
    const handleFoodLogUpdate = () => {
      // Refresh food logs and daily nutrition
      fetchFoodLogs()
      fetchDailyNutrition()
    }

    window.addEventListener('foodLogUpdated', handleFoodLogUpdate)
    
    return () => {
      window.removeEventListener('foodLogUpdated', handleFoodLogUpdate)
    }
  }, [])

  // Calculate health status
  const getHealthStatus = () => {
    const calorieProgress = (dailyNutrition.total_calories / calorieGoal) * 100
    
    if (calorieProgress < 50) return { status: "Low", color: "bg-amber-100 text-amber-800", level: "Consider eating more" }
    if (calorieProgress > 110) return { status: "High", color: "bg-red-100 text-red-800", level: "Over goal" }
    return { status: "Healthy", color: "bg-green-100 text-green-800", level: "On track today" }
  }

  const healthStatus = getHealthStatus()

  // Get last 3 meals for recent meals section
  const recentMeals = foodLogs.slice(0, 3).map(log => ({
    meal: log.description,
    time: new Date(log.logged_at).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    calories: log.calories,
    type: log.log_type,
    confidence: log.confidence,
  }))

  // Today's metrics with real data
  const todayMetrics = [
    { 
      label: "Calories", 
      value: Math.round(dailyNutrition.total_calories), 
      goal: calorieGoal, 
      unit: "kcal", 
      color: "bg-blue-500" 
    },
    { 
      label: "Protein", 
      value: Math.round(dailyNutrition.total_protein), 
      goal: proteinGoal, 
      unit: "g", 
      color: "bg-green-500" 
    },
    { 
      label: "Carbs", 
      value: Math.round(dailyNutrition.total_carbs), 
      goal: carbsGoal, 
      unit: "g", 
      color: "bg-orange-500" 
    },
    { 
      label: "Fat", 
      value: Math.round(dailyNutrition.total_fat), 
      goal: fatGoal, 
      unit: "g", 
      color: "bg-purple-500" 
    },
  ]

  // Generate dynamic health alerts based on data
  const generateHealthAlerts = () => {
    const alerts = []
    
    // Check if over calorie goal
    if (dailyNutrition.total_calories > calorieGoal * 1.1) {
      alerts.push({
        type: "warning",
        message: `You've exceeded your calorie goal by ${Math.round(dailyNutrition.total_calories - calorieGoal)} calories`,
        time: "Now",
      })
    }
    
    // Check if protein is low
    if (dailyNutrition.total_protein < proteinGoal * 0.5 && dailyNutrition.total_calories > calorieGoal * 0.5) {
      alerts.push({
        type: "warning",
        message: "Your protein intake is low today. Consider adding protein-rich foods.",
        time: "Now",
      })
    }
    
    // Check if doing well on carbs
    if (dailyNutrition.total_carbs < carbsGoal && dailyNutrition.total_carbs > carbsGoal * 0.7) {
      alerts.push({
        type: "info",
        message: "Great job staying within your carb limit today!",
        time: "Now",
      })
    }

    // If no logs yet
    if (foodLogs.length === 0) {
      alerts.push({
        type: "info",
        message: "Start logging your meals to get personalized health insights!",
        time: "Now",
      })
    }
    
    return alerts
  }

  const healthAlerts = generateHealthAlerts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg p-6 border border-blue-500/20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.email?.split("@")[0] || "User"}!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {foodLogs.length === 0 
            ? "Start logging your meals to track your nutrition today!"
            : `You've logged ${foodLogs.length} meal${foodLogs.length !== 1 ? 's' : ''} today. Keep up the great work!`
          }
        </p>
      </div>

      {/* Health Alerts Section */}
      {healthAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Health Alerts</h2>
          <div className="grid gap-4">
            {healthAlerts.map((alert, index) => (
              <Alert
                key={index}
                className={
                  alert.type === "warning"
                    ? "border-amber-200 bg-amber-50 dark:bg-amber-900/20"
                    : "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
                }
              >
                <AlertTriangle className={`h-4 w-4 ${alert.type === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                <AlertDescription className="flex justify-between items-center">
                  <span>{alert.message}</span>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(dailyNutrition.total_calories)}</div>
            <p className="text-xs text-muted-foreground">of {calorieGoal} goal</p>
            <Progress value={(dailyNutrition.total_calories / calorieGoal) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyNutrition.water_intake_glasses || 0}</div>
            <p className="text-xs text-muted-foreground">of {waterGoal} glasses</p>
            <Progress value={((dailyNutrition.water_intake_glasses || 0) / waterGoal) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.status}</div>
            <p className="text-xs text-muted-foreground">{healthStatus.level}</p>
            <Badge variant="secondary" className={`mt-2 ${healthStatus.color}`}>
              {healthStatus.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Modal Food Input */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <CardTitle>Log Your Food</CardTitle>
          <CardDescription>Use text, voice, or image to quickly log your meals</CardDescription>
        </CardHeader>
        <CardContent>
          <FoodInputTabs />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <AIRecommendations />
          <MealSuggestions />
        </div>
        <div>
          <MedicalConditionAlerts />
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Nutrition Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Nutrition</CardTitle>
              <CardDescription>Track your macronutrients</CardDescription>
            </CardHeader>
            <CardContent>
              {foodLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No meals logged yet today.</p>
                  <p className="text-sm mt-2">Start logging your meals to see your nutrition breakdown!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayMetrics.map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm text-gray-500">
                          {metric.value}/{metric.goal} {metric.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${metric.color} transition-all duration-500`}
                          style={{ width: `${Math.min((metric.value / metric.goal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Additional nutrition info if available */}
                  {(dailyNutrition.total_fiber || dailyNutrition.total_sugar) && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Additional Nutrients</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {dailyNutrition.total_fiber && dailyNutrition.total_fiber > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fiber</p>
                            <p className="text-lg font-semibold">{Math.round(dailyNutrition.total_fiber)}g</p>
                          </div>
                        )}
                        {dailyNutrition.total_sugar && dailyNutrition.total_sugar > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sugar</p>
                            <p className="text-lg font-semibold">{Math.round(dailyNutrition.total_sugar)}g</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <NutritionChart />
        </div>

        {/* Recent Meals Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMeals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No meals logged yet.</p>
                  <p className="text-xs mt-1">Your recent meals will appear here.</p>
                </div>
              ) : (
                recentMeals.map((meal, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{meal.meal}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {meal.time}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {meal.type}
                        </Badge>
                        {meal.confidence && meal.confidence > 0.8 && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {Math.round(meal.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium ml-2">{meal.calories} cal</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}