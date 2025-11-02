"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"

export interface FoodLog {
  id: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  log_type: string
  logged_at: string
  created_at: string
}

export function useFoodLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(
    async (date?: string) => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        const url = new URL("/api/food-logs", window.location.origin)
        if (date) url.searchParams.append("date", date)

        const response = await fetch(url.toString())
        if (!response.ok) throw new Error("Failed to fetch food logs")

        const data = await response.json()
        setLogs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const addLog = useCallback(
    async (logData: Omit<FoodLog, "id" | "created_at">) => {
      if (!user) return

      try {
        const response = await fetch("/api/food-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logData),
        })

        if (!response.ok) throw new Error("Failed to add food log")

        const newLog = await response.json()
        setLogs([newLog, ...logs])
        return newLog
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred"
        setError(message)
        throw err
      }
    },
    [user, logs],
  )

  return { logs, loading, error, fetchLogs, addLog }
}
