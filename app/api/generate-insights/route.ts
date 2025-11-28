import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key missing in environment variables" }, 
        { status: 500 }
      );
    }

    const body = await req.json();
    const { dailyNutrition, foodLogs, goals } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-1.5-flash with JSON mode forced on
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert nutritionist. Analyze the user's daily intake data against their goals.
      
      User Goals: ${JSON.stringify(goals)}
      Today's Nutrition: ${JSON.stringify(dailyNutrition)}
      Food Logs: ${JSON.stringify(foodLogs.map((l: any) => `${l.description} (${l.calories}kcal)`))}

      Task: Return a JSON object with the following schema:
      {
        "score": number (0-100 based on healthiness),
        "summary": "One concise sentence summarizing the day",
        "macroAnalysis": ["Short bullet point 1", "Short bullet point 2"],
        "recommendations": ["Actionable advice 1", "Actionable advice 2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse and return
    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Insight Generation Error:", error.message);
    return NextResponse.json(
      { error: "Failed to generate insights. Please try again." },
      { status: 500 }
    );
  }
}