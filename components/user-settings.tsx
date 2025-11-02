"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Bell, Download, Share2, Eye, Lock, Smartphone } from "lucide-react"

export function UserSettings() {
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    medicationAlerts: true,
    healthInsights: true,
  })

  const [privacy, setPrivacy] = useState({
    shareWithProviders: false,
    anonymousAnalytics: true,
    dataRetention: "2-years",
    encryptionLevel: "maximum",
  })

  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    screenReader: false,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your preferences and privacy</p>
      </div>

      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="border-2 border-medical-blue/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-medical-blue" />
                <span>Privacy & Security</span>
              </CardTitle>
              <CardDescription>Control how your health data is used and shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Your data is encrypted with medical-grade security
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Healthcare Provider Sharing</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow providers to access your nutrition data
                    </p>
                  </div>
                  <Switch
                    checked={privacy.shareWithProviders}
                    onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, shareWithProviders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Anonymous Analytics</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help improve the app with anonymized usage data
                    </p>
                  </div>
                  <Switch
                    checked={privacy.anonymousAnalytics}
                    onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, anonymousAnalytics: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Data Retention Period</Label>
                  <Select
                    value={privacy.dataRetention}
                    onValueChange={(value) => setPrivacy((prev) => ({ ...prev, dataRetention: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-year">1 Year</SelectItem>
                      <SelectItem value="2-years">2 Years</SelectItem>
                      <SelectItem value="5-years">5 Years</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Encryption Level</Label>
                  <Select
                    value={privacy.encryptionLevel}
                    onValueChange={(value) => setPrivacy((prev) => ({ ...prev, encryptionLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (AES-256)</SelectItem>
                      <SelectItem value="maximum">Maximum (AES-256 + Zero-Knowledge)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-600">Currently using maximum encryption</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or share your health data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Health Data
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Share with Provider
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-medical-blue" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Meal Reminders</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reminders to log your meals</p>
                  </div>
                  <Switch
                    checked={notifications.mealReminders}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, mealReminders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Health Alerts</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Critical health warnings and interactions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-100 text-red-800">Critical</Badge>
                    <Switch
                      checked={notifications.medicationAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, medicationAlerts: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Health Insights</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered nutrition recommendations</p>
                  </div>
                  <Switch
                    checked={notifications.healthInsights}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, healthInsights: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-medical-blue" />
                <span>Accessibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">High Contrast Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    checked={accessibility.highContrast}
                    onCheckedChange={(checked) => setAccessibility((prev) => ({ ...prev, highContrast: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Large Text</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Increase text size throughout the app</p>
                  </div>
                  <Switch
                    checked={accessibility.largeText}
                    onCheckedChange={(checked) => setAccessibility((prev) => ({ ...prev, largeText: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Screen Reader Optimization</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enhanced screen reader compatibility</p>
                  </div>
                  <Switch
                    checked={accessibility.screenReader}
                    onCheckedChange={(checked) => setAccessibility((prev) => ({ ...prev, screenReader: checked }))}
                  />
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Supports iOS VoiceOver and Android TalkBack
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
