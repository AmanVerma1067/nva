'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Mail, Lock, User, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export function AuthFlow() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [healthDataConsent, setHealthDataConsent] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupFullName, setSignupFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "Login successful.",
      })
      
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!healthDataConsent || !privacyConsent) {
      toast({
        title: "Consent Required",
        description: "Please accept both consent agreements.",
        variant: "destructive"
      })
      return
    }

    if (!signupEmail || !signupPassword || !signupFullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupFullName
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("No user data returned")

      // Step 2: Create profile (this will be done in onboarding, but create basic one)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw - profile will be completed in onboarding
      }

      toast({
        title: "Account Created!",
        description: "Please complete your health profile.",
      })

      router.push('/onboarding')
      
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Welcome
        </Button>

        <Card className="border-2 border-medical-blue/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Secure Access</CardTitle>
            <CardDescription>
              Your health data is protected with medical-grade security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-medical-blue hover:bg-medical-blue/90"
                >
                  {isLoading ? 'Signing In...' : 'Sign In Securely'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      placeholder="Your full name"
                      className="pl-10"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="health-consent"
                      checked={healthDataConsent}
                      onCheckedChange={(checked) => setHealthDataConsent(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="health-consent" className="text-sm font-medium cursor-pointer">
                        Health Data Consent
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        I consent to the secure processing of my health data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy-consent"
                      checked={privacyConsent}
                      onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="privacy-consent" className="text-sm font-medium cursor-pointer">
                        Privacy Policy Agreement
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        I agree to the privacy policy and terms
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSignup}
                  disabled={isLoading || !healthDataConsent || !privacyConsent}
                  className="w-full bg-medical-blue hover:bg-medical-blue/90"
                >
                  {isLoading ? 'Creating Account...' : 'Create Secure Account'}
                </Button>

                {(!healthDataConsent || !privacyConsent) && (
                  <p className="text-xs text-center text-amber-600">
                    Please accept both agreements to continue
                  </p>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-medical-blue" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Your data is encrypted and stored securely
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}