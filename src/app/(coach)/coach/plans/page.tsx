"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface NutritionPlanRow {
  id: string;
  name: string;
  description: string | null;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  meal_count: number;
  diet_type: string;
  updated_at: string;
  client_nutrition_plans: { id: string }[];
}

interface TrainingPlanRow {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  goal: string;
  plan_type: string;
  updated_at: string;
  client_training_plans: { id: string }[];
  training_plan_exercises: { id: string }[];
}

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
  X,
} from "lucide-react";

interface NutritionPlan {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  dietType: string;
  assignedClients: number;
  lastUpdated: string;
}

interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  days: number;
  goal: string;
  planType: string;
  exercises: number;
  assignedClients: number;
  lastUpdated: string;
}

type PlanType = "nutrition" | "training";

interface NutritionFormData {
  name: string;
  description: string;
  target_calories: string;
  target_protein_g: string;
  target_carbs_g: string;
  target_fat_g: string;
  meal_count: string;
  diet_type: string;
}

interface TrainingFormData {
  name: string;
  description: string;
  days_per_week: string;
  goal: string;
  plan_type: string;
}

const initialNutritionForm: NutritionFormData = {
  name: "",
  description: "",
  target_calories: "",
  target_protein_g: "",
  target_carbs_g: "",
  target_fat_g: "",
  meal_count: "5",
  diet_type: "non_vegetarian",
};

