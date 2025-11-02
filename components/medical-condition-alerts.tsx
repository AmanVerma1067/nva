"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

export function MedicalConditionAlerts() {
  const alerts = [
    {
      condition: "Type 2 Diabetes",
      type: "warning",
      message: "High carb meal detected - consider pairing with protein to slow glucose absorption",
      time: "12:30 PM",
      icon: AlertTriangle,
    },
    {
      condition: "Hypertension",
      type: "warning",
      message: "Sodium intake today: 1,200mg. Limit remaining meals to 600mg for the day.",
      time: "10:00 AM",
      icon: AlertTriangle,
    },
    {
      condition: "Dietary Allergies",
      type: "success",
      message: "All meals today are shellfish and nut-free. Great job!",
      time: "3:45 PM",
      icon: CheckCircle2,
    },
  ]

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "warning":
        return {
          bg: "border-amber-200 bg-amber-50 dark:bg-amber-900/20",
          text: "text-amber-800 dark:text-amber-200",
          icon: "text-amber-600",
          badge: "bg-amber-100 text-amber-800",
        }
      case "success":
        return {
          bg: "border-green-200 bg-green-50 dark:bg-green-900/20",
          text: "text-green-800 dark:text-green-200",
          icon: "text-green-600",
          badge: "bg-green-100 text-green-800",
        }
      default:
        return {
          bg: "border-blue-200 bg-blue-50 dark:bg-blue-900/20",
          text: "text-blue-800 dark:text-blue-200",
          icon: "text-blue-600",
          badge: "bg-blue-100 text-blue-800",
        }
    }
  }

  return (
    <Card className="border-2 border-red-200/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span>Medical Alerts</span>
        </CardTitle>
        <CardDescription>Condition-specific warnings and health insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => {
          const styles = getTypeStyles(alert.type)
          const IconComponent = alert.icon

          return (
            <Alert key={index} className={`${styles.bg} border`}>
              <div className="flex gap-3">
                <IconComponent className={`h-4 w-4 flex-shrink-0 mt-0.5 ${styles.icon}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge className={`${styles.badge} text-xs mb-1`}>{alert.condition}</Badge>
                      <AlertDescription className={`${styles.text} text-sm`}>{alert.message}</AlertDescription>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{alert.time}</span>
                  </div>
                </div>
              </div>
            </Alert>
          )
        })}
      </CardContent>
    </Card>
  )
}
