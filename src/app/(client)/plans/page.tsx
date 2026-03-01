"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Utensils,
  Dumbbell,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Download,
  Clock,
  Loader2,
} from "lucide-react";

interface NutritionPlan {
  name: string;
  version: string;
  lastUpdated: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  compliance: number;
}

interface TrainingPlan {
  name: string;
  version: string;
  lastUpdated: string;
  daysPerWeek: number;
  focus: string;
  exercises: number;
  compliance: number;
}

interface DbClient {
  id: string;
}

interface DbNutritionPlanData {
  id: string;
  name: string;
  version: string;
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  meals_per_day: number;
  updated_at: string;
}

interface DbNutritionAssignment {
  id: string;
  assigned_at: string;
  nutrition_plans: DbNutritionPlanData | null;
}

interface DbTrainingPlanData {
  id: string;
  name: string;
  version: string;
  days_per_week: number;
  focus: string;
  updated_at: string;
}

interface DbTrainingAssignment {
  id: string;
  assigned_at: string;
  training_plans: DbTrainingPlanData | null;
}

interface DbCheckin {
  id: string;
}

interface DbTrainingSession {
  id: string;
}

interface DbExercise {
  id: string;
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);

  const supabase = createClient();

  const loadPlans = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single() as { data: DbClient | null };

      if (!client) return;

      const { data: nutritionAssignment } = await supabase
        .from("client_nutrition_plans")
        .select(`
          id,
          assigned_at,
          nutrition_plans(
            id,
            name,
            version,
            daily_calories,
            protein_grams,
            carbs_grams,
            fat_grams,
            meals_per_day,
            updated_at
          )
        `)
        .eq("client_id", client.id)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .single() as { data: DbNutritionAssignment | null };

      const { data: trainingAssignment } = await supabase
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
            updated_at
          )
        `)
        .eq("client_id", client.id)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .single() as { data: DbTrainingAssignment | null };

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentCheckins } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("client_id", client.id)
        .gte("created_at", sevenDaysAgo.toISOString()) as { data: DbCheckin[] | null };

      const weeklyCompliance = Math.round(((recentCheckins?.length || 0) / 7) * 100);

      const { data: trainingSessions } = await supabase
        .from("checkin_training")
        .select("id, daily_checkins!inner(client_id, created_at)")
        .eq("daily_checkins.client_id", client.id)
        .gte("daily_checkins.created_at", sevenDaysAgo.toISOString()) as { data: DbTrainingSession[] | null };

      const daysPerWeek = trainingAssignment?.training_plans?.days_per_week || 5;
      const trainingCompliance = Math.round(((trainingSessions?.length || 0) / daysPerWeek) * 100);

      let exerciseCount = 0;
      if (trainingAssignment?.training_plans?.id) {
        const { data: exercises } = await supabase
          .from("training_plan_exercises")
          .select("id")
          .eq("training_plan_id", trainingAssignment.training_plans.id) as { data: DbExercise[] | null };
        exerciseCount = exercises?.length || 0;
      }

      if (nutritionAssignment?.nutrition_plans) {
        const np = nutritionAssignment.nutrition_plans;
        setNutritionPlan({
          name: np.name || "Custom Nutrition Plan",
          version: np.version || "1.0",
          lastUpdated: np.updated_at || nutritionAssignment.assigned_at,
          calories: np.daily_calories || 2000,
          protein: np.protein_grams || 150,
          carbs: np.carbs_grams || 200,
          fat: np.fat_grams || 65,
          meals: np.meals_per_day || 4,
          compliance: Math.min(weeklyCompliance, 100),
        });
      }

      if (trainingAssignment?.training_plans) {
        const tp = trainingAssignment.training_plans;
        setTrainingPlan({
          name: tp.name || "Custom Training Plan",
          version: tp.version || "1.0",
          lastUpdated: tp.updated_at || trainingAssignment.assigned_at,
          daysPerWeek: tp.days_per_week || 5,
          focus: tp.focus || "General Fitness",
          exercises: exerciseCount,
          compliance: Math.min(trainingCompliance, 100),
        });
      }

    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          My Plans
        </h1>
        <p className="text-muted-foreground mt-1">
          Your personalized nutrition and training programs
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Nutrition Plan */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Utensils className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    Nutrition Plan
                  </h2>
                  {nutritionPlan && (
                    <p className="text-sm text-muted-foreground">
                      v{nutritionPlan.version}
                    </p>
                  )}
                </div>
              </div>
              {nutritionPlan ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 rounded-full">
                  Not Assigned
                </span>
              )}
            </div>

            {nutritionPlan ? (
              <>
                <p className="text-lg font-medium text-foreground mb-4">
                  {nutritionPlan.name}
                </p>

                {/* Macros */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-primary">
                      {nutritionPlan.calories}
                    </p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {nutritionPlan.protein}g
                    </p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {nutritionPlan.carbs}g
                    </p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {nutritionPlan.fat}g
                    </p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {nutritionPlan.meals} meals/day
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Updated {formatDate(nutritionPlan.lastUpdated)}
                  </span>
                </div>

                {/* Compliance */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Weekly Compliance</span>
                    <span className="font-medium text-green-600">
                      {nutritionPlan.compliance}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${nutritionPlan.compliance}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No nutrition plan assigned yet.</p>
                <p className="text-sm mt-1">Your coach will assign a plan soon.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href="/plans/nutrition"
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  nutritionPlan
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                View Plan
                <ChevronRight className="w-4 h-4" />
              </Link>
              {nutritionPlan && (
                <button className="p-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted">
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Training Plan */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    Training Plan
                  </h2>
                  {trainingPlan && (
                    <p className="text-sm text-muted-foreground">
                      v{trainingPlan.version}
                    </p>
                  )}
                </div>
              </div>
              {trainingPlan ? (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  Not Assigned
                </span>
              )}
            </div>

            {trainingPlan ? (
              <>
                <p className="text-lg font-medium text-foreground mb-4">
                  {trainingPlan.name}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {trainingPlan.daysPerWeek}
                    </p>
                    <p className="text-xs text-muted-foreground">Days/Week</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-primary">
                      {trainingPlan.focus}
                    </p>
                    <p className="text-xs text-muted-foreground">Focus</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {trainingPlan.exercises}
                    </p>
                    <p className="text-xs text-muted-foreground">Exercises</p>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {trainingPlan.exercises} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Updated {formatDate(trainingPlan.lastUpdated)}
                  </span>
                </div>

                {/* Compliance */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Weekly Compliance</span>
                    <span className="font-medium text-purple-600">
                      {trainingPlan.compliance}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${trainingPlan.compliance}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No training plan assigned yet.</p>
                <p className="text-sm mt-1">Your coach will assign a plan soon.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href="/plans/training"
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  trainingPlan
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                View Plan
                <ChevronRight className="w-4 h-4" />
              </Link>
              {trainingPlan && (
                <button className="p-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted">
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Plan Tips
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>Check your plans daily to stay on track with your goals</li>
          <li>Use the checkboxes in your nutrition plan to track meals</li>
          <li>Log your training sessions to maintain compliance</li>
          <li>Download plans for offline access during workouts</li>
        </ul>
      </div>
    </div>
  );
}
