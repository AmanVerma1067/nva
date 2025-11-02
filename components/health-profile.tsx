"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, AlertTriangle, User, Phone, Edit, X, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function HealthProfile() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [editFormData, setEditFormData] = useState({
    age: "45",
    gender: "Female",
    activityLevel: "Moderate",
    medicalConditions: ["Type 2 Diabetes", "Hypertension"],
    dietaryRestrictions: ["Low-Sodium"],
    allergies: "Shellfish (severe - anaphylaxis), Tree nuts (moderate - hives, swelling)",
  })

  const medicalConditions = [
    {
      name: "Type 2 Diabetes",
      severity: "Moderate",
      diagnosed: "2020",
      description: "Managed with diet and medication",
      recommendations: [
        "Monitor carbohydrate intake",
        "Regular blood sugar testing",
        "Maintain consistent meal timing",
      ],
    },
    {
      name: "Hypertension",
      severity: "Mild",
      diagnosed: "2022",
      description: "Well controlled with lifestyle changes",
      recommendations: ["Limit sodium intake", "Regular exercise", "Stress management"],
    },
  ]

  const medications = [
    { name: "Metformin", dosage: "500mg", frequency: "Twice daily", timing: "With meals" },
    { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", timing: "Morning" },
  ]

  const allergies = [
    { allergen: "Shellfish", severity: "Severe", reaction: "Anaphylaxis" },
    { allergen: "Tree Nuts", severity: "Moderate", reaction: "Hives, swelling" },
  ]

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        throw new Error("Failed to save profile")
      }

      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your medical information and health goals</p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="border-medical-blue text-medical-blue hover:bg-medical-blue hover:text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline" disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-medical-blue hover:bg-medical-blue/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Emergency Alert */}
      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Emergency Information:</strong> In case of emergency, contact Sarah Johnson at (555) 123-4567
        </AlertDescription>
      </Alert>

      {isEditing ? (
        <Card className="border-2 border-medical-blue/20">
          <CardHeader>
            <CardTitle>Edit Profile Information</CardTitle>
            <CardDescription>Update your health and dietary information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editFormData.age}
                  onChange={(e) => handleEditChange("age", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Input
                  id="edit-gender"
                  value={editFormData.gender}
                  onChange={(e) => handleEditChange("gender", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-activity">Activity Level</Label>
              <Input
                id="edit-activity"
                value={editFormData.activityLevel}
                onChange={(e) => handleEditChange("activityLevel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-allergies">Food Allergies & Intolerances</Label>
              <Textarea
                id="edit-allergies"
                value={editFormData.allergies}
                onChange={(e) => handleEditChange("allergies", e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Basic Info</CardTitle>
                  <User className="h-4 w-4 text-medical-blue" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{editFormData.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium">{editFormData.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activity:</span>
                      <span className="font-medium">{editFormData.activityLevel}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Score</span>
                      <Badge className="bg-green-100 text-green-800">Good</Badge>
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-gray-500">75% - Well managed conditions</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emergency Contact</CardTitle>
                  <Phone className="h-4 w-4 text-medical-blue" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-gray-600">Spouse</p>
                    <p className="text-gray-600">(555) 123-4567</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Conditions</CardTitle>
                  <CardDescription>Current medical conditions requiring monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {medicalConditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{condition.name}</p>
                        <p className="text-xs text-gray-600">Since {condition.diagnosed}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          condition.severity === "Severe"
                            ? "bg-red-100 text-red-800"
                            : condition.severity === "Moderate"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {condition.severity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Food Allergies</CardTitle>
                  <CardDescription>Critical dietary restrictions for safety</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allergies.map((allergy, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50 dark:bg-red-900/20">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">{allergy.allergen}</p>
                            <p className="text-xs text-red-600 dark:text-red-300">{allergy.reaction}</p>
                          </div>
                          <Badge className="bg-red-100 text-red-800">{allergy.severity}</Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Conditions</CardTitle>
                <CardDescription>
                  Detailed information about your health conditions and management strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {medicalConditions.map((condition, index) => (
                    <AccordionItem key={index} value={`condition-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full mr-4">
                          <span className="font-medium">{condition.name}</span>
                          <Badge
                            variant="secondary"
                            className={
                              condition.severity === "Severe"
                                ? "bg-red-100 text-red-800"
                                : condition.severity === "Moderate"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {condition.severity}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Condition Details</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{condition.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Diagnosed: {condition.diagnosed}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Dietary Recommendations</h4>
                            <ul className="space-y-1">
                              {condition.recommendations.map((rec, recIndex) => (
                                <li
                                  key={recIndex}
                                  className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                                >
                                  <span className="text-medical-blue mr-2">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Current Medications</span>
                </CardTitle>
                <CardDescription>Track your medications for food interaction checking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{med.name}</h3>
                        <p className="text-sm text-gray-600">
                          {med.dosage} - {med.frequency}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-medical-blue text-medical-blue">
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Timing:</span>
                        <p className="font-medium">{med.timing}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Next Dose:</span>
                        <p className="font-medium">In 4 hours</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
