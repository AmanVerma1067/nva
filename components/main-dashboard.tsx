"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, TrendingUp, AlertTriangle, Clock, Zap } from "lucide-react"
import { FoodInputTabs } from "@/components/food-input-tabs"
import { NutritionChart } from "@/components/nutrition-chart"
import { AIRecommendations } from "@/components/ai-recommendations"
import { MedicalConditionAlerts } from "@/components/medical-condition-alerts"
import { MealSuggestions } from "@/components/meal-suggestions"

export function MainDashboard() {
  const [todayCalories] = useState(1450)
  const [calorieGoal] = useState(2000)
  const [waterIntake] = useState(6)
  const [waterGoal] = useState(8)

  const healthAlerts = [
    {
      type: "warning",
      message: "High sodium intake detected - consider reducing salt for your hypertension",
      time: "2 hours ago",
    },
    {
      type: "info",
      message: "Great job staying within your carb limit today!",
      time: "4 hours ago",
    },
  ]

  const todayMetrics = [
    { label: "Calories", value: todayCalories, goal: calorieGoal, unit: "kcal", color: "bg-blue-500" },
    { label: "Protein", value: 85, goal: 120, unit: "g", color: "bg-green-500" },
    { label: "Carbs", value: 180, goal: 250, unit: "g", color: "bg-orange-500" },
    { label: "Fat", value: 65, goal: 80, unit: "g", color: "bg-purple-500" },
  ]

  return (
    <div className="space-y-8">
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
        <Card className="border-2 border-medical-blue/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
            <Zap className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCalories}</div>
            <p className="text-xs text-muted-foreground">of {calorieGoal} goal</p>
            <Progress value={(todayCalories / calorieGoal) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waterIntake}</div>
            <p className="text-xs text-muted-foreground">of {waterGoal} glasses</p>
            <Progress value={(waterIntake / waterGoal) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">On track today</p>
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
              Excellent
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Modal Food Input */}
      <Card className="border-2 border-medical-blue/20">
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
                        className={`h-2 rounded-full ${metric.color}`}
                        style={{ width: `${Math.min((metric.value / metric.goal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
              {[
                { meal: "Grilled Salmon Salad", time: "12:30 PM", calories: 420 },
                { meal: "Greek Yogurt & Berries", time: "9:15 AM", calories: 180 },
                { meal: "Oatmeal with Banana", time: "7:30 AM", calories: 250 },
              ].map((meal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{meal.meal}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {meal.time}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{meal.calories} cal</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
