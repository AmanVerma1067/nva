// Utility functions for nutrition calculations

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function calculateCalorieNeeds(
  age: number,
  gender: "male" | "female" | "other",
  activityLevel: string,
  weight?: number,
  height?: number,
): number {
  // Simplified Mifflin-St Jeor equation
  // Default values for estimation
  const avgWeight = gender === "male" ? 80 : 70 // kg
  const avgHeight = gender === "male" ? 178 : 165 // cm

  const bmr =
    gender === "male"
      ? 10 * avgWeight + 6.25 * avgHeight - 5 * age + 5
      : 10 * avgWeight + 6.25 * avgHeight - 5 * age - 161

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  }

  const multiplier = activityMultipliers[activityLevel] || 1.55
  return Math.round(bmr * multiplier)
}

export function calculateMacroGoals(calorieNeeds: number, dietaryPreferences?: string[]): NutritionGoals {
  // Standard macronutrient distribution
  // Protein: 30%, Carbs: 40%, Fat: 30%

  const isKeto = dietaryPreferences?.includes("Keto")
  const isLowCarb = dietaryPreferences?.includes("Low-Carb")

  let proteinPercent = 0.3
  let carbPercent = 0.4
  let fatPercent = 0.3

  if (isKeto) {
    proteinPercent = 0.25
    carbPercent = 0.05
    fatPercent = 0.7
  } else if (isLowCarb) {
    proteinPercent = 0.35
    carbPercent = 0.25
    fatPercent = 0.4
  }

  return {
    calories: calorieNeeds,
    protein: Math.round((calorieNeeds * proteinPercent) / 4), // 4 cal/g
    carbs: Math.round((calorieNeeds * carbPercent) / 4), // 4 cal/g
    fat: Math.round((calorieNeeds * fatPercent) / 9), // 9 cal/g
  }
}

export function getProgressPercentage(current: number, goal: number): number {
  return Math.min(Math.round((current / goal) * 100), 100)
}

export function isMacroGoalMet(current: number, goal: number, tolerance = 10): boolean {
  const percentage = getProgressPercentage(current, goal)
  return percentage >= 100 - tolerance && percentage <= 100 + tolerance
}
