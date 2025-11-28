import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: "I need a Gemini API Key to work. Please check your .env file." },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- FIX: "gemini-2.5-flash" DOES NOT EXIST. Use "gemini-1.5-flash" ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const systemPrompt = `
      You are a specialized Nutrition Assistant.
      
      USER CONTEXT:
      - Name: ${context.userName || "User"}
      - Calories Eaten Today: ${context.stats?.total_calories || 0}
      - Calorie Goal: ${context.goals?.calories || 2500}
      - Today's Logs: ${JSON.stringify(context.logs || [])}
      
      INSTRUCTIONS:
      - Answer the user's question directly based on the data above.
      - Keep it short (max 2 sentences) because this will be spoken out loud.
      - Do not use markdown (no bold, no italics).
      - If asking "What did I eat?", list the items clearly.
    `;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Clean up asterisks if Gemini adds them (Voice APIs hate markdown)
    const cleanResponse = response.replace(/\*/g, "");

    return NextResponse.json({ reply: cleanResponse });
  } catch (error) {
    console.error("Voice Chat Error:", error);
    return NextResponse.json(
      { reply: "Sorry, I ran into an error processing your request." },
      { status: 500 }
    );
  }
}