"use client";

import { useState, useEffect } from "react";
import { WaterIntakeTracker } from "@/components/water-intake-tracker";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  Clock,
  Zap,
  Loader2,
  Sparkles,
  Printer,
  FileText,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { FoodInputTabs } from "@/components/food-input-tabs";
import { NutritionChart } from "@/components/nutrition-chart";
import { useToast } from "@/hooks/use-toast";

// static imports for the components you added
import MealSuggestions from "@/components/meal-suggestions";
import MedicalAlerts from "@/components/medical-alerts";
// --- NEW IMPORT ---
import { VoiceAssistant } from "@/components/voice-assistant";

// --- Interfaces ---
interface FoodLog {
  id: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
  log_type: string;
  confidence?: number;
}

interface DailyNutrition {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  total_sugar?: number;
  water_intake_glasses?: number;
}

interface GeneratedInsight {
  score: number;
  summary: string;
  macroAnalysis: string[];
  recommendations: string[];
  generatedAt: string;
}

interface MealSuggestion {
  id: string;
  title?: string;
  description?: string;
  calories?: number;
  tags?: string[];
}

interface MedicalAlert {
  id: string;
  title?: string;
  message: string;
  severity?: "low" | "medium" | "high";
  createdAt?: string;
}

export function MainDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // --- State ---
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    total_fiber: 0,
    total_sugar: 0,
    water_intake_glasses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Insight Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<GeneratedInsight | null>(null);

  // --- Goals Configuration ---
  const [goals] = useState({
    calories: 2500,
    protein: 150,
    carbs: 350,
    fat: 80,
    water: 8,
  });

  // --- Meal suggestions & alerts ---
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [medicalAlerts, setMedicalAlerts] = useState<MedicalAlert[]>([]);
  const [isFetchingExtras, setIsFetchingExtras] = useState(false);

  // --- Data Fetching ---
  const fetchFoodLogs = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/food-logs?date=${today}`);
      if (!response.ok) throw new Error("Failed to fetch food logs");
      const data = await response.json();
      setFoodLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching food logs:", error);
      setFoodLogs([]);
    }
  };

  const fetchDailyNutrition = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/daily-nutrition?date=${today}`);
      if (!response.ok) throw new Error("Failed to fetch daily nutrition");
      const data = await response.json();
      setDailyNutrition({
        total_calories: data.total_calories || 0,
        total_protein: data.total_protein || 0,
        total_carbs: data.total_carbs || 0,
        total_fat: data.total_fat || 0,
        total_fiber: data.total_fiber || 0,
        total_sugar: data.total_sugar || 0,
        water_intake_glasses: data.water_intake_glasses || 0,
      });
    } catch (error) {
      console.error("Error fetching daily nutrition:", error);
      setDailyNutrition((prev) => prev);
    }
  };

  const fetchMealSuggestions = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/meal-suggestions?date=${today}`);
      if (!res.ok) throw new Error("Failed to fetch meal suggestions");
      const data = await res.json();
      setMealSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Meal suggestions fetch failed, falling back to empty list.", err);
      setMealSuggestions([]);
    }
  };

  const fetchMedicalAlerts = async () => {
    try {
      const res = await fetch(`/api/medical-alerts?userId=${encodeURIComponent(user?.id || "")}`);
      if (!res.ok) throw new Error("Failed to fetch medical alerts");
      const data = await res.json();
      setMedicalAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Medical alerts fetch failed, falling back to none.", err);
      setMedicalAlerts([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFoodLogs(), fetchDailyNutrition(), fetchMealSuggestions(), fetchMedicalAlerts()]);
      setIsLoading(false);
    };
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // refresh dashboard when a new food log is created elsewhere
    const handler = () => {
      fetchFoodLogs();
      fetchDailyNutrition();
      fetchMealSuggestions();
    };
    // quick-add from MealSuggestions -> prefill FoodInputTabs if implemented
    const quickAddHandler = (e: any) => {
      // Emit a custom event containing the meal suggestion; FoodInputTabs can listen if implemented
      window.dispatchEvent(new CustomEvent("prefillFoodInput", { detail: e?.detail ?? null }));
    };

    window.addEventListener("foodLogUpdated", handler);
    window.addEventListener("quickAddMeal", quickAddHandler);

    return () => {
      window.removeEventListener("foodLogUpdated", handler);
      window.removeEventListener("quickAddMeal", quickAddHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helper Logic ---
  const getHealthStatus = () => {
    const calorieProgress = (dailyNutrition.total_calories / goals.calories) * 100;
    if (calorieProgress < 50)
      return {
        status: "Low",
        color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        level: "Consider eating more",
      };
    if (calorieProgress > 110)
      return {
        status: "High",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        level: "Over goal",
      };
    return {
      status: "Healthy",
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      level: "On track today",
    };
  };

  const healthStatus = getHealthStatus();

  const recentMeals = foodLogs.slice(0, 8).map((log) => ({
    meal: log.description,
    time: new Date(log.logged_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    calories: log.calories,
    type: log.log_type,
    id: log.id ?? `${log.logged_at}-${log.description.slice(0, 12)}`, // safe unique id fallback
  }));

  const todayMetrics = [
    { label: "Calories", value: Math.round(dailyNutrition.total_calories), goal: goals.calories, unit: "kcal", color: "bg-blue-500" },
    { label: "Protein", value: Math.round(dailyNutrition.total_protein), goal: goals.protein, unit: "g", color: "bg-green-500" },
    { label: "Carbs", value: Math.round(dailyNutrition.total_carbs), goal: goals.carbs, unit: "g", color: "bg-orange-500" },
    { label: "Fat", value: Math.round(dailyNutrition.total_fat), goal: goals.fat, unit: "g", color: "bg-purple-500" },
  ];

  // --- Insight Generation Logic (Using Gemini API) ---
  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setInsights(null); // Clear previous

    try {
      const response = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyNutrition,
          foodLogs,
          goals,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate insights");

      const data = await response.json();

      setInsights({
        score: data.score,
        summary: data.summary,
        macroAnalysis: data.macroAnalysis,
        recommendations: data.recommendations,
        generatedAt: new Date().toLocaleString(),
      });

      toast({
        title: "Insights Generated",
        description: "Your AI health report is ready.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    // FULL WIDTH with a small left/right gap
    <div className="w-full px-4 lg:px-6 pb-10 space-y-8 relative">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl p-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group print:hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse capitalize">
              {user?.email?.split("@")[0] || "User"}
            </span>
            ! 👋
          </h2>

          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            {foodLogs.length === 0 ? (
              <span className="flex items-center gap-2">
                Ready to fuel your body? Start logging your meals to track your nutrition today!
              </span>
            ) : (
              <span>
                You're on a roll! You've logged <span className="font-bold text-blue-600 dark:text-blue-400">{foodLogs.length}</span> meal{foodLogs.length !== 1 ? "s" : ""} today.
              </span>
            )}
          </p>

          <div className="mt-6 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: foodLogs.length > 0 ? "25%" : "5%" }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch print:hidden">
        {/* Calories */}
        <Card className="flex flex-col h-full border-2 border-blue-500/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Calories</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(dailyNutrition.total_calories)}</div>
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">of {goals.calories} goal</p>
            <Progress value={(dailyNutrition.total_calories / goals.calories) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Water */}
        <div className="h-full">
          <WaterIntakeTracker userId={user?.id} initialGlasses={dailyNutrition.water_intake_glasses || 0} goal={goals.water} />
        </div>

        {/* Status */}
        <Card className="flex flex-col h-full border-2 border-purple-500/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Status</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{healthStatus.status}</div>
            <p className="text-sm text-muted-foreground mb-3">{healthStatus.level}</p>
            <div className="flex">
              <Badge variant="secondary" className={`px-3 py-1 text-sm font-medium ${healthStatus.color}`}>
                {healthStatus.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Food Input + Meal Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md bg-white dark:bg-gray-900 overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 print:hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xl">Log Your Food</CardTitle>
              <CardDescription className="mt-1">Use text, voice, or image to quickly log your meals</CardDescription>
            </div>
            <CardContent className="p-6">
              <FoodInputTabs />
            </CardContent>
          </Card>

          {/* Meal Suggestions component */}
          <div className="mt-4">
            <MealSuggestions suggestions={mealSuggestions} />
          </div>
        </div>

        {/* Right column: Water + Recent Meals + Medical Alerts */}
        <div className="space-y-6">
          {/* Medical Alerts component */}
          <div>
            <MedicalAlerts alerts={medicalAlerts} />
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" onClick={fetchMedicalAlerts}>Refresh Alerts</Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- GEMINI INSIGHTS GENERATOR SECTION --- */}
      <div className="pt-4" id="insights-section">
        <div className="flex items-center gap-2 mb-6 print:hidden">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Health Insights</h3>
        </div>

        {!insights ? (
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all print:hidden">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Generate Your Daily Report</h4>
            <p className="text-gray-500 max-w-md mb-6">
              Analyze your current food logs, water intake, and nutritional goals to get personalized AI recommendations using Gemini.
            </p>
            <Button size="lg" onClick={handleGenerateInsights} disabled={isGenerating || foodLogs.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Insights
                </>
              )}
            </Button>
            {foodLogs.length === 0 && <p className="text-xs text-amber-600 mt-3">Please log at least one meal to generate insights.</p>}
          </div>
        ) : (
          <Card className="border-purple-100 dark:border-purple-900 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-purple-600 text-white p-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-5 w-5 opacity-90" />
                  <h3 className="font-bold text-xl">Daily Health Report</h3>
                </div>
                <p className="text-purple-100 text-sm">Generated on {insights.generatedAt}</p>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button variant="secondary" size="sm" onClick={handleGenerateInsights} disabled={isGenerating} className="bg-purple-500 text-white hover:bg-purple-400 border-0">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />} Refresh
                </Button>
                <Button variant="secondary" size="sm" onClick={handlePrint} className="bg-white text-purple-700 hover:bg-gray-100">
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              </div>
            </div>

            <CardContent className="p-8 space-y-6">
              {/* Score Section */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                  <h4 className="font-semibold text-gray-500 text-sm uppercase tracking-wide">Daily Health Score</h4>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
                    {insights.score}
                    <span className="text-xl text-gray-400 font-medium">/100</span>
                  </div>
                </div>
                <div className="text-right max-w-md">
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">"{insights.summary}"</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Analysis */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                    <Activity className="h-4 w-4 text-blue-500" /> Nutritional Analysis
                  </h4>
                  <ul className="space-y-3">
                    {insights.macroAnalysis.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 min-w-[6px]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Gemini's Recommendations
                  </h4>
                  <div className="space-y-3">
                    {insights.recommendations.map((item, idx) => (
                      <Alert key={idx} className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 py-3">
                        <AlertDescription className="text-green-800 dark:text-green-300 text-sm">{item}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50 dark:bg-gray-900/50 p-4 text-xs text-gray-400 text-center justify-center border-t border-gray-100 dark:border-gray-800">
              This report is generated by AI based on your logged data. Consult a medical professional for medical advice.
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* Nutrition Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Today's Nutrition</CardTitle>
              <CardDescription>Track your macronutrients breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {foodLogs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200">
                  <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">No meals logged yet today</p>
                  <p className="text-sm text-gray-500 mt-1">Start logging your meals to see your nutrition breakdown!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {todayMetrics.map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{metric.label}</span>
                        <span className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900 dark:text-white">{metric.value}</span> / {metric.goal} {metric.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full ${metric.color} shadow-sm transition-all duration-1000 ease-out`} style={{ width: `${Math.min((metric.value / metric.goal) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <NutritionChart />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Meals Sidebar */}
        <div>
          <Card className="h-full shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" /> Recent Meals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMeals.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-sm font-medium">No meals logged yet.</p>
                </div>
              ) : (
                recentMeals.map((meal) => (
                  <div key={meal.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{meal.meal}</p>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{meal.calories} cal</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal capitalize bg-gray-50 dark:bg-gray-900/50 text-gray-500">{meal.type}</Badge>
                      <span className="text-[10px] text-gray-400">{meal.time}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- ADDED VOICE ASSISTANT HERE --- */}
      <VoiceAssistant
        context={{
          foodLogs,
          dailyNutrition,
          goals,
          user,
        }}
      />
    </div>
  );
}