"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  X, 
  Save, 
  Loader2, 
  Activity, 
  Utensils, 
  Check,
  Thermometer,
  Wheat
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

export function HealthProfile() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [editFormData, setEditFormData] = useState({
    age: "",
    gender: "",
    activityLevel: "",
    medicalConditions: [] as string[],
    dietaryRestrictions: [] as string[],
    allergies: "",
  })

  const [medicalConditions, setMedicalConditions] = useState<any[]>([])
  const [allergies, setAllergies] = useState<any[]>([])

  // --- Data Loading Logic ---
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!user) return
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
        
        const { data: conditions } = await supabase.from("medical_conditions").select("*").eq("user_id", user.id)
        if (conditions) {
          setMedicalConditions(conditions)
          setEditFormData((prev) => ({ ...prev, medicalConditions: conditions.map((c) => c.condition_name) }))
        }

        const { data: restrictions } = await supabase.from("dietary_restrictions").select("*").eq("user_id", user.id)
        if (restrictions) {
          setEditFormData((prev) => ({ ...prev, dietaryRestrictions: restrictions.map((r) => r.restriction) }))
        }

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

  // --- Handlers ---
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      if (!user) throw new Error("User not authenticated")

      await fetch("/api/user-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number.parseInt(editFormData.age),
          gender: editFormData.gender,
          activity_level: editFormData.activityLevel,
        }),
      })

      // Update Conditions
      await supabase.from("medical_conditions").delete().eq("user_id", user.id)
      const conditionInserts = editFormData.medicalConditions
        .filter(c => c !== "None of the above")
        .map(c => ({ user_id: user.id, condition_name: c, severity: "Moderate", diagnosed_year: new Date().getFullYear() }))
      if (conditionInserts.length) await supabase.from("medical_conditions").insert(conditionInserts)

      // Update Restrictions
      await supabase.from("dietary_restrictions").delete().eq("user_id", user.id)
      const restrictionInserts = editFormData.dietaryRestrictions
        .filter(r => r !== "None")
        .map(r => ({ user_id: user.id, restriction: r }))
      if (restrictionInserts.length) await supabase.from("dietary_restrictions").insert(restrictionInserts)

      // Update Allergies
      await supabase.from("food_allergies").delete().eq("user_id", user.id)
      if (editFormData.allergies.trim()) {
        await supabase.from("food_allergies").insert({
          user_id: user.id,
          allergen: editFormData.allergies,
          severity: "Moderate",
          reaction_description: editFormData.allergies,
        })
      }

      toast({ title: "Profile Updated", description: "Your health profile has been saved successfully.", variant: "default" })
      
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
      <div className="w-full h-[60vh] flex items-center justify-center bg-[#fafaf9]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          <p className="text-stone-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#fafaf9] p-4 md:p-8 font-sans text-stone-800">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Health Profile</h1>
            <p className="text-stone-500 mt-2 text-lg font-light max-w-2xl">
              Manage your biometrics, conditions, and nutritional needs in one calm, secure space.
            </p>
          </div>
          
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)} 
              size="lg"
              className="bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-full px-8 shadow-lg shadow-stone-200 transition-all hover:scale-105"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="ghost" 
                className="text-stone-600 hover:bg-stone-200 hover:text-stone-900 rounded-full"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                className="bg-stone-900 hover:bg-black text-white rounded-full px-6 shadow-xl"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          // --- EDIT MODE ---
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Basic Info */}
            <Card className="lg:col-span-4 border-none shadow-xl shadow-stone-200/50 bg-white rounded-3xl h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-stone-800 text-xl font-medium">
                  <User className="h-5 w-5 text-stone-400" /> 
                  Biometrics
                </CardTitle>
                <CardDescription className="text-stone-400">Basic physical attributes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-stone-600 font-medium">Age</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={editFormData.age} 
                      onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                      className="bg-stone-50 border-stone-200 focus:border-stone-400 focus:ring-stone-200 rounded-xl h-12 text-lg pl-4"
                    />
                    <span className="absolute right-4 top-3 text-stone-400 text-sm">years</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-stone-600 font-medium">Gender</Label>
                  <Select value={editFormData.gender} onValueChange={(val) => setEditFormData({...editFormData, gender: val})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 rounded-xl h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-100">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-stone-600 font-medium">Activity Level</Label>
                  <Select value={editFormData.activityLevel} onValueChange={(val) => setEditFormData({...editFormData, activityLevel: val})}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 rounded-xl h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-white border-stone-100">
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

            {/* Right Column: Details */}
            <Card className="lg:col-span-8 border-none shadow-xl shadow-stone-200/50 bg-white rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-stone-800">Medical & Dietary Details</CardTitle>
                <CardDescription className="text-stone-400">This helps us tailor recommendations specifically for you.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-10">
                
                {/* Conditions Selection */}
                <div>
                  <Label className="text-base font-medium flex items-center gap-2 mb-4 text-stone-700">
                    <Heart className="h-4 w-4 text-rose-400" /> Existing Conditions
                  </Label>
                  <ScrollArea className="h-[180px] w-full rounded-2xl border border-stone-100 p-4 bg-stone-50/50">
                    <div className="flex flex-wrap gap-2">
                      {MEDICAL_CONDITIONS.map((condition) => {
                        const isSelected = editFormData.medicalConditions.includes(condition)
                        return (
                          <div
                            key={condition}
                            onClick={() => toggleSelection(editFormData.medicalConditions, condition, "medicalConditions")}
                            className={cn(
                              "cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 select-none flex items-center gap-2 border",
                              isSelected 
                                ? "bg-stone-800 text-white border-stone-800 shadow-lg" 
                                : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-800"
                            )}
                          >
                            {condition}
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="bg-stone-100" />

                {/* Diet Selection */}
                <div>
                  <Label className="text-base font-medium flex items-center gap-2 mb-4 text-stone-700">
                    <Wheat className="h-4 w-4 text-amber-500" /> Dietary Preferences
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_RESTRICTIONS.map((restriction) => {
                      const isSelected = editFormData.dietaryRestrictions.includes(restriction)
                      return (
                        <div
                          key={restriction}
                          onClick={() => toggleSelection(editFormData.dietaryRestrictions, restriction, "dietaryRestrictions")}
                          className={cn(
                            "cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 select-none flex items-center gap-2 border",
                            isSelected 
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-100" 
                              : "bg-white text-stone-500 border-stone-200 hover:border-emerald-300 hover:text-emerald-700"
                          )}
                        >
                          {restriction}
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Allergies Textarea */}
                <div className="space-y-3">
                   <Label className="text-base font-medium flex items-center gap-2 text-stone-700">
                    <AlertCircle className="h-4 w-4 text-orange-400" /> Allergies & Intolerances
                  </Label>
                  <Textarea
                    placeholder="E.g., Peanuts, Shellfish, Penicillin..."
                    value={editFormData.allergies}
                    onChange={(e) => setEditFormData({...editFormData, allergies: e.target.value})}
                    className="min-h-[120px] bg-stone-50 border-stone-200 focus:border-stone-400 focus:ring-0 rounded-xl resize-none p-4 text-stone-700"
                  />
                </div>

              </CardContent>
            </Card>
          </div>
        ) : (
          // --- VIEW MODE ---
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="w-full flex justify-center md:justify-start">
              <TabsList className="bg-white border border-stone-200 rounded-full p-1 shadow-sm h-auto inline-flex">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-full px-6 py-2.5 text-stone-500 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900 transition-all font-medium"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="conditions" 
                  className="rounded-full px-6 py-2.5 text-stone-500 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900 transition-all font-medium"
                >
                  History & Timeline
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  icon={<User className="h-5 w-5 text-stone-600" />}
                  title="Age & Gender"
                  value={editFormData.age ? `${editFormData.age}` : '--'}
                  unit=" years"
                  subtext={editFormData.gender ? editFormData.gender : "Not set"}
                />
                <StatCard 
                  icon={<Thermometer className="h-5 w-5 text-rose-500" />}
                  title="Active Conditions"
                  value={medicalConditions.length.toString()}
                  subtext="Diagnosed issues"
                  accentColor="bg-rose-50"
                />
                <StatCard 
                  icon={<Utensils className="h-5 w-5 text-emerald-600" />}
                  title="Dietary Filters"
                  value={editFormData.dietaryRestrictions.length.toString()}
                  subtext="Active restrictions"
                  accentColor="bg-emerald-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conditions Summary */}
                <Card className="border-none shadow-md shadow-stone-200/50 bg-white rounded-3xl overflow-hidden h-full">
                  <CardHeader className="bg-[#fcfaf8] border-b border-stone-100 pb-4">
                    <CardTitle className="text-lg text-stone-800 flex items-center gap-2 font-medium">
                      <Activity className="h-5 w-5 text-stone-400" /> Current Health Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {medicalConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {medicalConditions.map((c, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="px-4 py-1.5 text-sm font-normal bg-stone-100 text-stone-700 border border-stone-200"
                          >
                            {c.condition_name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No active conditions recorded" />
                    )}
                  </CardContent>
                </Card>

                {/* Allergies Summary */}
                <Card className="border-none shadow-md shadow-stone-200/50 bg-white rounded-3xl overflow-hidden h-full">
                  <CardHeader className="bg-[#fcfaf8] border-b border-stone-100 pb-4">
                    <CardTitle className="text-lg text-stone-800 flex items-center gap-2 font-medium">
                      <AlertCircle className="h-5 w-5 text-stone-400" /> Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {editFormData.allergies ? (
                       <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                         <p className="text-stone-700 leading-relaxed font-medium">
                           {editFormData.allergies}
                         </p>
                       </div>
                    ) : (
                      <EmptyState text="No known allergies" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="animate-in slide-in-from-bottom-2 fade-in duration-500">
               <Card className="border-none shadow-lg shadow-stone-200/40 bg-white rounded-3xl">
                <CardHeader>
                   <CardTitle className="text-xl font-medium text-stone-800">Medical History</CardTitle>
                   <CardDescription className="text-stone-400">Chronological view of your health records.</CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalConditions.length > 0 ? (
                    <div className="space-y-4">
                      {medicalConditions.map((condition, index) => (
                        <div key={index} className="flex items-center p-5 bg-stone-50 border border-stone-100 rounded-2xl transition-all hover:bg-white hover:shadow-md group">
                           <div className="h-12 w-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mr-5 shadow-sm">
                              <Activity className="h-5 w-5 text-stone-400 group-hover:text-stone-800 transition-colors" />
                           </div>
                           <div className="flex-1">
                              <h4 className="font-semibold text-lg text-stone-800">{condition.condition_name}</h4>
                              <p className="text-sm text-stone-500">Diagnosed {condition.diagnosed_year || "Unknown"}</p>
                           </div>
                           <div className="bg-white px-4 py-1.5 rounded-full border border-stone-200 text-xs font-semibold text-stone-600 tracking-wide uppercase">
                              {condition.severity || "Moderate"}
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                      <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        <Heart className="h-6 w-6 text-stone-300" />
                      </div>
                      <h3 className="text-lg font-medium text-stone-800">No History Recorded</h3>
                      <p className="text-stone-400 max-w-sm mx-auto mt-2">Update your profile to add medical conditions.</p>
                    </div>
                  )}
                </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

// --- Sub-components for cleaner code ---

function StatCard({ icon, title, value, unit = "", subtext, accentColor = "bg-stone-50" }: any) {
  return (
    <Card className="border-none shadow-md shadow-stone-200/50 hover:shadow-lg transition-all duration-300 bg-white rounded-3xl overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-stone-400 uppercase tracking-wide">{title}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-bold text-stone-800">{value}</h3>
              <span className="text-lg text-stone-400 font-medium">{unit}</span>
            </div>
            <p className="text-sm text-stone-500 pt-1 font-medium bg-stone-50 w-fit px-2 py-0.5 rounded-md">{subtext}</p>
          </div>
          <div className={`p-4 rounded-2xl ${accentColor} transition-colors group-hover:scale-110 duration-300`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-3 border border-stone-100 shadow-sm">
         <Activity className="h-4 w-4 text-stone-300" />
      </div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  )
}