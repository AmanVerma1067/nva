'use client'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, User, Heart, Pill, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'


const MEDICAL_CONDITIONS = [
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Hypertension',
  'Heart Disease',
  'Kidney Disease',
  'High Cholesterol',
  'Food Allergies',
  'Celiac Disease',
  'Irritable Bowel Syndrome',
  'Gastroesophageal Reflux Disease',
  'Osteoporosis',
  'Anemia',
  'Thyroid Disorders',
  'None of the above'
]

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Low-Sodium',
  'Low-Carb',
  'Keto',
  'Mediterranean',
  'DASH Diet',
  'None'
]

export function HealthOnboarding() {
  const router = useRouter()
  const { toast } = useToast() // ✅ moved here — inside component
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    activityLevel: '',
    medicalConditions: [] as string[],
    dietaryRestrictions: [] as string[],
    allergies: '',
    medications: '',
    healthGoals: [] as string[],
    emergencyContact: '',
    emergencyPhone: ''
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

const handleNext = async () => {
  if (currentStep < totalSteps) {
    setCurrentStep(currentStep + 1)
  } else {
    // Complete onboarding - save to Supabase
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Error",
          description: "No user found. Please log in again.",
          variant: "destructive"
        })
        router.push('/auth')
        return
      }

      // Update profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          age: parseInt(formData.age) || null,
          gender: formData.gender || null,
          activity_level: formData.activityLevel || null,
          primary_goal: formData.healthGoals[0] || 'General Wellness',
          medical_conditions: formData.medicalConditions || [],
          dietary_restrictions: formData.dietaryRestrictions || [],
          food_allergies: formData.allergies || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Profile Complete!",
        description: "Your health profile has been saved.",
      })

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Onboarding error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
}

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, condition]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        medicalConditions: prev.medicalConditions.filter(c => c !== condition)
      }))
    }
  }

  const handleRestrictionChange = (restriction: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, restriction]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.filter(r => r !== restriction)
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
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Help us personalize your nutrition experience
              </p>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select value={formData.activityLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, activityLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                    <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (very hard exercise, physical job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="h-12 w-12 text-medical-blue mx-auto" />
              <h2 className="text-2xl font-bold">Medical Conditions</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Select any conditions that apply to you (optional but recommended)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This information helps us provide personalized nutrition recommendations and safety alerts.
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Pill className="h-12 w-12 text-medical-blue mx-auto" />
              <h2 className="text-2xl font-bold">Dietary Restrictions & Allergies</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Help us keep you safe and aligned with your dietary preferences
              </p>
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
                <Label htmlFor="allergies">Food Allergies (Please specify)</Label>
                <Textarea
                  id="allergies"
                  placeholder="List any food allergies or intolerances..."
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications (Optional)</Label>
                <Textarea
                  id="medications"
                  placeholder="List current medications for interaction checking..."
                  value={formData.medications}
                  onChange={(e) => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 text-medical-blue mx-auto" />
              <h2 className="text-2xl font-bold">Health Goals</h2>
              <p className="text-gray-600 dark:text-gray-300">
                What would you like to achieve with better nutrition?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Weight Management',
                'Blood Sugar Control',
                'Heart Health',
                'Digestive Health',
                'Energy Levels',
                'Athletic Performance',
                'General Wellness',
                'Disease Prevention'
              ].map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={formData.healthGoals.includes(goal)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          healthGoals: [...prev.healthGoals, goal]
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          healthGoals: prev.healthGoals.filter(g => g !== goal)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={goal} className="text-sm">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="h-12 w-12 text-medical-blue mx-auto" />
              <h2 className="text-2xl font-bold">Emergency Contact</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Optional: For emergency situations related to dietary restrictions
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergency-contact">Emergency Contact Name</Label>
                <Input
                  id="emergency-contact"
                  placeholder="Contact person name"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency-phone"
                  type="tel"
                  placeholder="Phone number"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                />
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                You're all set! Your personalized nutrition dashboard is ready.
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
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            {currentStep < totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500"
          >
            Skip for now (you can complete this later)
          </Button>
        </div>
      </div>
    </div>
  )
}
