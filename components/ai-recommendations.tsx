"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { Sparkles, TrendingUp, Heart, Zap } from "lucide-react"

export function AIRecommendations() {
  const recommendations = [
    {
      title: "Increase Protein Intake",
      description: "You are 35g short of your daily goal. Try adding Greek yogurt or salmon to your meals.",
      priority: "high",
      icon: TrendingUp,
      action: "View Ideas",
    },
    {
      title: "Reduce Sodium",
      description: "Your meals today averaged 850mg sodium. Consider using herbs instead of salt for flavoring.",
      priority: "medium",
      icon: Heart,
      action: "Get Recipes",
    },
    {
      title: "Hydration Reminder",
      description: "You have logged 2 glasses of water. Aim for 8 glasses throughout the day.",
      priority: "low",
      icon: Zap,
      action: "Dismiss",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <Card className="border-2 border-medical-blue/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-medical-blue" />
          <span>AI Nutrition Insights</span>
        </CardTitle>
        <CardDescription>Personalized recommendations based on your health profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const IconComponent = rec.icon
          return (
            <Alert key={index} className="border-l-4 border-l-medical-blue">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-medical-blue flex-shrink-0" />
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge className={`${getPriorityColor(rec.priority)} text-xs`}>{rec.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                </div>
              </div>
            </Alert>
          )
        })}

        <div className="grid grid-cols-2 gap-2 pt-4">
          <Button variant="outline" size="sm" className="text-xs bg-transparent">
            Learn More
          </Button>
          <Button size="sm" className="bg-medical-blue hover:bg-medical-blue/90 text-xs">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
