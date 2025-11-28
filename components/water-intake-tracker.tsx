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
const STREAK_KEY = "nv_water_streak_v1"; // localStorage key for streak tracking

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

  // Helper: persist to server (debounced)
  const scheduleSave = (value: number) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistWater(value);
    }, SAVE_DEBOUNCE_MS) as unknown as number;
  };

  // Optimistic save with rollback on error
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
      // rollback to previous known value
      setWaterGlasses(prevValueRef.current);
      toast({
        title: "Save failed",
        description: "Couldn't save your water intake. Reverted to last known value.",
        variant: "destructive",
      });
    }
  };

  // Load current water intake from server on mount
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
    // restore streak
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

    // keyboard shortcuts: + and - to add/remove
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update streak localStorage when goal reached
  const recordStreakIfNeeded = (value: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const raw = window.localStorage.getItem(STREAK_KEY);
      let data = { lastDate: "", streak: 0 } as { lastDate: string; streak: number };
      if (raw) data = JSON.parse(raw);
      // If already reached today, do nothing
      if (data.lastDate === today) return;
      if (value >= goal) {
        // if previous day was yesterday => increment streak, else reset to 1
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
      // ignore storage issues
      console.warn("streak save failed", err);
    }
  };

  // UI helpers
  const percentage = Math.min((waterGlasses / goal) * 100, 100);
  const isGoalReached = waterGlasses >= goal;

  // Core actions (optimistic)
  const doAction = (newValue: number, actionType: LastAction["type"]) => {
    const prev = prevValueRef.current;
    prevValueRef.current = newValue;
    setWaterGlasses(newValue);
    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), 700);

    // store last action for undo
    const action: LastAction = { type: actionType, prevValue: prev, timestamp: Date.now() };
    setLastAction(action);

    // schedule persistence
    scheduleSave(newValue);

    // show undo toast
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => {
      setLastAction(null);
      // record streak only after undo window passes
      recordStreakIfNeeded(newValue);
      undoTimer.current = null;
    }, UNDO_TIMEOUT_MS) as unknown as number;

    // Create a React element for the toast action (Undo button)
    const undoButton = (
      <button
        onClick={() => {
          // revert
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
      // pass a React element (button) as the action so toast can render it safely
      action: undoButton as unknown as React.ReactNode,
    });
  };

  const handleAdd = () => {
    // limit: allow some extra above goal (goal + 6)
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

  // explicit save button (if user wants to force save)
  const handleForceSave = () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    persistWater(waterGlasses);
  };

  // Small visual components
  const Bottle = ({ fill }: { fill: number }) => {
    // fill 0..100
    const clamped = Math.max(0, Math.min(100, fill));
    const waveY = 100 - clamped; // percent for transform
    return (
      <div className="relative w-24 h-40 md:w-28 md:h-44 flex-shrink-0">
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <div className="w-16 md:w-18 h-[86%] relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-inner bg-white/5 dark:bg-black/20">
            {/* animated liquid */}
            <motion.div
              aria-hidden
              initial={{ y: "100%" }}
              animate={{ y: `${waveY}%` }}
              transition={{ ease: "easeInOut", duration: 0.8 }}
              className={`absolute left-0 right-0 bottom-0 top-0 bg-gradient-to-t from-blue-500/90 to-blue-300/70`}
              style={{ transformOrigin: "center bottom" }}
            >
              {/* bubbles */}
              <AnimatePresence>
                {Array.from({ length: Math.max(2, Math.floor(clamped / 20)) }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.6 }}
                    animate={{ opacity: 0.9, y: -10 - (i % 3) * 8, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 3 + i * 0.6, delay: i * 0.2 }}
                    className="absolute rounded-full bg-white/60"
                    style={{ width: 8, height: 8, bottom: `${10 + i * 6}%`, left: `${10 + i * 12}%` }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        {/* Bottle outline / label */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground w-full text-center">
          <div className="text-[11px]">
            {waterGlasses}/{goal} glasses
          </div>
          <div className="text-[10px] text-gray-400">Goal: {goal}</div>
        </div>
      </div>
    );
  };

  return (
    <Card
      className={`relative overflow-hidden transition-shadow duration-300 rounded-2xl ${
        isGoalReached ? "ring-2 ring-green-300/60" : "ring-0"
      }`}
    >
      <CardHeader className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Droplet className={`h-5 w-5 ${isGoalReached ? "text-green-600" : "text-blue-600"}`} />
            <CardTitle className="text-sm font-semibold">Water Intake</CardTitle>
          </div>
          <div className="ml-2 text-xs text-muted-foreground hidden md:block">Stay hydrated — small steps matter</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground text-right">
            <div className="font-semibold">{Math.round(percentage)}%</div>
            <div className="text-[11px] text-gray-400">{streakDays ? `Streak: ${streakDays}d` : "No streak"}</div>
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
                <span>{Math.round(percentage)}% of {goal}</span>
              </div>
            </div>

            {/* BUTTONS: fixed outer box, animate inner icon only (no layout shift) */}
            <div className="flex flex-col items-center gap-2 overflow-hidden">
              {/* Add */}
              <button
                onClick={handleAdd}
                aria-label="Add glass"
                title="Add glass"
                className="flex-shrink-0 transform-gpu will-change-transform inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 shadow"
                style={{ position: "relative", overflow: "hidden" }}
              >
                <motion.span
                  initial={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  className="inline-flex items-center justify-center"
                  style={{ display: "inline-flex" }}
                >
                  <Plus className="h-4 w-4" />
                </motion.span>
              </button>

              {/* Remove */}
              <button
                onClick={handleRemove}
                aria-label="Remove glass"
                title="Remove glass"
                className="flex-shrink-0 transform-gpu will-change-transform inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-10 h-10 shadow-sm"
                style={{ position: "relative", overflow: "hidden" }}
              >
                <motion.span
                  initial={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  className="inline-flex items-center justify-center"
                  style={{ display: "inline-flex" }}
                >
                  <Minus className="h-4 w-4 text-gray-700" />
                </motion.span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button variant="ghost" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>

            <Button variant="outline" onClick={handleForceSave} className="flex items-center gap-2">
              {saving ? "Saving..." : "Save Now"}
            </Button>

            <AnimatePresence>
              {lastAction && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  onClick={() => {
                    // manual undo via small button
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
                  className="ml-auto text-white bg-black border-white inline-flex items-center gap-2 rounded-lg px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm"
                >
                  <Undo className="h-4 w-4" /> Undo
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Motivational / contextual message */}
          <div className="mt-4 text-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={Math.min(waterGlasses, goal)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className={`text-xs ${isGoalReached ? "text-green-700 font-medium" : "text-gray-600"}`}
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
