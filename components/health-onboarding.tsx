"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, User, Heart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

const MEDICAL_CONDITIONS = [
  "Diabetes Type 1",
  "Diabetes Type 2",
  "Hypertension",
  "Heart Disease",
  "Kidney Disease",
  "High Cholesterol",
  "Food Allergies",
  "Celiac Disease",
  "Irritable Bowel Syndrome",
  "Gastroesophageal Reflux Disease",
  "Osteoporosis",
  "Anemia",
  "Thyroid Disorders",
  "None of the above",
]

const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Low-Sodium",
  "Low-Carb",
  "Keto",
  "Mediterranean",
  "DASH Diet",
  "None",
]

export function HealthOnboarding() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    activityLevel: "",
    medicalConditions: [] as string[],
    dietaryRestrictions: [] as string[],
    allergies: "",
  })

  const totalSteps = 2
  const progress = (currentStep / totalSteps) * 100

const submitOnboardingData = async () => {
  try {
    setIsSubmitting(true)

    // Save basic profile info
    const response = await fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        activity_level: formData.activityLevel,
        // userId removed - API gets it from the authenticated session
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to save profile")
    }

    // Get authenticated user for related tables
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (supabaseUser) {
      // Insert medical conditions
      for (const condition of formData.medicalConditions) {
        if (condition !== "None of the above") {
          await supabase.from("medical_conditions").insert({
            user_id: supabaseUser.id,
            condition_name: condition,
            severity: "Moderate",
            diagnosed_year: new Date().getFullYear(),
          })
        }
      }

      // Insert dietary restrictions
      for (const restriction of formData.dietaryRestrictions) {
        if (restriction !== "None") {
          await supabase.from("dietary_restrictions").insert({
            user_id: supabaseUser.id,
            restriction: restriction,
          })
        }
      }

      // Insert allergies
      if (formData.allergies) {
        await supabase.from("food_allergies").insert({
          user_id: supabaseUser.id,
          allergen: formData.allergies,
          severity: "Moderate",
          reaction_description: formData.allergies,
        })
      }
    }

    toast({
      title: "Profile Created",
      description: "Your health profile has been saved successfully",
    })

    router.push("/dashboard")
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to save profile",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}
  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      await submitOnboardingData()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, condition],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        medicalConditions: prev.medicalConditions.filter((c) => c !== condition),
      }))
    }
  }

  const handleRestrictionChange = (restriction: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, restriction],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.filter((r) => r !== restriction),
      }))
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <User className="h-12 w-12 text-medical-blue mx-auto" />
              <h2 className="text-2xl font-bold">Health Information</h2>
              <p className="text-gray-600 dark:text-gray-300">Help us personalize your nutrition experience</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, activityLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very-active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-medical-blue" />
                  Medical Conditions
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {MEDICAL_CONDITIONS.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={formData.medicalConditions.includes(condition)}
                        onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                      />
                      <Label htmlFor={condition} className="text-sm">
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="h-12 w-12 text-medical-blue mx-auto" />
              <h2 className="text-2xl font-bold">Dietary Preferences</h2>
              <p className="text-gray-600 dark:text-gray-300">Tell us about allergies and restrictions</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Dietary Restrictions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <div key={restriction} className="flex items-center space-x-2">
                      <Checkbox
                        id={restriction}
                        checked={formData.dietaryRestrictions.includes(restriction)}
                        onCheckedChange={(checked) => handleRestrictionChange(restriction, checked as boolean)}
                      />
                      <Label htmlFor={restriction} className="text-sm">
                        {restriction}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Food Allergies & Intolerances</Label>
                <Textarea
                  id="allergies"
                  placeholder="List any food allergies, intolerances, or other dietary sensitivities..."
                  value={formData.allergies}
                  onChange={(e) => setFormData((prev) => ({ ...prev, allergies: e.target.value }))}
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                Your profile is set up! You can update this information anytime in your health profile.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Health Profile Setup</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card className="border-2 border-medical-blue/20">
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting} className="bg-medical-blue hover:bg-medical-blue/90">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep === totalSteps ? (
              "Complete Setup"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-sm text-gray-500">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
