"use client";

import { useState, useEffect, useCallback } from "react";
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

interface DbClient {
  id: string;
}

interface DbNutritionPlan {
  id: string;
  name: string;
  version: string;
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number;
  water_liters: number;
  notes: string | string[] | null;
  updated_at: string;
  created_at: string;
}

interface DbNutritionAssignment {
  id: string;
  assigned_at: string;
  nutrition_plans: DbNutritionPlan | null;
}

interface DbMeal {
  id: string;
  name: string;
  time_range: string;
  order_index: number;
}

interface DbMealItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: string | null;
  calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  notes: string | null;
  order_index: number;
}

export default function NutritionPlanPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<string[]>([]);
  const [checkedMeals, setCheckedMeals] = useState<string[]>([]);

  const supabase = createClient();

  const loadNutritionPlan = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single() as { data: DbClient | null };

      if (!client) return;

      const { data: assignment } = await supabase
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
        .single() as { data: DbNutritionAssignment | null };

      if (!assignment?.nutrition_plans) {
        setLoading(false);
        return;
      }

      const nutritionPlan = assignment.nutrition_plans;

      const { data: mealsData } = await supabase
        .from("nutrition_plan_meals")
        .select("*")
        .eq("nutrition_plan_id", nutritionPlan.id)
        .order("order_index", { ascending: true }) as { data: DbMeal[] | null };

      const mealIds = mealsData?.map((m: DbMeal) => m.id) || [];
      const { data: itemsData } = await supabase
        .from("nutrition_plan_meal_items")
        .select("*")
        .in("meal_id", mealIds.length > 0 ? mealIds : ["no-meals"])
        .order("order_index", { ascending: true }) as { data: DbMealItem[] | null };

      const itemsByMeal: Record<string, MealItem[]> = {};
      (itemsData || []).forEach((item: DbMealItem) => {
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
          notes: item.notes ?? undefined,
        });
      });

      const meals: Meal[] = (mealsData || []).map((meal: DbMeal) => ({
        id: meal.id,
        name: meal.name || "Meal",
        time: meal.time_range || "",
        items: itemsByMeal[meal.id] || [],
      }));

      let notes: string[] = [];
      if (nutritionPlan.notes) {
        try {
          notes = typeof nutritionPlan.notes === "string"
            ? JSON.parse(nutritionPlan.notes)
            : Array.isArray(nutritionPlan.notes)
            ? nutritionPlan.notes
            : [];
        } catch {
          notes = [String(nutritionPlan.notes)];
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

      setExpandedMeals(meals.map(m => m.id));

    } catch (error) {
      console.error("Error loading nutrition plan:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadNutritionPlan();
  }, [loadNutritionPlan]);

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Nutrition Plan
          </h1>
        </div>

        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Nutrition Plan Assigned
          </h3>
          <p className="text-muted-foreground mb-4">
            Your coach will assign a nutrition plan soon.
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
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
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Nutrition Plan
          </h1>
          <p className="text-muted-foreground mt-1">
            {plan.name} (v{plan.version})
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Daily Targets */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">
          Daily Targets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {plan.dailyTargets.calories}
            </p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {plan.dailyTargets.protein}g
            </p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <Wheat className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {plan.dailyTargets.carbs}g
            </p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <Droplets className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {plan.dailyTargets.fat}g
            </p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Apple className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {plan.dailyTargets.fiber}g
            </p>
            <p className="text-xs text-muted-foreground">Fiber</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {plan.dailyTargets.water}L
            </p>
            <p className="text-xs text-muted-foreground">Water</p>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h2 className="font-semibold text-foreground">
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
                className={`bg-card rounded-xl border transition-colors ${
                  isChecked
                    ? "border-green-300 dark:border-green-700"
                    : "border-border"
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
                          : "border-border"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {meal.name}
                      </h3>
                      {meal.time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                      <span className="text-muted-foreground">|</span>
                      <span className="text-red-600">{totals.protein}g P</span>
                      <span className="text-primary">{totals.carbs}g C</span>
                      <span className="text-yellow-600">{totals.fat}g F</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Meal Items */}
                {isExpanded && meal.items.length > 0 && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="divide-y divide-border">
                      {meal.items.map((item, index) => (
                        <div key={index} className="py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {item.name}
                              </p>
                              {item.quantity && (
                                <p className="text-sm text-muted-foreground">{item.quantity}</p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium text-foreground">
                                {item.calories} cal
                              </p>
                              <p className="text-muted-foreground">
                                P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile totals */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">
                          Meal Total:
                        </span>
                        <span className="text-foreground">
                          {totals.calories} cal | P:{totals.protein}g C:{totals.carbs}g F:
                          {totals.fat}g
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && meal.items.length === 0 && (
                  <div className="px-4 pb-4 border-t border-border">
                    <p className="text-center text-muted-foreground py-4">
                      No items added to this meal yet.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No meals configured in this plan yet.</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {plan.notes.length > 0 && (
        <div className="bg-primary/10 rounded-xl border border-primary/20 p-6">
          <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Important Notes
          </h3>
          <ul className="space-y-2">
            {plan.notes.map((note, index) => (
              <li
                key={index}
                className="text-sm text-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-1">-</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Updated */}
      <p className="text-center text-sm text-muted-foreground">
        Plan last updated: {new Date(plan.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
