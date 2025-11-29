"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Heart, 
  AlertCircle, 
  User, 
  Edit2, 
  Save, 
  Loader2, 
  Activity, 
  Utensils, 
  Check,
  CalendarDays,
  Dna
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

// --- Constants ---
const MEDICAL_CONDITIONS = [
  "Diabetes Type 1", "Diabetes Type 2", "Hypertension", "Heart Disease", 
  "Kidney Disease", "High Cholesterol", "Food Allergies", "Celiac Disease", 
  "Irritable Bowel Syndrome", "GERD", "Osteoporosis", "Anemia", 
  "Thyroid Disorders", "None of the above",
]

const DIETARY_RESTRICTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", 
  "Low-Sodium", "Low-Carb", "Keto", "Mediterranean", "DASH Diet", "None",
]

export default function HealthProfile() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Form State
  const [editFormData, setEditFormData] = useState({
    age: "",
    gender: "",
    activityLevel: "",
    medicalConditions: [] as string[],
    dietaryRestrictions: [] as string[],
    allergies: "",
  })

  // Display State
  const [medicalConditions, setMedicalConditions] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allergies, setAllergies] = useState<any[]>([])

  // --- Data Loading ---
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!user) return
        
        // 1. Fetch Profile
        const response = await fetch("/api/user-profile")
        if (response.ok) {
          const profile = await response.json()
          setEditFormData(prev => ({
            ...prev,
            age: profile.age || "",
            gender: profile.gender || "",
            activityLevel: profile.activity_level || "",
          }))
        }
        
        // 2. Fetch Conditions
        const { data: conditions } = await supabase.from("medical_conditions").select("*").eq("user_id", user.id)
        if (conditions) {
          setMedicalConditions(conditions)
          setEditFormData((prev) => ({ ...prev, medicalConditions: conditions.map((c) => c.condition_name) }))
        }

        // 3. Fetch Restrictions
        const { data: restrictions } = await supabase.from("dietary_restrictions").select("*").eq("user_id", user.id)
        if (restrictions) {
          setEditFormData((prev) => ({ ...prev, dietaryRestrictions: restrictions.map((r) => r.restriction) }))
        }

        // 4. Fetch Allergies
        const { data: allergyData } = await supabase.from("food_allergies").select("*").eq("user_id", user.id)
        if (allergyData) {
          setAllergies(allergyData)
          setEditFormData((prev) => ({ ...prev, allergies: allergyData.map((a) => a.allergen).join(", ") }))
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUserData()
  }, [user])

  // --- Save Handler ---
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      if (!user) throw new Error("User not authenticated")

      // Update Profile Base
      await fetch("/api/user-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number.parseInt(editFormData.age),
          gender: editFormData.gender,
          activity_level: editFormData.activityLevel,
        }),
      })

      // Update Tables
      await supabase.from("medical_conditions").delete().eq("user_id", user.id)
      const conditionInserts = editFormData.medicalConditions
        .filter(c => c !== "None of the above")
        .map(c => ({ user_id: user.id, condition_name: c, severity: "Moderate", diagnosed_year: new Date().getFullYear() }))
      if (conditionInserts.length) await supabase.from("medical_conditions").insert(conditionInserts)

      await supabase.from("dietary_restrictions").delete().eq("user_id", user.id)
      const restrictionInserts = editFormData.dietaryRestrictions
        .filter(r => r !== "None")
        .map(r => ({ user_id: user.id, restriction: r }))
      if (restrictionInserts.length) await supabase.from("dietary_restrictions").insert(restrictionInserts)

      await supabase.from("food_allergies").delete().eq("user_id", user.id)
      if (editFormData.allergies.trim()) {
        await supabase.from("food_allergies").insert({
          user_id: user.id,
          allergen: editFormData.allergies,
          severity: "Moderate",
          reaction_description: editFormData.allergies,
        })
      }

      toast({ title: "Profile Updated", description: "Your health profile has been saved successfully." })
      
      // Local State Update
      setMedicalConditions(conditionInserts.map(c => ({ ...c, id: Math.random() }))) 
      setAllergies([{ allergen: editFormData.allergies }])
      setIsEditing(false)

    } catch (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSelection = (list: string[], item: string, field: "medicalConditions" | "dietaryRestrictions") => {
    const exists = list.includes(item)
    const newList = exists ? list.filter(i => i !== item) : [...list, item]
    setEditFormData(prev => ({ ...prev, [field]: newList }))
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Health Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your biometrics and medical history.
          </p>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} size="default">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* --- Main Content Area --- */}
      {isEditing ? (
        // EDIT MODE LAYOUT
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Biometrics Form */}
          <Card className="lg:col-span-4 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Biometrics
              </CardTitle>
              <CardDescription>Your basic physical attributes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* Image Tag for Biometric Context */}
               <div className="hidden md:block mb-4 rounded-md overflow-hidden opacity-80 grayscale hover:grayscale-0 transition-all">
                  
               </div>

              <div className="grid gap-2">
                <Label>Age (Years)</Label>
                <Input 
                  type="number" 
                  value={editFormData.age} 
                  onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                  placeholder="e.g. 30"
                />
              </div>

              <div className="grid gap-2">
                <Label>Gender</Label>
                <Select value={editFormData.gender} onValueChange={(val) => setEditFormData({...editFormData, gender: val})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Activity Level</Label>
                <Select value={editFormData.activityLevel} onValueChange={(val) => setEditFormData({...editFormData, activityLevel: val})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (Little to no exercise)</SelectItem>
                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (Physical job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Right: Detailed Form */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Medical Conditions
                </CardTitle>
                <CardDescription>Select any active diagnosed conditions.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="flex flex-wrap gap-2">
                    {MEDICAL_CONDITIONS.map((condition) => {
                      const isSelected = editFormData.medicalConditions.includes(condition)
                      return (
                        <Badge
                          key={condition}
                          variant={isSelected ? "default" : "outline"}
                          className={cn("cursor-pointer px-3 py-1.5 text-sm transition-all hover:opacity-80", isSelected ? "border-transparent" : "hover:bg-accent")}
                          onClick={() => toggleSelection(editFormData.medicalConditions, condition, "medicalConditions")}
                        >
                          {condition}
                          {isSelected && <Check className="ml-1 h-3 w-3" />}
                        </Badge>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" /> Nutrition & Allergies
                </CardTitle>
                <CardDescription>Help us tailor your meal plans.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                   <div className="flex items-center justify-between mb-3">
                        <Label>Dietary Preferences</Label>
                        {/* Instructional Image Tag */}
                        <div className="text-xs text-muted-foreground">

[Image of balanced diet chart]
</div>
                   </div>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_RESTRICTIONS.map((restriction) => {
                      const isSelected = editFormData.dietaryRestrictions.includes(restriction)
                      return (
                        <Badge
                          key={restriction}
                          variant={isSelected ? "default" : "outline"}
                          className={cn("cursor-pointer px-3 py-1.5 text-sm transition-all hover:opacity-80", isSelected ? "border-transparent" : "hover:bg-accent")}
                          onClick={() => toggleSelection(editFormData.dietaryRestrictions, restriction, "dietaryRestrictions")}
                        >
                          {restriction}
                          {isSelected && <Check className="ml-1 h-3 w-3" />}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label>Allergies (Comma separated)</Label>
                  <Textarea 
                    placeholder="e.g. Peanuts, Shellfish..."
                    value={editFormData.allergies}
                    onChange={(e) => setEditFormData({...editFormData, allergies: e.target.value})}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      ) : (
        // VIEW MODE LAYOUT
        <div className="space-y-6">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">User Profile</CardTitle>
                <User className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editFormData.age || "--"} <span className="text-sm font-normal text-muted-foreground">years</span></div>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {editFormData.gender || "Gender not set"} • {editFormData.activityLevel || "Activity not set"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conditions</CardTitle>
                <Heart className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medicalConditions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active diagnoses found
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Restrictions</CardTitle>
                <Utensils className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{editFormData.dietaryRestrictions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dietary filters active
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Condition List */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Active Conditions</CardTitle>
                    <CardDescription>A list of your current diagnosed conditions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {medicalConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {medicalConditions.map((c, i) => (
                           <Badge key={i} variant="secondary" className="px-3 py-1 text-sm">
                             {c.condition_name}
                           </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <Dna className="h-8 w-8 mb-2 opacity-50" />
                        <p>No conditions recorded.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Allergies / Notes */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Allergies & Intolerances</CardTitle>
                    <CardDescription>Avoidance list for nutrition planning.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editFormData.allergies ? (
                      <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <div>
                            <p className="font-semibold text-destructive text-sm mb-1">Critical Allergens</p>
                            <p className="text-sm text-foreground">{editFormData.allergies}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <Check className="h-8 w-8 mb-2 opacity-50" />
                        <p>No allergies listed.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Health Timeline</CardTitle>
                  <CardDescription>Chronological record of updates and diagnoses.</CardDescription>
                </CardHeader>
                <CardContent>
                   {medicalConditions.length > 0 ? (
                    <div className="space-y-6">
                      {medicalConditions.map((condition, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                             <div className="h-full w-px bg-border my-1"></div>
                          </div>
                          <div className="pb-6">
                             <div className="flex items-center gap-2 mb-1">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">{condition.diagnosed_year || "Unknown Date"}</span>
                             </div>
                             <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm w-full md:min-w-[400px]">
                                <h4 className="font-semibold">{condition.condition_name}</h4>
                                <Badge variant="outline" className="mt-2 text-xs">{condition.severity || "Moderate Severity"}</Badge>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                   ) : (
                     <p className="text-muted-foreground text-sm">No timeline events available.</p>
                   )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}