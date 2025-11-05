"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  userProfile: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setIsAuthenticated(true)
          setUser(session.user)

try {
  const response = await fetch("/api/user-profile")
  if (response.ok) {
    const profile = await response.json()
    setUserProfile(profile)

    // If profile exists with age/gender, user completed onboarding
    if (profile?.age && profile?.gender) {
      if (pathname === "/" || pathname === "/auth") {
        router.push("/dashboard")
      }
    } else {
      // New user, redirect to onboarding
      if (
        pathname === "/" ||
        pathname === "/dashboard" ||
        pathname === "/profile" ||
        pathname === "/settings"
      ) {
        router.push("/onboarding")
      }
    }
  } else {
    // No profile found, new user
    if (
      pathname === "/" ||
      pathname === "/dashboard" ||
      pathname === "/profile" ||
      pathname === "/settings"
    ) {
      router.push("/onboarding")
    }
  }
} catch (err) {
  console.error("Profile fetch error:", err)
}

        } else {
          setIsAuthenticated(false)
          setUser(null)
          setUserProfile(null)
          if (
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/profile") ||
            pathname.startsWith("/settings") ||
            pathname.startsWith("/onboarding")
          ) {
            router.push("/auth")
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setUser(session.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [router, pathname])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)

    setIsAuthenticated(true)
    setUser(data.user)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setUser(null)
    setUserProfile(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, userProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
