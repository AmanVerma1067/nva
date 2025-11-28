"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------- TYPES ----------
type FoodLog = {
  id?: string;
  logged_at: string;
  calories?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fat?: number | string;
  nutrients?: { [k: string]: any };
  description?: string;
  [k: string]: any;
};

// ---------- HELPERS ----------
const cleanNum = (val: any): number => {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (typeof val === "object") return cleanNum(val.value || val.amount);
  return 0;
};

function extractMacros(log: FoodLog) {
  const p = cleanNum(log.nutrients?.protein ?? log.protein);
  const c = cleanNum(log.nutrients?.carbs ?? log.carbs);
  const f = cleanNum(log.nutrients?.fat ?? log.fat);
  let cal = cleanNum(log.nutrients?.calories ?? log.calories);
  if (!cal) cal = Math.round(p * 4 + c * 4 + f * 9);
  return { p, c, f, cal };
}

// ---------- MOCK DATA GENERATOR ----------
const generateMockData = (): FoodLog[] => {
  const data: FoodLog[] = [];
  const now = new Date();
  const subDays = (d: Date, n: number) => {
    const x = new Date(d); x.setDate(x.getDate() - n); return x.toISOString();
  };

  // Today's Meals
  data.push(
    { id: "1", logged_at: subDays(now, 0), description: "Oatmeal & Berries", protein: 12, carbs: 45, fat: 6, calories: 320 },
    { id: "2", logged_at: subDays(now, 0), description: "Chicken Caesar", protein: 40, carbs: 15, fat: 12, calories: 450 },
    { id: "3", logged_at: subDays(now, 0), description: "Steak & Potatoes", protein: 55, carbs: 50, fat: 25, calories: 750 }
  );

  // History (Smooth Curve Data)
  const history = [2100, 1850, 2300, 1950, 2150, 1700, 2000]; 
  for (let i = 1; i <= 7; i++) {
    data.push({ 
        logged_at: subDays(now, i), 
        description: "History", 
        calories: history[i-1] 
    });
  }
  return data;
};

// ---------- COMPONENT ----------
export default function NutritionDashboard({ foodLogs = [] }: { foodLogs?: FoodLog[] }) {
  
  // 1. Prepare Data
  const { lineData, pieData, todayTotal, mealList } = useMemo(() => {
    const logs = foodLogs.length ? foodLogs : generateMockData();
    const now = new Date();
    const todayKey = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Maps
    const historyMap = new Map();
    let tP = 0, tC = 0, tF = 0, tCal = 0;
    const meals: any[] = [];

    // Init last 7 days in map to ensure continuous line
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        historyMap.set(d.toLocaleDateString('en-CA'), {
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: 0,
            dateObj: d
        });
    }

    logs.forEach(log => {
        const { p, c, f, cal } = extractMacros(log);
        const date = new Date(log.logged_at);
        const key = date.toLocaleDateString('en-CA');

        // Add to history
        if (historyMap.has(key)) {
            historyMap.get(key).calories += cal;
        }

        // Add to Today
        if (key === todayKey) {
            tP += p; tC += c; tF += f; tCal += cal;
            meals.push({ label: log.description || "Meal", cal, p, c, f });
        }
    });

    // Format Line Data (Sorted by date for continuous line)
    const lineData = Array.from(historyMap.values())
        .sort((a,b) => a.dateObj - b.dateObj)
        .map(x => ({ day: x.label, calories: Math.round(x.calories) }));

    // Format Pie Data
    const pieData = (tP+tC+tF > 0) ? [
        { name: "Protein", val: Math.round(tP), color: "#3b82f6" }, // Blue
        { name: "Carbs", val: Math.round(tC), color: "#f97316" },   // Orange
        { name: "Fat", val: Math.round(tF), color: "#ec4899" },     // Pink
    ] : [{ name: "Empty", val: 1, color: "#e2e8f0" }];

    return { 
        lineData, 
        pieData, 
        todayTotal: { cal: Math.round(tCal), mass: Math.round(tP+tC+tF) }, 
        mealList: meals 
    };
  }, [foodLogs]);

  // 2. Animate Numbers
  const [animatedCal, setAnimatedCal] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = todayTotal.cal;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4); 
        
        setAnimatedCal(Math.round(start + (end - start) * ease));

        if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [todayTotal.cal]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* --- 1. CONTINUOUS LINE CHART --- */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Weekly Trend
          </CardTitle>
          <p className="text-sm text-gray-500">Last 7 Days</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 12}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 12}} 
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151', 
                        borderRadius: '8px',
                        color: '#f3f4f6'
                    }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                {/* type="monotone" creates the smooth continuous curve 
                   stroke="url(#...)" gives it the gradient color
                */}
                <Line 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="url(#colorLine)" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: "#6366f1" }}
                    activeDot={{ r: 8, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- 2. PIE CHART & MACROS --- */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">Today's Macros</CardTitle>
            <p className="text-sm text-gray-500">Distribution</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900 dark:text-white">{animatedCal}</div>
            <div className="text-xs uppercase font-bold text-gray-400">kcal</div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
            {/* The Pie */}
            <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="val"
                            stroke="none"
                            animationDuration={1500}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(val: number) => `${val}g`}
                            contentStyle={{ borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">
                        {todayTotal.mass}
                    </span>
                    <span className="text-xs text-gray-400 uppercase font-bold">Total Grams</span>
                </div>
            </div>

            {/* Custom Legend / Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                {pieData.map(d => d.name !== "Empty" && (
                    <div key={d.name} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: d.color }}></span>
                        <span className="text-xs font-semibold text-gray-500">{d.name}</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">{d.val}g</span>
                    </div>
                ))}
            </div>

            {/* Meal List (Scrollable if many) */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex-1 overflow-auto max-h-[150px]">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Logged Items</p>
                {mealList.map((m, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{m.label}</div>
                            <div className="text-xs text-gray-400">{m.p}p • {m.c}c • {m.f}f</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{m.cal}</div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}