const initialTrainingForm: TrainingFormData = {
  name: "",
  description: "",
  days_per_week: "5",
  goal: "",
  plan_type: "split",
};

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<PlanType>("nutrition");
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [nutritionForm, setNutritionForm] = useState<NutritionFormData>(initialNutritionForm);
  const [trainingForm, setTrainingForm] = useState<TrainingFormData>(initialTrainingForm);
  const [saving, setSaving] = useState(false);
  const [coachData, setCoachData] = useState<{ id: string } | null>(null);

  const supabase = createClient();

  const loadPlans = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach info
      const { data: coach } = await (supabase as SupabaseClient)
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) return;
      setCoachData(coach);

      // Get nutrition plans created by this coach
      const { data: nutritionData } = await (supabase as SupabaseClient)
        .from("nutrition_plans")
        .select(`
          id,
          name,
          description,
          target_calories,
          target_protein_g,
          target_carbs_g,
          target_fat_g,
          meal_count,
          diet_type,
          updated_at,
          client_nutrition_plans(id)
        `)
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false });

      const formattedNutrition: NutritionPlan[] = ((nutritionData || []) as NutritionPlanRow[]).map((plan) => ({
        id: plan.id,
        name: plan.name || "Unnamed Plan",
        description: plan.description || "",
        calories: plan.target_calories || 0,
        protein: plan.target_protein_g || 0,
        carbs: plan.target_carbs_g || 0,
        fat: plan.target_fat_g || 0,
        meals: plan.meal_count || 4,
        dietType: plan.diet_type || "non_vegetarian",
        assignedClients: plan.client_nutrition_plans?.length || 0,
        lastUpdated: plan.updated_at,
      }));

      setNutritionPlans(formattedNutrition);

      // Get training plans created by this coach
      const { data: trainingData } = await (supabase as SupabaseClient)
        .from("training_plans")
        .select(`
          id,
          name,
          description,
          days_per_week,
          goal,
          plan_type,
          updated_at,
          client_training_plans(id),
          training_plan_exercises(id)
        `)
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false });

      const formattedTraining: TrainingPlan[] = ((trainingData || []) as TrainingPlanRow[]).map((plan) => ({
        id: plan.id,
        name: plan.name || "Unnamed Plan",
        description: plan.description || "",
        days: plan.days_per_week || 5,
        goal: plan.goal || "General Fitness",
        planType: plan.plan_type || "split",
        exercises: plan.training_plan_exercises?.length || 0,
        assignedClients: plan.client_training_plans?.length || 0,
        lastUpdated: plan.updated_at,
      }));

      setTrainingPlans(formattedTraining);

    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Open modal for creating new plan
  const handleCreatePlan = () => {
    setEditingPlanId(null);
    setNutritionForm(initialNutritionForm);
    setTrainingForm(initialTrainingForm);
    setShowModal(true);
    setShowDropdown(null);
  };

  // Open modal for editing existing plan
  const handleEditPlan = (plan: NutritionPlan | TrainingPlan) => {
    setEditingPlanId(plan.id);
    if (activeType === "nutrition") {
      const np = plan as NutritionPlan;
      setNutritionForm({
        name: np.name,
        description: np.description,
        target_calories: np.calories.toString(),
        target_protein_g: np.protein.toString(),
        target_carbs_g: np.carbs.toString(),
        target_fat_g: np.fat.toString(),
        meal_count: np.meals.toString(),
        diet_type: np.dietType,
      });
    } else {
      const tp = plan as TrainingPlan;
      setTrainingForm({
        name: tp.name,
        description: tp.description,
        days_per_week: tp.days.toString(),
        goal: tp.goal,
        plan_type: tp.planType,
      });
    }
    setShowModal(true);
    setShowDropdown(null);
  };

  // Save plan (create or update)
  const handleSavePlan = async () => {
    if (!coachData) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (activeType === "nutrition") {
        const planData = {
          name: nutritionForm.name,
          description: nutritionForm.description || null,
          target_calories: parseInt(nutritionForm.target_calories) || 0,
          target_protein_g: parseInt(nutritionForm.target_protein_g) || 0,
          target_carbs_g: parseInt(nutritionForm.target_carbs_g) || 0,
          target_fat_g: parseInt(nutritionForm.target_fat_g) || 0,
          meal_count: parseInt(nutritionForm.meal_count) || 5,
          diet_type: nutritionForm.diet_type,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        };

        if (editingPlanId) {
          await (supabase as SupabaseClient)
            .from("nutrition_plans")
            .update(planData)
            .eq("id", editingPlanId);
        } else {
          await (supabase as SupabaseClient)
            .from("nutrition_plans")
            .insert(planData);
        }
      } else {
        const planData = {
          name: trainingForm.name,
          description: trainingForm.description || null,
          days_per_week: parseInt(trainingForm.days_per_week) || 5,
          goal: trainingForm.goal || null,
          plan_type: trainingForm.plan_type,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        };

        if (editingPlanId) {
          await (supabase as SupabaseClient)
            .from("training_plans")
            .update(planData)
            .eq("id", editingPlanId);
        } else {
          await (supabase as SupabaseClient)
            .from("training_plans")
            .insert(planData);
        }
      }

      setShowModal(false);
      await loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    setShowDropdown(null);

    try {
      const table = activeType === "nutrition" ? "nutrition_plans" : "training_plans";
      await (supabase as SupabaseClient)
        .from(table)
        .delete()
        .eq("id", planId);

      await loadPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  // Duplicate plan
  const handleDuplicatePlan = async (plan: NutritionPlan | TrainingPlan) => {
    if (!coachData) return;
    setShowDropdown(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (activeType === "nutrition") {
        const np = plan as NutritionPlan;
        await (supabase as SupabaseClient)
          .from("nutrition_plans")
          .insert({
            name: `${np.name} (Copy)`,
            description: np.description || null,
            target_calories: np.calories,
            target_protein_g: np.protein,
            target_carbs_g: np.carbs,
            target_fat_g: np.fat,
            meal_count: np.meals,
            diet_type: np.dietType,
            created_by: user.id,
          });
      } else {
        const tp = plan as TrainingPlan;
        await (supabase as SupabaseClient)
          .from("training_plans")
          .insert({
            name: `${tp.name} (Copy)`,
            description: tp.description || null,
            days_per_week: tp.days,
            goal: tp.goal,
            plan_type: tp.planType,
            created_by: user.id,
          });
      }

      await loadPlans();
    } catch (error) {
      console.error("Error duplicating plan:", error);
    }
  };

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
        <Loader2 className="w-8 h-8 animate-spin text-brown-500" />
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
        <button
          onClick={handleCreatePlan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
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
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
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
                          <button
                            onClick={() => handleEditPlan(nutritionPlan)}
                            className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicatePlan(nutritionPlan)}
                            className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
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
                    className="block w-full mt-4 text-center px-4 py-2 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20 font-medium"
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
                          <button
                            onClick={() => handleEditPlan(trainingPlan)}
                            className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicatePlan(trainingPlan)}
                            className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
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
                      <span className="text-stone-500">Goal:</span>
                      <span className="ml-1 font-medium text-stone-800 dark:text-stone-200">
                        {trainingPlan.goal}
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
                    className="block w-full mt-4 text-center px-4 py-2 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20 font-medium"
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
              <button
                onClick={handleCreatePlan}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Plan
              </button>
            </>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                {editingPlanId ? "Edit" : "Create"} {activeType === "nutrition" ? "Nutrition" : "Training"} Plan
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {activeType === "nutrition" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={nutritionForm.name}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    placeholder="e.g., Weight Loss Plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={nutritionForm.description}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 resize-none"
                    rows={2}
                    placeholder="Brief description of this plan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Target Calories
                    </label>
                    <input
                      type="number"
                      value={nutritionForm.target_calories}
                      onChange={(e) => setNutritionForm({ ...nutritionForm, target_calories: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      placeholder="2000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={nutritionForm.target_protein_g}
                      onChange={(e) => setNutritionForm({ ...nutritionForm, target_protein_g: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={nutritionForm.target_carbs_g}
                      onChange={(e) => setNutritionForm({ ...nutritionForm, target_carbs_g: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={nutritionForm.target_fat_g}
                      onChange={(e) => setNutritionForm({ ...nutritionForm, target_fat_g: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Meals per Day
                    </label>
                    <select
                      value={nutritionForm.meal_count}
                      onChange={(e) => setNutritionForm({ ...nutritionForm, meal_count: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    >
                      {[3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} meals</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Diet Type
                    </label>
                    <select
                      value={nutritionForm.diet_type}
                      onChange={(e) => setNutritionForm({ ...nutritionForm, diet_type: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    >
                      <option value="non_vegetarian">Non-Vegetarian</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="eggetarian">Eggetarian</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={trainingForm.name}
                    onChange={(e) => setTrainingForm({ ...trainingForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    placeholder="e.g., Strength Building"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={trainingForm.description}
                    onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 resize-none"
                    rows={2}
                    placeholder="Brief description of this plan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Days per Week
                    </label>
                    <select
                      value={trainingForm.days_per_week}
                      onChange={(e) => setTrainingForm({ ...trainingForm, days_per_week: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    >
                      {[2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>{n} days</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Plan Type
                    </label>
                    <select
                      value={trainingForm.plan_type}
                      onChange={(e) => setTrainingForm({ ...trainingForm, plan_type: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    >
                      <option value="split">Split</option>
                      <option value="full_body">Full Body</option>
                      <option value="push_pull_legs">Push/Pull/Legs</option>
                      <option value="upper_lower">Upper/Lower</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Goal
                  </label>
                  <input
                    type="text"
                    value={trainingForm.goal}
                    onChange={(e) => setTrainingForm({ ...trainingForm, goal: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    placeholder="e.g., Build muscle, Lose fat"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving || (activeType === "nutrition" ? !nutritionForm.name : !trainingForm.name)}
                className="flex-1 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingPlanId ? "Save Changes" : "Create Plan"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
