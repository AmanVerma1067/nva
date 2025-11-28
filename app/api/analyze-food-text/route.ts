import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this food log: "${text}". Return STRICT JSON: {"name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": number}`;
    
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(textResponse));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}