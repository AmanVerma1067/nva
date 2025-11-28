
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Droplet, Plus, Minus, RotateCcw, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WaterIntakeProps {
  userId?: string;
  initialGlasses?: number;
  goal?: number;
}

type LastAction = { type: "add" | "remove" | "reset"; prevValue: number; timestamp: number } | null;

const SAVE_DEBOUNCE_MS = 900;
const UNDO_TIMEOUT_MS = 6000;
const STREAK_KEY = "nv_water_streak_v1";

export function WaterIntakeTracker({ userId, initialGlasses = 0, goal = 8 }: WaterIntakeProps) {
  const { toast } = useToast();
  const [waterGlasses, setWaterGlasses] = useState<number>(initialGlasses);
  const [isAnimating, setIsAnimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const saveTimer = useRef<number | null>(null);
  const undoTimer = useRef<number | null>(null);
  const prevValueRef = useRef<number>(initialGlasses);
  const mountedRef = useRef(false);

  const scheduleSave = (value: number) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistWater(value);
    }, SAVE_DEBOUNCE_MS) as unknown as number;
  };

  const persistWater = async (value: number) => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/water-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, glasses: value, userId: userId ?? undefined }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaving(false);
    } catch (err) {
      console.error("Persist water failed:", err);
      setSaving(false);
      setWaterGlasses(prevValueRef.current);
      toast({
        title: "Save failed",
        description: "Couldn't save your water intake. Reverted to last known value.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`/api/daily-nutrition?date=${today}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mountedRef.current) {
          setWaterGlasses(data.water_intake_glasses ?? initialGlasses);
          prevValueRef.current = data.water_intake_glasses ?? initialGlasses;
        }
      } catch (err) {
        console.warn("Failed to load water intake:", err);
      }
    };
    load();
    
    const saved = window.localStorage.getItem(STREAK_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const lastDate = parsed.lastDate;
        const streak = parsed.streak || 0;
        const todayStr = new Date().toISOString().split("T")[0];
        if (lastDate === todayStr) {
          setStreakDays(streak);
        } else {
          setStreakDays(streak);
        }
      } catch {
        setStreakDays(0);
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") handleAdd();
      if (e.key === "-" || e.key === "_") handleRemove();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("keydown", onKey);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
    };
  }, []);

  const recordStreakIfNeeded = (value: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const raw = window.localStorage.getItem(STREAK_KEY);
      let data = { lastDate: "", streak: 0 } as { lastDate: string; streak: number };
      if (raw) data = JSON.parse(raw);
      if (data.lastDate === today) return;
      if (value >= goal) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        if (data.lastDate === yesterdayStr) data.streak = (data.streak || 0) + 1;
        else data.streak = 1;
        data.lastDate = today;
        window.localStorage.setItem(STREAK_KEY, JSON.stringify(data));
        setStreakDays(data.streak);
        toast({
          title: "Hydration Streak",
          description: `You've kept your streak for ${data.streak} day${data.streak !== 1 ? "s" : ""}! Keep it going!`,
        });
      }
    } catch (err) {
      console.warn("streak save failed", err);
    }
  };

  const percentage = Math.min((waterGlasses / goal) * 100, 100);
  const isGoalReached = waterGlasses >= goal;

  const doAction = (newValue: number, actionType: LastAction["type"]) => {
    const prev = prevValueRef.current;
    prevValueRef.current = newValue;
    setWaterGlasses(newValue);
    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), 700);

    const action: LastAction = { type: actionType, prevValue: prev, timestamp: Date.now() };
    setLastAction(action);

    scheduleSave(newValue);

    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => {
      setLastAction(null);
      recordStreakIfNeeded(newValue);
      undoTimer.current = null;
    }, UNDO_TIMEOUT_MS) as unknown as number;

    const undoButton = (
      <button
        onClick={() => {
          if (!action) return;
          if (undoTimer.current) {
            window.clearTimeout(undoTimer.current);
            undoTimer.current = null;
          }
          setWaterGlasses(action.prevValue);
          prevValueRef.current = action.prevValue;
          setLastAction(null);
          scheduleSave(action.prevValue);
          toast({
            title: "Undone",
            description: `Reverted to ${action.prevValue} glasses.`,
          });
        }}
        className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200"
      >
        Undo
      </button>
    );

    toast({
      title: actionType === "add" ? `Added water` : actionType === "remove" ? `Removed water` : "Reset",
      description:
        actionType === "add"
          ? `${newValue}/${goal} glasses`
          : actionType === "remove"
          ? `${newValue}/${goal} glasses`
          : "All water reset",
      action: undoButton as unknown as React.ReactNode,
    });
  };

  const handleAdd = () => {
    const max = goal + 6;
    if (waterGlasses >= max) {
      toast({ title: "Limit reached", description: `You've reached the maximum tracked intake (${max}).` });
      return;
    }
    doAction(waterGlasses + 1, "add");
  };

  const handleRemove = () => {
    if (waterGlasses <= 0) {
      toast({ title: "Nothing to remove", description: "Water glasses already at 0." });
      return;
    }
    doAction(waterGlasses - 1, "remove");
  };

  const handleReset = () => {
    doAction(0, "reset");
  };

  const handleForceSave = () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    persistWater(waterGlasses);
  };

  const Bottle = ({ fill }: { fill: number }) => {
    const clamped = Math.max(0, Math.min(100, fill));
    const waveY = 100 - clamped;
    return (
      <div className="relative w-28 h-48 flex-shrink-0 flex flex-col items-center">
        <div className="w-20 h-36 relative rounded-2xl overflow-hidden border-2 border-blue-200 dark:border-blue-700 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          {/* Animated liquid with smoother transition */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{ y: `${waveY}%` }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 0.8
            }}
            className="absolute left-0 right-0 bottom-0 top-0 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300"
            style={{ transformOrigin: "center bottom" }}
          >
            {/* Smoother bubbles animation */}
            <AnimatePresence>
              {Array.from({ length: Math.max(3, Math.floor(clamped / 15)) }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    y: [-20, -60],
                    scale: [0.6, 1, 0.8]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2.5 + i * 0.4,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                  className="absolute rounded-full bg-white/70"
                  style={{ 
                    width: 6 + (i % 2) * 2, 
                    height: 6 + (i % 2) * 2, 
                    bottom: `${5 + (i % 3) * 3}%`, 
                    left: `${15 + i * 15}%` 
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Fixed text overflow issue with better spacing and truncation */}
        <div className="mt-3 text-center w-full px-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {waterGlasses}/{goal}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Goal: {goal} glasses
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-500 rounded-2xl ${
        isGoalReached ? "ring-2 ring-green-400/60 shadow-lg shadow-green-100/50" : "ring-0"
      }`}
    >
      <CardHeader className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isAnimating ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Droplet className={`h-5 w-5 ${isGoalReached ? "text-green-600" : "text-blue-600"}`} />
            </motion.div>
            <CardTitle className="text-sm font-semibold">Water Intake</CardTitle>
          </div>
          <div className="ml-2 text-xs text-muted-foreground hidden md:block">Stay hydrated — small steps matter</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground text-right">
            <div className="font-semibold">{Math.round(percentage)}%</div>
            <div className="text-[11px] text-gray-400">{streakDays ? `🔥 ${streakDays}d` : "No streak"}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Left: Bottle visual */}
        <div className="flex items-center justify-center md:justify-start">
          <Bottle fill={percentage} />
        </div>

        {/* Right: Controls & progress */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 pr-4">
              <Progress value={percentage} className="h-3 rounded-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{waterGlasses} glasses</span>
                <span>{Math.round(percentage)}%</span>
              </div>
            </div>

            {/* Smoother button animations */}
            <div className="flex flex-col items-center gap-2">
              <motion.button
                onClick={handleAdd}
                aria-label="Add glass"
                title="Add glass"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 shadow-md hover:shadow-lg transition-shadow"
              >
                <Plus className="h-4 w-4" />
              </motion.button>

              <motion.button
                onClick={handleRemove}
                aria-label="Remove glass"
                title="Remove glass"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="flex-shrink-0 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 w-10 h-10 shadow-sm hover:shadow-md transition-shadow"
              >
                <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <Button variant="ghost" onClick={handleReset} className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>

            <Button variant="outline" onClick={handleForceSave} className="flex items-center gap-2 text-sm" disabled={saving}>
              {saving ? "Saving..." : "Save Now"}
            </Button>

            <AnimatePresence>
              {lastAction && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={() => {
                    setWaterGlasses(lastAction.prevValue);
                    prevValueRef.current = lastAction.prevValue;
                    scheduleSave(lastAction.prevValue);
                    setLastAction(null);
                    toast({ title: "Undone", description: `Reverted to ${lastAction.prevValue} glasses.` });
                    if (undoTimer.current) {
                      window.clearTimeout(undoTimer.current);
                      undoTimer.current = null;
                    }
                  }}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  <Undo className="h-4 w-4" /> Undo
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Motivational message with smoother transitions */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={Math.min(waterGlasses, goal)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`text-xs ${isGoalReached ? "text-green-700 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}
              >
                {isGoalReached
                  ? "🎉 Goal hit — excellent hydration!"
                  : waterGlasses === 0
                  ? "💧 Start drinking water — small sips count."
                  : waterGlasses < goal / 2
                  ? "🌊 Good start — keep sipping throughout the day."
                  : "💪 Halfway or more — you're on track!"}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WaterIntakeTracker;