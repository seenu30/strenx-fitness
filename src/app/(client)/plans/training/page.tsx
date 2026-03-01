"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Dumbbell,
  Clock,
  Flame,
  Play,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  CheckCircle2,
  Timer,
  RotateCcw,
  ChevronLeft,
  Loader2,
} from "lucide-react";

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  videoUrl?: string;
}

interface TrainingDay {
  id: string;
  dayNumber: number;
  name: string;
  duration: string;
  exercises: Exercise[];
  isRestDay?: boolean;
  notes?: string;
}

interface TrainingPlan {
  name: string;
  version: string;
  updatedAt: string;
  weeklySchedule: {
    daysPerWeek: number;
    restDays: string[];
  };
  days: TrainingDay[];
}

export default function TrainingPlanPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadTrainingPlan();
  }, []);

  async function loadTrainingPlan() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client info
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) return;

      // Get assigned training plan
      const { data: assignment } = await (supabase as any)
        .from("client_training_plans")
        .select(`
          id,
          assigned_at,
          training_plans(
            id,
            name,
            version,
            days_per_week,
            focus,
            updated_at,
            created_at
          )
        `)
        .eq("client_id", client.id)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .single();

      if (!assignment?.training_plans) {
        setLoading(false);
        return;
      }

      const trainingPlan = assignment.training_plans;

      // Get training days
      const { data: daysData } = await (supabase as any)
        .from("training_plan_days")
        .select("*")
        .eq("training_plan_id", trainingPlan.id)
        .order("day_number", { ascending: true });

      // Get exercises for all days
      const dayIds = daysData?.map((d: any) => d.id) || [];
      const { data: exercisesData } = await (supabase as any)
        .from("training_plan_exercises")
        .select("*")
        .in("training_day_id", dayIds.length > 0 ? dayIds : ["no-days"])
        .order("order_index", { ascending: true });

      // Group exercises by day
      const exercisesByDay: Record<string, Exercise[]> = {};
      (exercisesData || []).forEach((ex: any) => {
        if (!exercisesByDay[ex.training_day_id]) {
          exercisesByDay[ex.training_day_id] = [];
        }
        exercisesByDay[ex.training_day_id].push({
          name: ex.name,
          sets: ex.sets?.toString() || "3",
          reps: ex.reps || "10-12",
          rest: ex.rest_seconds ? `${ex.rest_seconds} sec` : "60 sec",
          notes: ex.notes || "",
          videoUrl: ex.video_url,
        });
      });

      // Build days array (fill in 7 days if needed)
      const days: TrainingDay[] = [];
      const existingDays = daysData || [];

      for (let i = 1; i <= 7; i++) {
        const existingDay = existingDays.find((d: any) => d.day_number === i);
        if (existingDay) {
          const exercises = exercisesByDay[existingDay.id] || [];
          const duration = exercises.length > 0 ? `${exercises.length * 8 + 10} min` : "0 min";

          days.push({
            id: existingDay.id,
            dayNumber: i,
            name: existingDay.name || `Day ${i}`,
            duration: existingDay.is_rest_day ? "0 min" : duration,
            exercises: exercises,
            isRestDay: existingDay.is_rest_day || false,
            notes: existingDay.notes || (existingDay.is_rest_day ? "Rest and recovery day" : ""),
          });
        } else {
          // Create placeholder for missing days
          days.push({
            id: `placeholder-${i}`,
            dayNumber: i,
            name: "Rest Day",
            duration: "0 min",
            exercises: [],
            isRestDay: true,
            notes: "Rest and recovery day",
          });
        }
      }

      // Count rest days
      const restDays = days.filter(d => d.isRestDay).map(d => {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return dayNames[d.dayNumber % 7];
      });

      setPlan({
        name: trainingPlan.name || "Training Plan",
        version: trainingPlan.version || "1.0",
        updatedAt: trainingPlan.updated_at || trainingPlan.created_at,
        weeklySchedule: {
          daysPerWeek: trainingPlan.days_per_week || (7 - restDays.length),
          restDays: restDays,
        },
        days: days,
      });

      if (days.length > 0) {
        setSelectedDay(days[0].id);
      }

    } catch (error) {
      console.error("Error loading training plan:", error);
    } finally {
      setLoading(false);
    }
  }

  const currentDay = plan?.days.find((d) => d.id === selectedDay);

  const toggleExerciseComplete = (exerciseName: string) => {
    setCompletedExercises((prev) =>
      prev.includes(exerciseName)
        ? prev.filter((e) => e !== exerciseName)
        : [...prev, exerciseName]
    );
  };

  const toggleExerciseExpand = (exerciseName: string) => {
    setExpandedExercises((prev) =>
      prev.includes(exerciseName)
        ? prev.filter((e) => e !== exerciseName)
        : [...prev, exerciseName]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Training Plan
          </h1>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">
            No Training Plan Assigned
          </h3>
          <p className="text-stone-500 mb-4">
            Your coach will assign a training plan soon.
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            Contact Coach
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Training Plan
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {plan.name} (v{plan.version})
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">
            Weekly Schedule
          </h2>
          <span className="text-sm text-stone-500">
            {plan.weeklySchedule.daysPerWeek} training days / week
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {plan.days.map((day) => {
            const isSelected = day.id === selectedDay;
            const isRestDay = day.isRestDay;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  isSelected
                    ? "bg-amber-600 text-white"
                    : isRestDay
                    ? "bg-stone-100 dark:bg-stone-800 text-stone-500"
                    : "bg-stone-50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                }`}
              >
                <p className="text-xs font-medium">Day {day.dayNumber}</p>
                <p className="text-xs truncate mt-1">
                  {isRestDay ? "Rest" : day.name.split("(")[0].trim().substring(0, 10)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {currentDay && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
          {/* Day Header */}
          <div className="p-6 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                  Day {currentDay.dayNumber}: {currentDay.name}
                </h2>
                {currentDay.isRestDay ? (
                  <p className="text-stone-600 dark:text-stone-400 mt-1">
                    {currentDay.notes}
                  </p>
                ) : (
                  <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentDay.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {currentDay.exercises.length} exercises
                    </span>
                  </div>
                )}
              </div>
              {currentDay.isRestDay ? (
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-600" />
                </div>
              )}
            </div>
          </div>

          {/* Exercises */}
          {currentDay.isRestDay ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                Rest & Recovery
              </h3>
              <p className="text-stone-600 dark:text-stone-400 mt-2 max-w-md mx-auto">
                {currentDay.notes || "Take time to rest, stretch, and recover."}
              </p>
            </div>
          ) : currentDay.exercises.length > 0 ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {currentDay.exercises.map((exercise, index) => {
                const isCompleted = completedExercises.includes(exercise.name);
                const isExpanded = expandedExercises.includes(exercise.name);

                return (
                  <div key={index} className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleExerciseComplete(exercise.name)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isCompleted
                            ? "bg-green-500 border-green-500"
                            : "border-stone-300 dark:border-stone-600 hover:border-green-500"
                        }`}
                      >
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        )}
                      </button>

                      {/* Exercise Details */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => toggleExerciseExpand(exercise.name)}
                      >
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-medium ${
                              isCompleted
                                ? "text-stone-400 line-through"
                                : "text-stone-800 dark:text-stone-100"
                            }`}
                          >
                            {exercise.name}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            {exercise.sets} sets
                          </span>
                          <span>x</span>
                          <span>{exercise.reps} reps</span>
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {exercise.rest}
                          </span>
                        </div>
                      </div>

                      {/* Video Button */}
                      {exercise.videoUrl && (
                        <a
                          href={exercise.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                        </a>
                      )}
                    </div>

                    {/* Expanded Notes */}
                    {isExpanded && exercise.notes && (
                      <div className="mt-3 ml-12 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {exercise.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-stone-500">
              No exercises added for this day yet.
            </div>
          )}
        </div>
      )}

      {/* Progress Summary */}
      {currentDay && !currentDay.isRestDay && currentDay.exercises.length > 0 && (
        <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Today&apos;s Progress
            </p>
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {completedExercises.length} / {currentDay.exercises.length} exercises
            </p>
          </div>
          <div className="w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-stone-300 dark:text-stone-600"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${
                  (completedExercises.length / currentDay.exercises.length) * 100
                }, 100`}
                className="text-green-500"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <p className="text-center text-sm text-stone-500">
        Plan last updated: {new Date(plan.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
