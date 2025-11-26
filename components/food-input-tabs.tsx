"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Type, Camera, Mic, Upload, Send, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function FoodInputTabs() {
  const { toast } = useToast()
  const [textInput, setTextInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe your meal first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/food-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textInput,
          type: "text",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze food")
      }

      const result = await response.json()

      toast({
        title: "✅ Food Logged Successfully",
        description: `Added ${result.analysis.items.length} item(s) to your daily log. Total: ${Math.round(result.analysis.totals.calories)} calories.`,
      })

      setTextInput("")
      
      // Trigger refresh of dashboard data
      window.dispatchEvent(new Event("foodLogUpdated"))
    } catch (error) {
      console.error("Food logging error:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageSubmit = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const response = await fetch("/api/food-logs", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze image")
      }

      const result = await response.json()

      toast({
        title: "✅ Image Analyzed Successfully",
        description: `Detected ${result.analysis.items.length} food item(s). Total: ${Math.round(result.analysis.totals.calories)} calories.`,
      })

      // Reset image selection
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Trigger refresh
      window.dispatchEvent(new Event("foodLogUpdated"))
    } catch (error) {
      console.error("Image analysis error:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text" className="flex items-center space-x-2">
          <Type className="h-4 w-4" />
          <span>Text</span>
        </TabsTrigger>
        <TabsTrigger value="image" className="flex items-center space-x-2">
          <Camera className="h-4 w-4" />
          <span>Image</span>
        </TabsTrigger>
        <TabsTrigger value="voice" className="flex items-center space-x-2" disabled>
          <Mic className="h-4 w-4" />
          <span>Voice</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="food-text">Describe your meal</Label>
          <Textarea
            id="food-text"
            placeholder="e.g., 2 medium apples, 150g grilled chicken breast, and 1 cup of brown rice"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[100px]"
            disabled={isProcessing}
          />
        </div>
        <Button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Analyze & Log Food
            </>
          )}
        </Button>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>✨ AI-Powered:</strong> Our system uses USDA FoodData Central for accurate nutrition information.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="image" className="space-y-4">
        <div className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected food"
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedImage(null)
                  setImagePreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                Change Image
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload an image of your meal
              </p>
              <Label htmlFor="image-upload">
                <Button asChild disabled={isProcessing} variant="outline">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </Label>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
          )}

          {selectedImage && (
            <Button
              onClick={handleImageSubmit}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Analyze & Log Image
                </>
              )}
            </Button>
          )}
        </div>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>🔍 LogMeal AI:</strong> Advanced computer vision detects multiple foods and portion sizes.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="voice" className="space-y-4">
        <Card className="bg-gray-50 dark:bg-gray-900/20">
          <CardContent className="p-8 text-center">
            <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
              Voice Input Coming Soon
            </p>
            <p className="text-sm text-gray-500">
              This feature is currently under development.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}