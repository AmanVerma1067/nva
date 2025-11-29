"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat } from "lucide-react";

// This component uses hardcoded meal plans and cycles through a different
// plan on each click. No API calls, no testing outputs.

const HARDCODED_PLANS = [
  {
    id: 1,
    daily_calorie_target: 2200,
    meal_plan: {
      Breakfast: [
        { name: "Oats with banana & almonds", calories: 350 },
        { name: "Green tea", calories: 0 }
      ],
      Lunch: [
        { name: "Paneer tikka wrap", calories: 650 },
        { name: "Mixed salad", calories: 120 }
      ],
      Dinner: [
        { name: "Dal + Brown rice", calories: 600 },
        { name: "Steamed veggies", calories: 100 }
      ],
      Snack: [
        { name: "Greek yogurt with honey", calories: 180 }
      ]
    }
  },

  {
    id: 2,
    daily_calorie_target: 1800,
    meal_plan: {
      Breakfast: [
        { name: "Poha with peanuts", calories: 300 }
      ],
      Lunch: [
        { name: "Chickpea salad bowl", calories: 500 }
      ],
      Dinner: [
        { name: "Grilled tofu + quinoa", calories: 700 }
      ],
      Snack: [
        { name: "Apple with peanut butter", calories: 150 }
      ]
    }
  },

  {
    id: 3,
    daily_calorie_target: 2500,
    meal_plan: {
      Breakfast: [
        { name: "Stuffed paratha + curd", calories: 600 }
      ],
      Lunch: [
        { name: "Chicken biryani (small)", calories: 900 }
      ],
      Dinner: [
        { name: "Fish curry + roti", calories: 700 }
      ],
      Snack: [
        { name: "Masala peanuts", calories: 200 }
      ]
    }
  },

  {
    id: 4,
    daily_calorie_target: 2000,
    meal_plan: {
      Breakfast: [
        { name: "Smoothie (banana+spinach+protein)", calories: 350 }
      ],
      Lunch: [
        { name: "Veggie quinoa bowl", calories: 600 }
      ],
      Dinner: [
        { name: "Lentil soup + toast", calories: 600 }
      ],
      Snack: [
        { name: "Carrot sticks + hummus", calories: 150 }
      ]
    }
  },

  {
    id: 5,
    daily_calorie_target: 1600,
    meal_plan: {
      Breakfast: [
        { name: "Upma with veggies", calories: 280 }
      ],
      Lunch: [
        { name: "Rajma + rice (small)", calories: 550 }
      ],
      Dinner: [
        { name: "Mixed veg stir-fry + noodles", calories: 600 }
      ],
      Snack: [
        { name: "Roasted chana", calories: 170 }
      ]
    }
  },

  {
    id: 6,
    daily_calorie_target: 2100,
    meal_plan: {
      Breakfast: [
        { name: "Idli (3) + sambar", calories: 320 }
      ],
      Lunch: [
        { name: "Grilled chicken salad", calories: 600 }
      ],
      Dinner: [
        { name: "Methi paratha + curd", calories: 700 }
      ],
      Snack: [
        { name: "Fruit bowl", calories: 180 }
      ]
    }
  },

  {
    id: 7,
    daily_calorie_target: 2300,
    meal_plan: {
      Breakfast: [
        { name: "Masala oats", calories: 350 }
      ],
      Lunch: [
        { name: "Soya keema + roti", calories: 750 }
      ],
      Dinner: [
        { name: "Paneer butter masala + rice", calories: 800 }
      ],
      Snack: [
        { name: "Protein shake", calories: 200 }
      ]
    }
  },

  {
    id: 8,
    daily_calorie_target: 1900,
    meal_plan: {
      Breakfast: [
        { name: "Multigrain toast + avocado", calories: 320 }
      ],
      Lunch: [
        { name: "Lentil salad + seeds", calories: 550 }
      ],
      Dinner: [
        { name: "Vegetable korma + chapati", calories: 700 }
      ],
      Snack: [
        { name: "Mixed nuts (small)", calories: 180 }
      ]
    }
  }
];

export default function MealSuggestions({ suggestions: _suggestions }: { suggestions?: any[] }) {
  const suggestions = _suggestions ?? [];

  // index of currently displayed hardcoded plan
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  function showNextPlan() {
    setLoading(true);
    setShown(false);

    // simulate loading/animation before showing the plan
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % HARDCODED_PLANS.length);
      setLoading(false);
      setShown(true);
    }, 650);
  }

  const activePlan = HARDCODED_PLANS[index];

  return (
    <Card className="border-2 border-medical-blue/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ChefHat className="h-5 w-5 text-medical-blue" />
          <span>Meal Suggestions</span>
        </CardTitle>
        <CardDescription>Click the button to reveal a preset meal plan.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {suggestions.length > 0 &&
          suggestions.map((meal) => (
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

        <div className="flex gap-2 items-center">
          <Button className="bg-medical-blue" onClick={showNextPlan} disabled={loading}>
            Show meal option
          </Button>

          {/* simple loader */}
          {loading && (
            <div className="flex items-center">
              <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* DISPLAY ONLY AFTER CLICK - with fade animation */}
        <div className={`mt-4 space-y-2 ${shown ? 'opacity-100 transition-opacity duration-500' : 'opacity-0'}`}>
          {shown && (
            <>
              <h3 className="font-semibold">Daily Calorie Target:</h3>
              <p className="text-medical-blue font-medium">{activePlan.daily_calorie_target} kcal</p>

              <h3 className="font-semibold mt-4">Meal Plan:</h3>
              <div className="space-y-3">
                {Object.entries(activePlan.meal_plan).map(([mealType, foods]) => (
                  <div key={mealType}>
                    <h4 className="font-medium text-gray-700">{mealType}</h4>
                    <ul className="ml-4 list-disc text-sm">
                      {(foods as any[]).map((f, idx) => (
                        <li key={idx}>
                          {f.name} — {f.calories} kcal
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
