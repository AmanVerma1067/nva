"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Plus, Flame, Leaf } from "lucide-react";

export default function MealSuggestions({ suggestions: _suggestions }: { suggestions?: any[] }) {
  // allow optional prop override; fallback to built-in suggestions for safety
  const suggestions = _suggestions ?? [
    {
      id: "1",
      name: "Grilled Chicken with Quinoa Bowl",
      calories: 520,
      protein: 45,
      carbs: 52,
      fat: 12,
      tags: ["high-protein", "diabetes-friendly"],
      reason: "Helps meet your protein goal with low glycemic carbs",
    },
    {
      id: "2",
      name: "Mediterranean Salmon Salad",
      calories: 480,
      protein: 38,
      carbs: 35,
      fat: 22,
      tags: ["heart-healthy", "low-sodium"],
      reason: "Heart-friendly with omega-3s and low sodium",
    },
    {
      id: "3",
      name: "Tofu Stir-Fry with Broccoli",
      calories: 420,
      protein: 28,
      carbs: 48,
      fat: 16,
      tags: ["vegetarian", "low-sodium"],
      reason: "Supports your dietary preferences while meeting goals",
    },
  ];

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "high-protein":
        return "bg-blue-100 text-blue-800";
      case "diabetes-friendly":
        return "bg-amber-100 text-amber-800";
      case "heart-healthy":
        return "bg-red-100 text-red-800";
      case "low-sodium":
        return "bg-green-100 text-green-800";
      case "vegetarian":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        {suggestions.map((meal) => (
          <div
            key={meal.id ?? meal.name}
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{meal.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{meal.reason}</p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => {
                  // placeholder action: you can implement quick-add handler here
                  // e.g. open the FoodInputTabs with prefilled text via context or event
                  window.dispatchEvent(
                    new CustomEvent("quickAddMeal", { detail: { meal } })
                  );
                }}
                aria-label={`Quick add ${meal.name}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-500 text-[11px]">Cal</p>
                <p className="font-medium">{meal.calories}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-500 text-[11px]">Protein</p>
                <p className="font-medium">{meal.protein}g</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-500 text-[11px]">Carbs</p>
                <p className="font-medium">{meal.carbs}g</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-500 text-[11px]">Fat</p>
                <p className="font-medium">{meal.fat}g</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {meal.tags?.map((tag: string) => (
                <Badge key={tag} className={`${getTagColor(tag)} text-xs flex items-center`}>
                  {tag === "high-protein" && <Flame className="h-3 w-3 mr-1" />}
                  {tag === "vegetarian" && <Leaf className="h-3 w-3 mr-1" />}
                  {tag.replace("-", " ")}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        <Button className="w-full bg-medical-blue hover:bg-medical-blue/90">View More Suggestions</Button>
      </CardContent>
    </Card>
  );
}
