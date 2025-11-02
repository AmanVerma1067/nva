"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Type, Camera, Mic, Upload, Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function FoodInputTabs() {
  const { toast } = useToast()
  const [textInput, setTextInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingInterval = useRef<NodeJS.Timeout>()

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Food Logged Successfully",
      description: `Added "${textInput}" to your daily log.`,
    })

    setTextInput("")
    setIsProcessing(false)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    toast({
      title: "Image Analyzed",
      description: "Food items detected and added to your log.",
    })

    setIsProcessing(false)
  }

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      if (recordingInterval.current) clearInterval(recordingInterval.current)
      setRecordingTime(0)

      setIsProcessing(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Voice Recorded",
        description: "Your meal description has been captured and processed.",
      })

      setIsProcessing(false)
    } else {
      // Start recording
      setIsRecording(true)
      setRecordingTime(0)
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            setIsRecording(false)
            if (recordingInterval.current) clearInterval(recordingInterval.current)
            toggleRecording()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text" className="flex items-center space-x-2">
          <Type className="h-4 w-4" />
          <span>Text</span>
        </TabsTrigger>
        <TabsTrigger value="voice" className="flex items-center space-x-2">
          <Mic className="h-4 w-4" />
          <span>Voice</span>
        </TabsTrigger>
        <TabsTrigger value="image" className="flex items-center space-x-2">
          <Camera className="h-4 w-4" />
          <span>Image</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="food-text">Describe your meal</Label>
          <Textarea
            id="food-text"
            placeholder="e.g., Grilled chicken with rice and vegetables"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[100px]"
            disabled={isProcessing}
          />
        </div>
        <Button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || isProcessing}
          className="w-full bg-medical-blue hover:bg-medical-blue/90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Log Food
            </>
          )}
        </Button>
      </TabsContent>

      <TabsContent value="voice" className="space-y-4">
        <div className="space-y-4">
          <div className="bg-gradient-to-b from-medical-blue/10 to-medical-blue/5 rounded-lg p-8 text-center border border-medical-blue/20">
            <div className="flex justify-center mb-4">
              <Mic className={`h-16 w-16 ${isRecording ? "text-red-500 animate-pulse" : "text-medical-blue"}`} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">
              {isRecording ? "Listening..." : "Tap to start recording"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{isRecording && `${formatTime(recordingTime)}s`}</p>
          </div>

          <Button
            onClick={toggleRecording}
            disabled={isProcessing}
            size="lg"
            className={`w-full ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-medical-blue hover:bg-medical-blue/90"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isRecording ? (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>

          {isRecording && (
            <div className="flex justify-center items-center space-x-1 h-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animation: `pulse 0.6s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Speak naturally - "Had a turkey sandwich with lettuce for lunch"
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="image" className="space-y-4">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Take a photo or upload an image of your meal</p>
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button asChild disabled={isProcessing}>
                <span>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </>
                  )}
                </span>
              </Button>
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </div>
        </div>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>AI Analysis:</strong> Our system analyzes food items and portion sizes from photos.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
