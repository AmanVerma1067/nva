"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// ⚠️ CLIENT-SIDE GEMINI API KEY (YOU ACCEPT THE RISK)
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
const MODEL = "gemini-2.0-flash"; // adjust as needed

// ------------- FALLBACK ALERTS -----------------
const SAMPLE_ALERTS = [
  {
    id: "s1",
    condition: "Hypertension",
    type: "warning",
    message: "Your sodium intake is high today — reduce salt for the next meal.",
    time: "Now",
    createdAt: new Date().toISOString(),
    severity: "high",
  },
];

// Utility icon
const iconFor = (type: string) => (type === "success" ? CheckCircle2 : AlertTriangle);

// ------------------ CLIENT COMPONENT ------------------
export default function MedicalAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>(SAMPLE_ALERTS);
  const [loading, setLoading] = useState(false);

  // ------------------ GENERATE ALERTS VIA GEMINI ------------------
  async function generateAlerts() {
    if (!GEMINI_API_KEY) {
      alert("ERROR: NEXT_PUBLIC_GEMINI_API_KEY missing in .env.local");
      return;
    }

    setLoading(true);

    const prompt = `
You are a medical-alert generator for a personal nutrition app.
Generate 3 alerts in JSON ONLY. Each must contain:
id, condition, type("warning","success","info"), severity("low","medium","high"),
message, time, createdAt.

Return ONLY JSON array.
`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await res.json();

      let text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        JSON.stringify(data);

      // --- extract JSON safely ---
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");
        parsed = JSON.parse(text.slice(start, end + 1));
      }

      setAlerts(parsed);
    } catch (err) {
      console.error("Gemini error:", err);
      alert("Gemini failed. Showing fallback alerts.");
    }

    setLoading(false);
  }

  // Auto-generate on load (optional)
  useEffect(() => {
    generateAlerts();
  }, []);

  // ------------------ UI ------------------
  return (
    <div className="p-6 space-y-4">
      <Card className="border-red-200/50 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-white bg-black" />
            Medical Alerts
          </CardTitle>
          <CardDescription>Generated with Gemini on the client</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <button
            onClick={generateAlerts}
            className="px-4 py-2 text-sm bg-black text-white rounded-md mb-4"
            disabled={loading}
          >
            {loading ? "Generating..." : "Regenerate Alerts"}
          </button>

          {alerts.map((alert) => {
            const Icon = iconFor(alert.type);

            const style =
              alert.type === "warning"
                ? "border-amber-200 bg-black text-white"
                : alert.type === "success"
                ? "border-green-200 bg-black text-white"
                : "border-blue-200 bg-black text-blue";

            return (
              <Alert key={alert.id} className={`${style} border`}>
                <div className="flex gap-3">
                  <Icon className="h-4 w-4 mt-1" />
                  <div className="flex-1">
                    <Badge className="mb-1">{alert.condition}</Badge>
                    <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                    <div className="text-[11px] text-gray-500 mt-1">
                      {alert.time} — {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
