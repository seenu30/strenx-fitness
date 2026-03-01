"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Plus,
  Search,
  Utensils,
  Dumbbell,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";

interface NutritionPlan {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  assignedClients: number;
  lastUpdated: string;
  version: string;
}

interface TrainingPlan {
  id: string;
  name: string;
  days: number;
  focus: string;
  exercises: number;
  assignedClients: number;
  lastUpdated: string;
  version: string;
}

type PlanType = "nutrition" | "training";

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<PlanType>("nutrition");
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach info
      const { data: coach } = await (supabase as any)
        .from("coaches")
        .select("id, tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!coach) return;

      // Get nutrition plans
      const { data: nutritionData } = await (supabase as any)
        .from("nutrition_plans")
        .select(`
          id,
          name,
          version,
          daily_calories,
          protein_grams,
          carbs_grams,
          fat_grams,
          meals_per_day,
          updated_at,
          client_nutrition_plans(id)
        `)
        .eq("tenant_id", coach.tenant_id)
        .order("updated_at", { ascending: false });

      const formattedNutrition: NutritionPlan[] = (nutritionData || []).map((plan: any) => ({
        id: plan.id,
        name: plan.name || "Unnamed Plan",
        calories: plan.daily_calories || 0,
        protein: plan.protein_grams || 0,
        carbs: plan.carbs_grams || 0,
        fat: plan.fat_grams || 0,
        meals: plan.meals_per_day || 4,
        assignedClients: plan.client_nutrition_plans?.length || 0,
        lastUpdated: plan.updated_at,
        version: plan.version || "1.0",
      }));

      setNutritionPlans(formattedNutrition);

      // Get training plans
      const { data: trainingData } = await (supabase as any)
        .from("training_plans")
        .select(`
          id,
          name,
          version,
          days_per_week,
          focus,
          updated_at,
          client_training_plans(id),
          training_plan_exercises(id)
        `)
        .eq("tenant_id", coach.tenant_id)
        .order("updated_at", { ascending: false });

      const formattedTraining: TrainingPlan[] = (trainingData || []).map((plan: any) => ({
        id: plan.id,
        name: plan.name || "Unnamed Plan",
        days: plan.days_per_week || 5,
        focus: plan.focus || "General",
        exercises: plan.training_plan_exercises?.length || 0,
        assignedClients: plan.client_training_plans?.length || 0,
        lastUpdated: plan.updated_at,
        version: plan.version || "1.0",
      }));

      setTrainingPlans(formattedTraining);

    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredPlans =
    activeType === "nutrition"
      ? nutritionPlans.filter((plan) =>
          plan.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : trainingPlans.filter((plan) =>
          plan.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Plan Templates
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Create and manage nutrition and training plan templates
          </p>
        </div>
        <Link
          href="/admin/plans/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Link>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveType("nutrition")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            activeType === "nutrition"
              ? "bg-green-600 text-white"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
          }`}
        >
          <Utensils className="w-4 h-4" />
          Nutrition Plans ({nutritionPlans.length})
        </button>
        <button
          onClick={() => setActiveType("training")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            activeType === "training"
              ? "bg-purple-600 text-white"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Training Plans ({trainingPlans.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search plans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Plans Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeType === "nutrition"
          ? filteredPlans.map((plan) => {
              const nutritionPlan = plan as NutritionPlan;
              return (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Utensils className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowDropdown(showDropdown === plan.id ? null : plan.id)
                        }
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-stone-400" />
                      </button>
                      {showDropdown === plan.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-10">
                          <button className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">
                    {nutritionPlan.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm">
                      <span className="text-stone-500">Calories:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {nutritionPlan.calories}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-stone-500">Protein:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {nutritionPlan.protein}g
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-stone-500">Carbs:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {nutritionPlan.carbs}g
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-stone-500">Fat:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {nutritionPlan.fat}g
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Users className="w-4 h-4" />
                      {nutritionPlan.assignedClients} clients
                    </div>
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(nutritionPlan.lastUpdated)}
                    </div>
                  </div>

                  <Link
                    href={`/admin/plans/nutrition/${plan.id}`}
                    className="block w-full mt-4 text-center px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              );
            })
          : filteredPlans.map((plan) => {
              const trainingPlan = plan as TrainingPlan;
              return (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowDropdown(showDropdown === plan.id ? null : plan.id)
                        }
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-stone-400" />
                      </button>
                      {showDropdown === plan.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-10">
                          <button className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">
                    {trainingPlan.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm">
                      <span className="text-stone-500">Days/Week:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {trainingPlan.days}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-stone-500">Focus:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {trainingPlan.focus}
                      </span>
                    </div>
                    <div className="text-sm col-span-2">
                      <span className="text-stone-500">Exercises:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {trainingPlan.exercises} total
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Users className="w-4 h-4" />
                      {trainingPlan.assignedClients} clients
                    </div>
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(trainingPlan.lastUpdated)}
                    </div>
                  </div>

                  <Link
                    href={`/admin/plans/training/${plan.id}`}
                    className="block w-full mt-4 text-center px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              );
            })}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
          {searchQuery ? (
            <p className="text-stone-500">No plans found matching your search.</p>
          ) : (
            <>
              <p className="text-stone-500 mb-4">No {activeType} plans created yet.</p>
              <Link
                href="/admin/plans/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Plan
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
