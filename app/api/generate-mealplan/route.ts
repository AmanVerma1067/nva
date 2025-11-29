// app/api/generate-mealplan/route.ts
import { NextResponse } from "next/server";

const EXTERNAL_ENDPOINT = process.env.BASE_URL?.replace(/\/$/, "") ?? "";
const EXTERNAL_PATH = "/generate-nutrition"; // <-- change this if your provider uses a different path
const API_KEY = process.env.NUTRITION_API_KEY ?? process.env.API_KEY ?? "";

export async function POST(req: Request) {
  try {
    if (!EXTERNAL_ENDPOINT) {
      return NextResponse.json({ error: "BASE_URL not configured on server." }, { status: 500 });
    }
    if (!API_KEY) {
      return NextResponse.json({ error: "NUTRITION_API_KEY not configured on server." }, { status: 500 });
    }

    const body = await req.json();

    // Basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Forward to the external API (replace endpoint/path as needed)
    const extRes = await fetch(`${EXTERNAL_ENDPOINT}${EXTERNAL_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // keep API key in Authorization header (or adapt to provider)
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const extText = await extRes.text(); // capture raw text for status debug

    // try to parse JSON if provider returned JSON
    try {
      const extJson = JSON.parse(extText);
      return NextResponse.json({
        status: extRes.status,
        providerResponse: extJson,
      }, { status: 200 });
    } catch {
      // fallback: return raw text
      return NextResponse.json({
        status: extRes.status,
        providerResponseText: extText,
      }, { status: 200 });
    }
  } catch (err: any) {
    console.error("Server forward error:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
