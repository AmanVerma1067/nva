"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, X, Sparkles, Volume2, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Types needed for Speech Recognition ---
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  context: {
    foodLogs: any[];
    dailyNutrition: any;
    goals: any;
    user: any;
  };
}

export function VoiceAssistant({ context }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("Hi! Tap the mic to chat.");

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const startListening = () => {
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleAiQuery(text);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech error", event);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    // Try to find a good English voice
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const handleAiQuery = async (userText: string) => {
    setIsProcessing(true);
    setAiResponse("..."); // Show loading state immediately

    try {
      // Create a SAFE context (only send what is needed to avoid crash)
      const safeContext = {
        userName: context.user?.email,
        stats: {
          total_calories: context.dailyNutrition.total_calories,
        },
        goals: context.goals,
        // Map logs to simple strings to save bandwidth
        logs: context.foodLogs.map(log => `${log.description} (${log.calories} kcal)`)
      };

      const response = await fetch("/api/voice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: safeContext
        }),
      });

      const data = await response.json();
      
      if (data.reply) {
        setAiResponse(data.reply);
        speakText(data.reply);
      } else {
        throw new Error("No reply from API");
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, I'm having trouble connecting.";
      setAiResponse(errorMsg);
      speakText(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      if (synthRef.current) synthRef.current.cancel();
      stopListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-80 sm:w-96"
          >
            <Card className="shadow-2xl border-purple-200 dark:border-purple-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">Nutrition Assistant</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white hover:bg-white/20" 
                  onClick={toggleOpen}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5 h-64 flex flex-col justify-between">
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {transcript && (
                    <div className="text-right">
                      <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl rounded-tr-sm px-4 py-2 text-sm">
                        "{transcript}"
                      </span>
                    </div>
                  )}
                  
                  <div className="text-left flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm px-4 py-2 text-sm">
                      {isProcessing ? (
                         <span className="flex items-center gap-2">
                           <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                         </span>
                      ) : (
                        aiResponse
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                  {isSpeaking ? (
                     <Button 
                        variant="outline" 
                        className="rounded-full border-red-200 hover:bg-red-50 text-red-500 gap-2"
                        onClick={() => {
                          synthRef.current?.cancel();
                          setIsSpeaking(false);
                        }}
                     >
                       <Square className="h-4 w-4 fill-current" /> Stop Speaking
                     </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className={cn(
                        "rounded-full w-16 h-16 shadow-lg transition-all duration-300",
                        isListening 
                          ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200" 
                          : "bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105"
                      )}
                      onClick={isListening ? stopListening : startListening}
                    >
                      {isListening ? (
                        <div className="flex gap-1 h-4 items-center">
                          <motion.div animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                          <motion.div animate={{ height: [15, 25, 15] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                          <motion.div animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                        </div>
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  )}
                </div>
                
                <p className="text-center text-xs text-gray-400 mt-2">
                  {isListening ? "Listening..." : "Tap to speak"}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <Button
          onClick={toggleOpen}
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:scale-110 transition-transform duration-300 p-0 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/10 transition-colors" />
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-20"></span>
          <Sparkles className="h-8 w-8 text-white z-10 animate-[spin_10s_linear_infinite]" />
          <div className="absolute bottom-1 right-0 left-0 flex justify-center">
             <Volume2 className="h-3 w-3 text-white/80" />
          </div>
        </Button>
      )}
    </div>
  );
}