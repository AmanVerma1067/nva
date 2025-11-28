"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Plus } from "lucide-react";

/**
 * MealSuggestions component with "Generate Meal Plan" functionality.
 * - Calls /api/generate-mealplan (server route)
 * - Expects provider response with a meal plan & macros (adapts both JSON or textual responses)
 */

export default function MealSuggestions({ suggestions: _suggestions }: { suggestions?: any[] }) {
  const suggestions = _suggestions ?? [];

  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rawProvider, setRawProvider] = useState<any | null>(null);

  // Example test_user payload you provided
  const test_user = {
    age: 25,
    gender: "male",
    height_cm: 180,
    weight_kg: 75,
    activity_level: 3,
    goal: "maintain",
    diet_type: "vegetarian",
  };

  async function handleGenerate(userPayload = test_user) {
    setLoading(true);
    setStatusCode(null);
    setMessage(null);
    setRawProvider(null);

    try {
      const res = await fetch("/api/generate-mealplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userPayload,
          // optional instructions for provider; you can adjust prompts here
          instructions: "Return a daily meal plan (Breakfast, Lunch, Dinner, Snack) with kcal per item and macronutrient recommendations."
        }),
      });

      const json = await res.json();
      setStatusCode(json?.status ?? res.status);

      // Provider returned parsed JSON inside providerResponse -> try to format it
      const providerResponse = json?.providerResponse ?? json?.providerResponseText ?? json;

      // If providerResponse is text, keep it as-is
      if (typeof providerResponse === "string") {
        setMessage(providerResponse);
        setRawProvider(providerResponse);
      } else if (providerResponse && typeof providerResponse === "object") {
        // Try to extract fields commonly returned by nutrition endpoints
        // adapt field names as per your provider's response shape
        if (providerResponse.meal_plan || providerResponse.plan || providerResponse.meals) {
          // structured plan
          const plan = providerResponse.meal_plan ?? providerResponse.plan ?? providerResponse.meals;
          const target = providerResponse.daily_calorie_target ?? providerResponse.target_calories ?? providerResponse.dailyCalories;
          const macros = providerResponse.macros ?? providerResponse.recommendations ?? providerResponse.macroRecommendations;

          // build readable text message similar to your sample
          let out = `✅ Meal plan generated successfully!\n`;
          if (target) out += `🎯 Daily Calorie Target: ${target} kcal\n\n`;
          out += `📋 Meal Plan:\n`;
          // assume plan is object with meals grouped by meal name
          if (Array.isArray(plan)) {
            // array of meals — group by meal.time or meal.mealType if available
            plan.forEach((m: any) => {
              out += `  - ${m.name} : ${m.calories ?? m.kcal ?? "—"} kcal\n`;
            });
          } else {
            // object grouping like { Breakfast: [...], Lunch: [...] }
            for (const [mealType, items] of Object.entries(plan)) {
              out += `  ${mealType}:\n`;
              if (Array.isArray(items)) {
                items.forEach((it: any) => {
                  const name = it.name ?? it.item ?? it.title ?? JSON.stringify(it);
                  const kcal = it.calories ?? it.kcal ?? it.kcal_estimate ?? "—";
                  out += `    - ${name}: ${kcal} kcal\n`;
                });
              } else {
                out += `    ${JSON.stringify(items)}\n`;
              }
            }
          }

          out += `\n📊 Testing nutrition recommendations endpoint...\nStatus Code: ${json?.status ?? res.status}\n`;
          out += `✅ Nutrition recommendations generated successfully!\n`;
          if (macros) {
            out += `🎯 Daily Calorie Target: ${macros?.calories ?? target ?? "—"} kcal\n\n`;
            out += `🥗 Macronutrient Recommendations:\n`;
            out += `  - Protein: ${macros?.protein ?? macros?.protein_g ?? macros?.protein_g_per_day ?? "—"}g\n`;
            out += `  - Carbohydrates: ${macros?.carbs ?? macros?.carbohydrates ?? macros?.carb_g ?? "—"}g\n`;
            out += `  - Fat: ${macros?.fat ?? macros?.lipid_g ?? "—"}g\n`;
          }

          setMessage(out);
          setRawProvider(providerResponse);
        } else {
          // Generic JSON — show pretty JSON
          setMessage(JSON.stringify(providerResponse, null, 2));
          setRawProvider(providerResponse);
        }
      } else {
        setMessage("No response content from provider.");
      }
    } catch (err: any) {
      console.error("Generate error:", err);
      setMessage(`Error: ${err?.message ?? "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    // small UX feedback — you can connect to your toast
    alert("Copied to clipboard");
  };

  return (
    <Card className="border-2 border-medical-blue/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ChefHat className="h-5 w-5 text-medical-blue" />
          <span>Meal Suggestions</span>
        </CardTitle>
        <CardDescription>Based on your health goals and dietary needs</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* existing suggestions */}
        {suggestions.length > 0 && suggestions.map((meal) => (
          <div key={meal.id ?? meal.name} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h4 className="font-medium">{meal.name}</h4>
                <p className="text-xs mt-1">{meal.reason}</p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.dispatchEvent(new CustomEvent("quickAddMeal", { detail: { meal } }))}
                aria-label={`Quick add ${meal.name}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* controls */}
        <div className="flex gap-2">
          <Button className="bg-medical-blue" onClick={() => handleGenerate(test_user)} disabled={loading}>
            {loading ? "Generating…" : "Generate Meal Plan"}
          </Button>
          <Button variant="outline" onClick={() => handleGenerate(test_user)} disabled={loading}>
            Test (use example user)
          </Button>
          <Button variant="ghost" onClick={handleCopy} disabled={!message}>
            Copy Result
          </Button>
        </div>

        {/* status / result */}
        <div className="mt-4">
          {statusCode !== null && <div className="text-sm text-gray-500">Status Code: {statusCode}</div>}
          {message && (
            <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/40 rounded text-sm whitespace-pre-wrap">
              {message}
            </pre>
          )}
          {!message && !loading && (
            <div className="text-sm text-gray-500">No generated plan yet. Click &quot;Generate Meal Plan&quot; to start.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
