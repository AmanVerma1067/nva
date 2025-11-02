"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  age: number
  gender: string
  activity_level: string
  created_at: string
  updated_at: string
}

export interface MedicalCondition {
  id: string
  condition_name: string
  severity: string
  diagnosed_year: number
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [medicalConditions, setMedicalConditions] = useState<MedicalCondition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (profileError) throw profileError
      setProfile(data)

      const { data: conditions, error: conditionsError } = await supabase
        .from("medical_conditions")
        .select("*")
        .eq("user_id", user.id)

      if (conditionsError) throw conditionsError
      setMedicalConditions(conditions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").update(updates).eq("id", user.id).select().single()

        if (error) throw error
        setProfile(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred"
        setError(message)
        throw err
      }
    },
    [user],
  )

  const addMedicalCondition = useCallback(
    async (condition: Omit<MedicalCondition, "id">) => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("medical_conditions")
          .insert([{ ...condition, user_id: user.id }])
          .select()
          .single()

        if (error) throw error
        setMedicalConditions([...medicalConditions, data])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred"
        setError(message)
        throw err
      }
    },
    [user, medicalConditions],
  )

  return {
    profile,
    medicalConditions,
    loading,
    error,
    fetchProfile,
    updateProfile,
    addMedicalCondition,
  }
}
