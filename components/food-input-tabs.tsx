"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Type, Camera, Mic, Upload, Send, Loader2, Sparkles, X, ImagePlus, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 } 
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

export function FoodInputTabs() {
  const { toast } = useToast()
  
  // --- EXISTING STATE LOGIC (UNCHANGED) ---
  const [textInput, setTextInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Voice state
  const [isRecording, setIsRecording] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false)

  // --- EXISTING EFFECTS & HANDLERS (UNCHANGED) ---
  useEffect(() => {
    const win: any = window
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition || null

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i]
        if (res.isFinal) {
          final += res[0].transcript
        } else {
          interim += res[0].transcript
        }
      }
      if (interim) setInterimTranscript(interim)
      if (final) {
        setFinalTranscript((prev) => (prev ? prev + " " + final : final))
        setInterimTranscript("")
      }
    }

    recognition.onerror = (err: any) => {
      console.error("Speech recognition error", err)
      toast({
        title: "Voice recognition error",
        description: err?.error || "Something went wrong with speech recognition.",
        variant: "destructive",
      })
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    return () => {
      try {
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
        recognition.stop && recognition.stop()
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startVoice = async () => {
    if (!recognitionRef.current) {
      setSpeechSupported(false)
      toast({
        title: "Not supported",
        description: "Your browser doesn't support the Web Speech API.",
        variant: "destructive",
      })
      return
    }
    setFinalTranscript("")
    setInterimTranscript("")
    setIsRecording(true)
    try {
      recognitionRef.current.start()
      toast({
        title: "Listening...",
        description: "Speak clearly to log your meal.",
      })
    } catch (err) {
      console.error("start error", err)
      setIsRecording(false)
    }
  }

  const stopVoice = async () => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch (e) {
      // ignore
    }
    setIsRecording(false)
  }

  const submitVoice = async () => {
    const transcript = (finalTranscript + " " + interimTranscript).trim()
    if (!transcript) {
      toast({
        title: "No speech detected",
        description: "Please record your meal by speaking clearly.",
        variant: "destructive",
      })
      return
    }

    setIsVoiceProcessing(true)
    try {
      const response = await fetch("/api/food-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, type: "voice" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze voice input")
      }

      const result = await response.json()
      toast({
        title: "✅ Voice Logged",
        description: `Detected ${result.analysis.items.length} item(s). Total: ${Math.round(result.analysis.totals.calories)} calories.`,
      })

      setFinalTranscript("")
      setInterimTranscript("")
      window.dispatchEvent(new Event("foodLogUpdated"))
    } catch (error) {
      console.error("Voice logging error:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoiceProcessing(false)
    }
  }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput, type: "text" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze food")
      }

      const result = await response.json()
      toast({
        title: "✅ Food Logged",
        description: `Added ${result.analysis.items.length} item(s). Total: ${Math.round(result.analysis.totals.calories)} calories.`,
      })

      setTextInput("")
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

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image smaller than 10MB.", variant: "destructive" })
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageSubmit = async () => {
    if (!selectedImage) {
      toast({ title: "No Image Selected", description: "Please select an image first.", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const response = await fetch("/api/food-logs", { method: "POST", body: formData })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze image")
      }

      const result = await response.json()
      toast({
        title: "✅ Image Analyzed",
        description: `Detected ${result.analysis.items.length} food item(s). Total: ${Math.round(result.analysis.totals.calories)} calories.`,
      })

      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
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

  // --- MODERN UI RENDER ---

  return (
    <div className="w-full max-w-3xl mx-auto p-1">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/50 dark:bg-black/20 backdrop-blur-xl shadow-2xl"
      >
        <Tabs defaultValue="text" className="w-full">
          {/* Header & Navigation */}
          <div className="p-2 bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 gap-2">
              {[
                { value: "text", icon: Type, label: "Type" },
                { value: "image", icon: Camera, label: "Snap" },
                { value: "voice", icon: Mic, label: "Speak" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative z-10 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-xl py-3 transition-all duration-300 ease-out"
                >
                  <div className="flex items-center justify-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-6 md:p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* TEXT INPUT TAB */}
              <TabsContent value="text" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label htmlFor="food-text" className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      What did you eat?
                    </Label>
                    <div className="relative group">
                      <Textarea
                        id="food-text"
                        placeholder="I had a grilled chicken salad with avocado and a hint of lime..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="min-h-[160px] resize-none text-base p-4 rounded-2xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md"
                        disabled={isProcessing}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim() || isProcessing}
                      className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Crunching the numbers...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Log Meal</span>
                          <Send className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* IMAGE INPUT TAB */}
              <TabsContent value="image" className="mt-0 focus-visible:ring-0">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants} className="w-full">
                    <AnimatePresence mode="wait">
                      {!imagePreview ? (
                        <motion.div
                          key="upload-zone"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative"
                        >
                          <input
                            ref={fileInputRef}
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={isProcessing}
                          />
                          <Label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl cursor-pointer bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <ImagePlus className="w-10 h-10" />
                              </div>
                              <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                                Click to upload photo
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                SVG, PNG, JPG (MAX. 10MB)
                              </p>
                            </div>
                          </Label>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="preview-zone"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 group"
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-72 object-cover"
                          />
                          {isProcessing && (
                            <motion.div 
                              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                <Loader2 className="h-12 w-12 text-white animate-spin relative z-10" />
                              </div>
                              <p className="text-white font-medium mt-4 tracking-wide animate-pulse">Scanning Food...</p>
                            </motion.div>
                          )}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-4 right-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedImage(null);
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {selectedImage && !isProcessing && (
                    <motion.div variants={itemVariants} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Button
                        onClick={handleImageSubmit}
                        className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                      >
                         Identify & Log
                         <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              {/* VOICE INPUT TAB */}
              <TabsContent value="voice" className="mt-0 focus-visible:ring-0">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col items-center justify-center py-6 space-y-8"
                >
                  <div className="relative">
                    {/* Animated Ripple Effect */}
                    <AnimatePresence>
                      {isRecording && (
                        <>
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0.5, scale: 1 }}
                              animate={{ opacity: 0, scale: 2.5 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.4,
                                ease: "easeOut",
                              }}
                              className="absolute inset-0 bg-red-500/20 rounded-full"
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={isRecording ? stopVoice : startVoice}
                      disabled={isVoiceProcessing || !speechSupported}
                      className={cn(
                        "relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
                        isRecording 
                          ? "bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/30" 
                          : "bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <Mic className={cn(
                        "w-10 h-10 transition-colors duration-300", 
                        isRecording ? "text-white" : "text-gray-600 dark:text-gray-300"
                      )} />
                    </motion.button>
                  </div>

                  <div className="space-y-2 text-center max-w-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {isRecording ? "Listening..." : "Tap to Speak"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRecording 
                        ? "Say something like 'Two eggs and a slice of toast'"
                        : "Use your voice to quickly log your meals without typing."
                      }
                    </p>
                  </div>

                  {/* Transcript Display */}
                  <div className="w-full bg-gray-50 dark:bg-black/40 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 min-h-[100px] flex flex-col justify-between">
                    <div className="text-base font-medium leading-relaxed">
                       {finalTranscript ? (
                         <span className="text-gray-800 dark:text-gray-200">{finalTranscript}</span>
                       ) : (
                         <span className="text-gray-400 dark:text-gray-600 italic">Transcript will appear here...</span>
                       )}
                       {interimTranscript && (
                         <span className="text-gray-500 dark:text-gray-400 ml-1">{interimTranscript}</span>
                       )}
                    </div>
                    
                    {(finalTranscript || interimTranscript) && (
                      <div className="flex justify-end mt-2">
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                             setFinalTranscript("");
                             setInterimTranscript("");
                           }}
                           className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Voice Action Buttons */}
                  <div className="w-full grid grid-cols-2 gap-4">
                     <Button 
                       variant="outline"
                       onClick={() => {
                         if (isRecording) stopVoice()
                         setFinalTranscript((f) => f + " " + interimTranscript)
                         setInterimTranscript("")
                       }}
                       disabled={(!finalTranscript && !interimTranscript)}
                       className="h-12 rounded-xl border-gray-300 dark:border-gray-700"
                     >
                       Save Text Only
                     </Button>
                     <Button
                       onClick={submitVoice}
                       disabled={isVoiceProcessing || (!finalTranscript && !interimTranscript)}
                       className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                     >
                       {isVoiceProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Log"}
                     </Button>
                  </div>

                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>

      {/* Decorative Background Elements */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/20 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-[300px] h-[300px] bg-purple-400/20 blur-[80px] rounded-full -z-10 pointer-events-none" />
    </div>
  )
}