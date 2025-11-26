import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"
import { nutriVisionAPI } from "@/lib/nutri-vision-api"

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const contentType = request.headers.get("content-type") || ""
    let nutriVisionResponse
    let logType: string

    // Handle different input types
    if (contentType.includes("multipart/form-data")) {
      // Image upload
      const formData = await request.formData()
      const imageFile = formData.get("image") as File
      
      if (!imageFile) {
        return NextResponse.json(
          { error: "No image file provided" },
          { status: 400 }
        )
      }

      logType = "image"
      nutriVisionResponse = await nutriVisionAPI.analyzeImage(imageFile)
    } else {
      // Text or voice input
      const body = await request.json()
      const { text, type } = body

      if (!text) {
        return NextResponse.json(
          { error: "No text provided" },
          { status: 400 }
        )
      }

      logType = type || "text"
      nutriVisionResponse = await nutriVisionAPI.analyzeText(text)
    }

    // Store each food item in food_logs
    const foodLogEntries = nutriVisionResponse.items.map((item) => ({
      user_id: user.id,
      description: `${item.quantity} ${item.unit} ${item.name}`,
      log_type: logType,
      calories: Math.round(item.macros.calories),
      protein: item.macros.protein,
      carbs: item.macros.carbs,
      fat: item.macros.fats,
      fiber: item.macros.fiber || 0,
      sugar: item.macros.sugar || 0,
      confidence: item.confidence,
      source: item.source,
      usda_food_id: item.usda_food_id,
      logmeal_food_id: item.logmeal_food_id,
      raw_response: item,
      logged_at: new Date().toISOString(),
    }))

    const { data: savedLogs, error: insertError } = await supabase
      .from("food_logs")
      .insert(foodLogEntries)
      .select()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json(
        { error: `Failed to save food logs: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Update daily nutrition summary
    const today = new Date().toISOString().split("T")[0]
    const { data: dailyData } = await supabase
      .from("daily_nutrition")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .single()

    const totals = nutriVisionResponse.totals

    if (dailyData) {
      await supabase
        .from("daily_nutrition")
        .update({
          total_calories: (dailyData.total_calories || 0) + totals.calories,
          total_protein: (dailyData.total_protein || 0) + totals.protein,
          total_carbs: (dailyData.total_carbs || 0) + totals.carbs,
          total_fat: (dailyData.total_fat || 0) + totals.fats,
          total_fiber: (dailyData.total_fiber || 0) + (totals.fiber || 0),
          total_sugar: (dailyData.total_sugar || 0) + (totals.sugar || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("log_date", today)
    } else {
      await supabase.from("daily_nutrition").insert({
        user_id: user.id,
        log_date: today,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fats,
        total_fiber: totals.fiber || 0,
        total_sugar: totals.sugar || 0,
      })
    }

    return NextResponse.json({
      success: true,
      logs: savedLogs,
      analysis: nutriVisionResponse,
      message: `Successfully logged ${nutriVisionResponse.items.length} food item(s)`,
    })
  } catch (error) {
    console.error("Food analysis error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze food",
        details: "Check if Nutri-Vision API is configured correctly",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  try {
    let query = supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })

    if (date) {
      const startOfDay = new Date(date).toISOString()
      const endOfDay = new Date(
        new Date(date).getTime() + 24 * 60 * 60 * 1000
      ).toISOString()

      query = query.gte("logged_at", startOfDay).lt("logged_at", endOfDay)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}