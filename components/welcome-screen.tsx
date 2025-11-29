'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Heart, Brain, Lock, ArrowRight, Activity, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// --- Components ---

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
    <div className="relative h-full bg-white/5 dark:bg-black/40 backdrop-blur-xl border border-white/10 group-hover:border-blue-500/50 p-6 rounded-2xl transition-all duration-300 overflow-hidden">
      {/* Hover Gradient Shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
        <Icon className="h-6 w-6 text-blue-400 group-hover:text-blue-300" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
        {description}
      </p>
    </div>
  </motion.div>
)

const BackgroundBlobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
        opacity: [0.3, 0.5, 0.3] 
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-900/30 rounded-full blur-[120px]" 
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        x: [0, 50, 0],
        opacity: [0.2, 0.4, 0.2] 
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[100px]" 
    />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
  </div>
)

export function WelcomeScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-blue-500/30">
      
      <BackgroundBlobs />

      <div className="max-w-6xl w-full relative z-10 flex flex-col gap-12">
        
        {/* --- Hero Section --- */}
        <div className="text-center space-y-8 pt-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="flex items-center justify-center space-x-3 mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 animate-pulse" />
              <Activity className="h-12 w-12 text-blue-400 relative z-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-400 to-purple-400">
              Nutri-Vision AI
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Your biometrics, decoded. Experience the next generation of <span className="text-blue-400 font-medium">medical-grade nutrition analysis</span> powered by predictive AI.
          </motion.p>
        </div>

        {/* --- Feature Grid --- */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          <FeatureCard 
            delay={0.3}
            icon={Shield}
            title="HIPAA Compliant"
            description="Enterprise-grade encryption meets healthcare standards. Your medical data never leaves our secure enclave without permission."
          />
          <FeatureCard 
            delay={0.4}
            icon={Heart}
            title="Condition Aware"
            description="Our engine adapts to Diabetes, Hypertension, and 40+ other conditions to prevent dangerous food interactions."
          />
          <FeatureCard 
            delay={0.5}
            icon={Brain}
            title="Predictive AI"
            description="Forecasting health trends based on your dietary logs using advanced large language models tailored for biology."
          />
          <FeatureCard 
            delay={0.6}
            icon={Lock}
            title="Sovereign Data"
            description="You own your biometric profile. Export, delete, or share with your doctor via temporary secure links."
          />
        </div>

        {/* --- Action Section --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-6 mt-8"
        >
          <Button 
            onClick={handleGetStarted}
            disabled={isLoading}
            className={cn(
              "group relative overflow-hidden rounded-full bg-white text-slate-950 px-12 py-8 text-xl font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)]",
              isLoading && "cursor-not-allowed opacity-90"
            )}
          >
            <span className="relative z-10 flex items-center gap-3">
              {isLoading ? (
                <>
                  <Zap className="h-5 w-5 animate-spin" />
                  Initializing Secure Environment...
                </>
              ) : (
                <>
                  Get Started Safely
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-black/10 to-transparent z-0" />
          </Button>

          <p className="text-sm text-gray-500 font-medium">
            Join 10,000+ users trusting Nutri-Vision with their health
          </p>
        </motion.div>

        {/* --- Footer Disclaimer --- */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-auto pt-8 border-t border-white/5"
        >
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 backdrop-blur-md max-w-4xl mx-auto">
            <p className="text-xs text-amber-200/80 text-center flex items-center justify-center gap-2">
              <Shield className="h-3 w-3" />
              <span className="font-semibold">Medical Disclaimer:</span> 
              This application utilizes AI for nutritional guidance and is not a substitute for professional medical diagnosis or treatment.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}