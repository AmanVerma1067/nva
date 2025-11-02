import { createSupabaseServer } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const { description, calories, protein, carbs, fat, logType } = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("food_logs")
      .insert([
        {
          user_id: user.id,
          description,
          calories,
          protein,
          carbs,
          fat,
          log_type: logType,
          logged_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update daily nutrition summary
    const today = new Date().toISOString().split("T")[0]
    const { data: dailyData } = await supabase
      .from("daily_nutrition")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .single()

    if (dailyData) {
      await supabase
        .from("daily_nutrition")
        .update({
          total_calories: (dailyData.total_calories || 0) + (calories || 0),
          total_protein: (dailyData.total_protein || 0) + (protein || 0),
          total_carbs: (dailyData.total_carbs || 0) + (carbs || 0),
          total_fat: (dailyData.total_fat || 0) + (fat || 0),
        })
        .eq("user_id", user.id)
        .eq("log_date", today)
    } else {
      await supabase.from("daily_nutrition").insert([
        {
          user_id: user.id,
          log_date: today,
          total_calories: calories || 0,
          total_protein: protein || 0,
          total_carbs: carbs || 0,
          total_fat: fat || 0,
        },
      ])
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    let query = supabase.from("food_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false })

    if (date) {
      const startOfDay = new Date(date).toISOString()
      const endOfDay = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString()

      query = query.gte("logged_at", startOfDay).lt("logged_at", endOfDay)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
