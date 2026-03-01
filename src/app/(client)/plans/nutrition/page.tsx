"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  UtensilsCrossed,
  Clock,
  Flame,
  Apple,
  Beef,
  Wheat,
  Droplets,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  CheckCircle2,
  ChevronLeft,
  Loader2,
} from "lucide-react";

interface MealItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
}

interface NutritionPlan {
  name: string;
  version: string;
  updatedAt: string;
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    water: number;
  };
  meals: Meal[];
  notes: string[];
}

export default function NutritionPlanPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<string[]>([]);
  const [checkedMeals, setCheckedMeals] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadNutritionPlan();
  }, []);

  async function loadNutritionPlan() {
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

      // Get assigned nutrition plan
      const { data: assignment } = await (supabase as any)
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
            fiber_grams,
            water_liters,
            notes,
            updated_at,
            created_at
          )
        `)
        .eq("client_id", client.id)
        .eq("is_active", true)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .single();

      if (!assignment?.nutrition_plans) {
        setLoading(false);
        return;
      }

      const nutritionPlan = assignment.nutrition_plans;

      // Get meals for this plan
      const { data: mealsData } = await (supabase as any)
        .from("nutrition_plan_meals")
        .select("*")
        .eq("nutrition_plan_id", nutritionPlan.id)
        .order("order_index", { ascending: true });

      // Get meal items for all meals
      const mealIds = mealsData?.map((m: any) => m.id) || [];
      const { data: itemsData } = await (supabase as any)
        .from("nutrition_plan_meal_items")
        .select("*")
        .in("meal_id", mealIds.length > 0 ? mealIds : ["no-meals"])
        .order("order_index", { ascending: true });

      // Group items by meal
      const itemsByMeal: Record<string, MealItem[]> = {};
      (itemsData || []).forEach((item: any) => {
        if (!itemsByMeal[item.meal_id]) {
          itemsByMeal[item.meal_id] = [];
        }
        itemsByMeal[item.meal_id].push({
          name: item.name,
          quantity: item.quantity || "",
          calories: item.calories || 0,
          protein: item.protein_grams || 0,
          carbs: item.carbs_grams || 0,
          fat: item.fat_grams || 0,
          notes: item.notes,
        });
      });

      // Build meals array
      const meals: Meal[] = (mealsData || []).map((meal: any) => ({
        id: meal.id,
        name: meal.name || "Meal",
        time: meal.time_range || "",
        items: itemsByMeal[meal.id] || [],
      }));

      // Parse notes from JSON or string
      let notes: string[] = [];
      if (nutritionPlan.notes) {
        try {
          notes = typeof nutritionPlan.notes === "string"
            ? JSON.parse(nutritionPlan.notes)
            : Array.isArray(nutritionPlan.notes)
            ? nutritionPlan.notes
            : [];
        } catch {
          notes = [nutritionPlan.notes];
        }
      }

      setPlan({
        name: nutritionPlan.name || "Nutrition Plan",
        version: nutritionPlan.version || "1.0",
        updatedAt: nutritionPlan.updated_at || nutritionPlan.created_at,
        dailyTargets: {
          calories: nutritionPlan.daily_calories || 2000,
          protein: nutritionPlan.protein_grams || 150,
          carbs: nutritionPlan.carbs_grams || 200,
          fat: nutritionPlan.fat_grams || 65,
          fiber: nutritionPlan.fiber_grams || 30,
          water: nutritionPlan.water_liters || 3,
        },
        meals: meals,
        notes: notes.length > 0 ? notes : [
          "Drink at least 3 liters of water throughout the day",
          "Avoid processed foods and added sugars",
          "Eat slowly and mindfully",
        ],
      });

      // Expand all meals by default
      setExpandedMeals(meals.map(m => m.id));

    } catch (error) {
      console.error("Error loading nutrition plan:", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleMeal = (id: string) => {
    setExpandedMeals((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleMealChecked = (id: string) => {
    setCheckedMeals((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const calculateMealTotals = (items: MealItem[]) => {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Nutrition Plan
          </h1>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">
            No Nutrition Plan Assigned
          </h3>
          <p className="text-stone-500 mb-4">
            Your coach will assign a nutrition plan soon.
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
    <div className="max-w-3xl mx-auto space-y-6">
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
            Nutrition Plan
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

      {/* Daily Targets */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          Daily Targets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {plan.dailyTargets.calories}
            </p>
            <p className="text-xs text-stone-500">Calories</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {plan.dailyTargets.protein}g
            </p>
            <p className="text-xs text-stone-500">Protein</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {plan.dailyTargets.carbs}g
            </p>
            <p className="text-xs text-stone-500">Carbs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <Droplets className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {plan.dailyTargets.fat}g
            </p>
            <p className="text-xs text-stone-500">Fat</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Apple className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {plan.dailyTargets.fiber}g
            </p>
            <p className="text-xs text-stone-500">Fiber</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {plan.dailyTargets.water}L
            </p>
            <p className="text-xs text-stone-500">Water</p>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100">
          Your Meals
        </h2>

        {plan.meals.length > 0 ? (
          plan.meals.map((meal) => {
            const isExpanded = expandedMeals.includes(meal.id);
            const isChecked = checkedMeals.includes(meal.id);
            const totals = calculateMealTotals(meal.items);

            return (
              <div
                key={meal.id}
                className={`bg-white dark:bg-stone-900 rounded-xl border transition-colors ${
                  isChecked
                    ? "border-green-300 dark:border-green-700"
                    : "border-stone-200 dark:border-stone-800"
                }`}
              >
                {/* Meal Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleMeal(meal.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMealChecked(meal.id);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isChecked
                          ? "bg-green-500 border-green-500"
                          : "border-stone-300 dark:border-stone-600"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                        {meal.name}
                      </h3>
                      {meal.time && (
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Clock className="w-3 h-3" />
                          {meal.time}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-sm">
                      <span className="text-orange-600 font-medium">
                        {totals.calories} cal
                      </span>
                      <span className="text-stone-400">|</span>
                      <span className="text-red-600">{totals.protein}g P</span>
                      <span className="text-amber-600">{totals.carbs}g C</span>
                      <span className="text-yellow-600">{totals.fat}g F</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Meal Items */}
                {isExpanded && meal.items.length > 0 && (
                  <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-800">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {meal.items.map((item, index) => (
                        <div key={index} className="py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-stone-800 dark:text-stone-200">
                                {item.name}
                              </p>
                              {item.quantity && (
                                <p className="text-sm text-stone-500">{item.quantity}</p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium text-stone-700 dark:text-stone-300">
                                {item.calories} cal
                              </p>
                              <p className="text-stone-500">
                                P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile totals */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-stone-600 dark:text-stone-400">
                          Meal Total:
                        </span>
                        <span className="text-stone-800 dark:text-stone-200">
                          {totals.calories} cal | P:{totals.protein}g C:{totals.carbs}g F:
                          {totals.fat}g
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && meal.items.length === 0 && (
                  <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-800">
                    <p className="text-center text-stone-500 py-4">
                      No items added to this meal yet.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
            <p className="text-stone-500">No meals configured in this plan yet.</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {plan.notes.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Important Notes
          </h3>
          <ul className="space-y-2">
            {plan.notes.map((note, index) => (
              <li
                key={index}
                className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
              >
                <span className="text-amber-500 mt-1">-</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Updated */}
      <p className="text-center text-sm text-stone-500">
        Plan last updated: {new Date(plan.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
