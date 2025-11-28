"use client";

import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- TYPES ---
type FoodLog = {
  logged_at: string;
  calories?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fat?: number | string;
  nutrients?: { [key: string]: any };
  [k: string]: any;
};

// --- SAFE MATH PARSER (Keeps calculations correct) ---
const cleanNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const cleanString = val.replace(/[^0-9.]/g, ''); 
    const parsed = parseFloat(cleanString);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof val === 'object') return cleanNum(val.value || 0);
  return 0;
};

export function NutritionChart({ foodLogs = [] }: { foodLogs: FoodLog[] }) {
  
  const { weeklyChartData, todayStats, pieData, hasTodayData } = useMemo(() => {
    const now = new Date();
    // Local date string YYYY-MM-DD
    const localTodayKey = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString().split("T")[0];

    // 1. Setup last 7 days buckets
    const daysMap = new Map<string, { label: string; calories: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
        .toISOString().split("T")[0];
      daysMap.set(k, { 
        label: d.toLocaleDateString("en-US", { weekday: "short" }), 
        calories: 0 
      });
    }

    // 2. Fill Buckets
    let todayP = 0, todayC = 0, todayF = 0, todayCals = 0;

    foodLogs.forEach((log) => {
      if (!log.logged_at) return;
      const d = new Date(log.logged_at);
      const k = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
        .toISOString().split("T")[0];

      const p = cleanNum(log.protein || log.nutrients?.protein);
      const c = cleanNum(log.carbs || log.nutrients?.carbs);
      const f = cleanNum(log.fat || log.nutrients?.fat);
      let cal = cleanNum(log.calories || log.nutrients?.calories);
      
      // Auto-calculate calories if missing
      if (cal === 0) cal = (p * 4) + (c * 4) + (f * 9);

      if (daysMap.has(k)) {
        daysMap.get(k)!.calories += cal;
      }

      if (k === localTodayKey) {
        todayCals += cal;
        todayP += p;
        todayC += c;
        todayF += f;
      }
    });

    // 3. Prepare Arrays
    const weeklyChartData = Array.from(daysMap.values()).map(d => ({
      day: d.label,
      calories: Math.round(d.calories)
    }));

    // Pie Data: Calories from Macros
    const pCal = todayP * 4;
    const cCal = todayC * 4;
    const fCal = todayF * 9;
    const totalMacroCals = pCal + cCal + fCal;
    const hasTodayData = totalMacroCals > 0;

    const pieData = hasTodayData 
      ? [
          { name: "Protein", value: pCal, grams: Math.round(todayP), color: "#10B981" }, // Green
          { name: "Carbs", value: cCal, grams: Math.round(todayC), color: "#F59E0B" },   // Orange
          { name: "Fat", value: fCal, grams: Math.round(todayF), color: "#8B5CF6" },     // Purple
        ]
      : [{ name: "No Data", value: 1, grams: 0, color: "#cbd5e1" }]; // Grey

    return {
      weeklyChartData,
      todayStats: { calories: Math.round(todayCals), p: Math.round(todayP), c: Math.round(todayC), f: Math.round(todayF) },
      pieData,
      hasTodayData
    };
  }, [foodLogs]);

  if (!foodLogs) return null;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      
      {/* --- CHART 1: LINE CHART --- */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {/* EXPLICIT HEIGHT STYLE IS CRITICAL HERE */}
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} 
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- CHART 2: PIE CHART --- */}
      <Card className="shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today's Macros</CardTitle>
          <div className="text-right">
             <div className="text-2xl font-bold">{todayStats.calories}</div>
             <div className="text-xs text-muted-foreground">Total kcal</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            
            {/* EXPLICIT HEIGHT STYLE IS CRITICAL HERE */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={hasTodayData ? 5 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                    {todayStats.p + todayStats.c + todayStats.f}g
                 </span>
                 <span className="text-xs text-slate-400">Total Mass</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full mt-4 space-y-2">
              {pieData.map((entry) => {
                if (entry.name === "No Data") return <div key="nd" className="text-center text-sm text-slate-400">No logs today</div>;
                return (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium text-slate-600 dark:text-slate-300">{entry.name}</span>
                    </div>
                    <span className="font-bold">{entry.grams}g</span>
                  </div>
                );
              })}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NutritionChart;