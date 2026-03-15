"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  FileText,
  User,
  Calendar,
  Target,
  Utensils,
  Dumbbell,
  Pill,
  Heart,
  Coffee,
  Moon,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Award,
} from "lucide-react";
import type { TransformationPlanSectionType } from "@/types/transformation-plan";

interface PlanSection {
  id: string;
  section_type: TransformationPlanSectionType;
  title: string | null;
  content: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
}

interface PlanDetails {
  id: string;
  plan_name: string;
  phase: string | null;
  duration_weeks: number;
  status: string;
  published_at: string | null;
  sections: PlanSection[];
  coach?: {
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  } | null;
}

const sectionIcons: Record<string, React.ReactNode> = {
  header: <FileText className="w-5 h-5" />,
  blood_report_strategy: <Heart className="w-5 h-5" />,
  daily_macros: <Target className="w-5 h-5" />,
  meal_timing: <Clock className="w-5 h-5" />,
  morning_drinks: <Coffee className="w-5 h-5" />,
  bedtime_drink: <Moon className="w-5 h-5" />,
  meal_plan: <Utensils className="w-5 h-5" />,
  snack_ideas: <Utensils className="w-5 h-5" />,
  supplements: <Pill className="w-5 h-5" />,
  training_program: <Dumbbell className="w-5 h-5" />,
  progression_strategy: <Target className="w-5 h-5" />,
  recovery_rules: <Heart className="w-5 h-5" />,
  checkin_protocol: <Calendar className="w-5 h-5" />,
  coach_credentials: <Award className="w-5 h-5" />,
};

const sectionLabels: Record<string, string> = {
  header: "Overview",
  blood_report_strategy: "Blood Report Strategy",
  daily_macros: "Daily Macros",
  meal_timing: "Meal Schedule",
  morning_drinks: "Morning Drinks",
  bedtime_drink: "Bedtime Drink",
  meal_plan: "Meal Plan",
  snack_ideas: "Snack Ideas",
  supplements: "Supplements",
  training_program: "Training Program",
  progression_strategy: "Progression Strategy",
  recovery_rules: "Recovery Guidelines",
  checkin_protocol: "Check-in Protocol",
  coach_credentials: "Your Coach",
};

export default function ClientTransformationPlanPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    try {
      const response = await fetch("/api/transformation-plans");
      const data = await response.json();

      if (data.success && data.plans && data.plans.length > 0) {
        // Get the most recent published plan
        const publishedPlans = data.plans.filter((p: PlanDetails) => p.status === "published");
        if (publishedPlans.length > 0) {
          // Fetch full plan details
          const planResponse = await fetch(`/api/transformation-plans/${publishedPlans[0].id}`);
          const planData = await planResponse.json();

          if (planData.success && planData.plan) {
            setPlan(planData.plan);
            // Expand all sections by default
            const sectionIds = (planData.plan.sections || []).map((s: PlanSection) => s.id);
            setExpandedSections(new Set(sectionIds));
            if (sectionIds.length > 0) {
              setActiveSection(sectionIds[0]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading transformation plan:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
    setActiveSection(sectionId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCoachName = () => {
    if (!plan?.coach?.users) return "Your Coach";
    const { first_name, last_name } = plan.coach.users;
    return `${first_name || ""} ${last_name || ""}`.trim() || "Your Coach";
  };

  const renderSectionContent = (section: PlanSection) => {
    const content = section.content;

    // Render based on section type
    switch (section.section_type) {
      case "header":
        return renderHeaderSection(content);
      case "daily_macros":
        return renderMacrosSection(content);
      case "meal_timing":
        return renderMealTimingSection(content);
      case "morning_drinks":
        return renderMorningDrinksSection(content);
      case "bedtime_drink":
        return renderBedtimeDrinkSection(content);
      case "meal_plan":
        return renderMealPlanSection(content);
      case "snack_ideas":
        return renderSnackIdeasSection(content);
      case "supplements":
        return renderSupplementsSection(content);
      case "training_program":
        return renderTrainingSection(content);
      case "progression_strategy":
        return renderProgressionSection(content);
      case "recovery_rules":
        return renderRecoverySection(content);
      case "checkin_protocol":
        return renderCheckinSection(content);
      case "blood_report_strategy":
        return renderBloodReportSection(content);
      case "coach_credentials":
        return renderCoachSection(content);
      default:
        return renderGenericSection(content);
    }
  };

  const hasValue = (obj: Record<string, unknown>, key: string): boolean => {
    return key in obj && obj[key] !== null && obj[key] !== undefined;
  };

  const renderHeaderSection = (content: Record<string, unknown>) => (
    <div className="space-y-4">
      {hasValue(content, "goal") ? (
        <div className="p-4 bg-brown-50 dark:bg-brown-900/20 rounded-lg">
          <p className="text-sm text-brown-600 dark:text-brown-400 font-medium">Your Goal</p>
          <p className="text-lg text-stone-800 dark:text-stone-100">{String(content.goal)}</p>
        </div>
      ) : null}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hasValue(content, "age") ? (
          <div className="text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{String(content.age)}</p>
            <p className="text-sm text-stone-500">Age</p>
          </div>
        ) : null}
        {hasValue(content, "heightCm") ? (
          <div className="text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{String(content.heightCm)} cm</p>
            <p className="text-sm text-stone-500">Height</p>
          </div>
        ) : null}
        {hasValue(content, "weightKg") ? (
          <div className="text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{String(content.weightKg)} kg</p>
            <p className="text-sm text-stone-500">Weight</p>
          </div>
        ) : null}
        {hasValue(content, "durationWeeks") ? (
          <div className="text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{String(content.durationWeeks)}</p>
            <p className="text-sm text-stone-500">Weeks</p>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderMacrosSection = (content: Record<string, unknown>) => {
    // Support both naming conventions
    const calories = content.targetCalories ?? content.calories;
    const protein = content.proteinG ?? content.protein;
    const carbs = content.carbsG ?? content.carbs;
    const fat = content.fatG ?? content.fats ?? content.fat;
    const fiber = content.fiber;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {calories !== null && calories !== undefined ? (
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-3xl font-bold text-orange-600">{String(calories)}</p>
              <p className="text-sm text-stone-500">Calories</p>
            </div>
          ) : null}
          {protein !== null && protein !== undefined ? (
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-3xl font-bold text-red-600">{String(protein)}g</p>
              <p className="text-sm text-stone-500">Protein</p>
            </div>
          ) : null}
          {carbs !== null && carbs !== undefined ? (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-3xl font-bold text-blue-600">{String(carbs)}g</p>
              <p className="text-sm text-stone-500">Carbs</p>
            </div>
          ) : null}
          {fat !== null && fat !== undefined ? (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-3xl font-bold text-yellow-600">{String(fat)}g</p>
              <p className="text-sm text-stone-500">Fat</p>
            </div>
          ) : null}
          {fiber !== null && fiber !== undefined ? (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-3xl font-bold text-green-600">{String(fiber)}g</p>
              <p className="text-sm text-stone-500">Fiber</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMealTimingSection = (content: Record<string, unknown>) => {
    const schedule = (content.schedule as Array<{
      activity: string;
      time: string;
    }>) || [];

    return (
      <div className="space-y-4">
        {schedule.length > 0 ? (
          <div className="grid gap-2">
            {schedule.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brown-500 rounded-full" />
                  <span className="font-medium text-stone-800 dark:text-stone-100">{item.activity}</span>
                </div>
                <span className="text-brown-600 dark:text-brown-400 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brown-500 rounded-full" />
                  <span className="font-medium text-stone-800 dark:text-stone-100 capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-brown-600 dark:text-brown-400 font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        {hasValue(content, "notes") ? (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            {String(content.notes)}
          </p>
        ) : null}
      </div>
    );
  };

  const renderMorningDrinksSection = (content: Record<string, unknown>) => {
    const drinks = (content.drinks as Array<{
      name: string;
      recipe?: string;
    }>) || (content.options as string[]) || [];
    const benefits = (content.benefits as string[]) || [];

    return (
      <div className="space-y-4">
        <p className="text-sm text-stone-500 mb-2">Choose 1 daily:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.isArray(drinks) && drinks.map((drink, idx) => (
            <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
              <Coffee className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="font-medium text-stone-800 dark:text-stone-100">
                {typeof drink === "string" ? drink : drink.name}
              </p>
              {typeof drink !== "string" && drink.recipe && (
                <p className="text-xs text-stone-500 mt-1">{drink.recipe}</p>
              )}
            </div>
          ))}
        </div>
        {benefits.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Benefits:</p>
            <ul className="space-y-1">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderBedtimeDrinkSection = (content: Record<string, unknown>) => {
    const recipe = content.recipe as string || content.name as string || "";
    const ingredients = (content.ingredients as string[]) || [];
    const benefits = (content.benefits as string[]) || [];

    return (
      <div className="space-y-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Moon className="w-6 h-6 text-indigo-600" />
            <h4 className="font-medium text-stone-800 dark:text-stone-100">
              {recipe || "Bedtime Drink"}
            </h4>
          </div>
          {ingredients.length > 0 && (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {ingredients.join(" + ")}
            </p>
          )}
        </div>
        {benefits.length > 0 && (
          <div>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Benefits:</p>
            <ul className="space-y-1">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSnackIdeasSection = (content: Record<string, unknown>) => {
    const snacks = (content.snacks as Array<{
      name: string;
      portion?: string;
    }>) || (content.ideas as string[]) || [];

    return (
      <div className="space-y-3">
        {hasValue(content, "note") ? (
          <p className="text-sm text-stone-500 mb-2">{String(content.note)}</p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.isArray(snacks) && snacks.map((snack, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <Utensils className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100">
                  {typeof snack === "string" ? snack : snack.name}
                </p>
                {typeof snack !== "string" && snack.portion && (
                  <p className="text-sm text-stone-500">{snack.portion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProgressionSection = (content: Record<string, unknown>) => {
    const phases = (content.phases as Array<{
      weeks: string;
      focus: string;
    }>) || [];

    return (
      <div className="space-y-4">
        {phases.length > 0 ? (
          <div className="space-y-3">
            {phases.map((phase, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800 dark:text-stone-100">{phase.weeks}</p>
                  <p className="text-stone-600 dark:text-stone-400">{phase.focus}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="flex items-start gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800 dark:text-stone-100 capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                  </p>
                  <p className="text-stone-600 dark:text-stone-400">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRecoverySection = (content: Record<string, unknown>) => {
    const rules = (content.rules as string[]) || (content.guidelines as string[]) || [];

    return (
      <div className="space-y-3">
        {rules.length > 0 ? (
          rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-stone-700 dark:text-stone-300">{rule}</p>
            </div>
          ))
        ) : (
          Object.entries(content).map(([key, value]) => (
            <div key={key} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100 capitalize">
                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                </p>
                <p className="text-stone-600 dark:text-stone-400">{String(value)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderCheckinSection = (content: Record<string, unknown>) => {
    const weekly = (content.weekly as string[]) || [];
    const daily = (content.daily as string[]) || [];

    return (
      <div className="space-y-6">
        {weekly.length > 0 && (
          <div>
            <h4 className="font-medium text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Weekly Check-in
            </h4>
            <ul className="space-y-2">
              {weekly.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-stone-600 dark:text-stone-400 pl-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {daily.length > 0 && (
          <div>
            <h4 className="font-medium text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Daily Requirements
            </h4>
            <ul className="space-y-2">
              {daily.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-stone-600 dark:text-stone-400 pl-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {weekly.length === 0 && daily.length === 0 && (
          <div className="space-y-2">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <p className="font-medium text-stone-700 dark:text-stone-300 capitalize mb-1">
                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                </p>
                <p className="text-stone-600 dark:text-stone-400">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMealPlanSection = (content: Record<string, unknown>) => {
    const meals = (content.meals as Array<{
      mealNumber: number;
      mealName: string;
      time?: string;
      options?: Array<{
        optionLabel: string;
        items: Array<{
          foodName: string;
          quantity: string;
          calories?: number;
          proteinG?: number;
        }>;
      }>;
    }>) || [];

    return (
      <div className="space-y-4">
        {meals.map((meal, idx) => (
          <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-stone-800 dark:text-stone-100">
                {meal.mealName || `Meal ${meal.mealNumber}`}
              </h4>
              {meal.time && (
                <span className="text-sm text-stone-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {meal.time}
                </span>
              )}
            </div>
            {meal.options && meal.options.length > 0 && (
              <div className="space-y-2">
                {meal.options[0].items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between py-2 border-b border-stone-200 dark:border-stone-700 last:border-0">
                    <div>
                      <p className="font-medium text-stone-700 dark:text-stone-200">{item.foodName}</p>
                      <p className="text-sm text-stone-500">{item.quantity}</p>
                    </div>
                    {item.calories && (
                      <p className="text-sm text-stone-500">{item.calories} kcal</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTrainingSection = (content: Record<string, unknown>) => {
    const days = (content.days as Array<{
      dayNumber: number;
      dayName: string;
      isRestDay?: boolean;
      focusAreas?: string[];
      exercises?: Array<{
        name: string;
        sets: number;
        reps: string;
        restSeconds?: number;
        notes?: string;
      }>;
    }>) || [];

    return (
      <div className="space-y-4">
        {hasValue(content, "weeklySplit") && Array.isArray(content.weeklySplit) ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {(content.weeklySplit as string[]).map((day, idx) => (
              <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                Day {idx + 1}: {day}
              </span>
            ))}
          </div>
        ) : null}
        {days.map((day, idx) => (
          <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-stone-800 dark:text-stone-100">
                {day.dayName || `Day ${day.dayNumber}`}
              </h4>
              {day.isRestDay ? (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                  Rest Day
                </span>
              ) : day.focusAreas && day.focusAreas.length > 0 && (
                <span className="text-sm text-stone-500">
                  {day.focusAreas.join(" + ")}
                </span>
              )}
            </div>
            {day.exercises && day.exercises.length > 0 && (
              <div className="space-y-2">
                {day.exercises.map((ex, eIdx) => (
                  <div key={eIdx} className="flex items-center justify-between py-2 border-b border-stone-200 dark:border-stone-700 last:border-0">
                    <div>
                      <p className="font-medium text-stone-700 dark:text-stone-200">{ex.name}</p>
                      {ex.notes && <p className="text-sm text-stone-500">{ex.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                        {ex.sets} x {ex.reps}
                      </p>
                      {ex.restSeconds && (
                        <p className="text-xs text-stone-400">{ex.restSeconds}s rest</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSupplementsSection = (content: Record<string, unknown>) => {
    const supplements = (content.supplements as Array<{
      name: string;
      dosage?: string;
      timing?: string;
      targetDeficiency?: string;
    }>) || [];

    return (
      <div className="space-y-3">
        {supplements.map((supp, idx) => (
          <div key={idx} className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Pill className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-stone-800 dark:text-stone-100">{supp.name}</p>
              <p className="text-sm text-stone-500">
                {supp.dosage && `${supp.dosage}`}
                {supp.timing && ` • ${supp.timing}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBloodReportSection = (content: Record<string, unknown>) => (
    <div className="space-y-4">
      {hasValue(content, "keyObservations") && Array.isArray(content.keyObservations) ? (
        <div>
          <h4 className="font-medium text-stone-700 dark:text-stone-300 mb-2">Key Observations</h4>
          <ul className="space-y-2">
            {(content.keyObservations as string[]).map((obs, idx) => (
              <li key={idx} className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                {obs}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hasValue(content, "recommendations") && Array.isArray(content.recommendations) ? (
        <div>
          <h4 className="font-medium text-stone-700 dark:text-stone-300 mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {(content.recommendations as string[]).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  const renderCoachSection = (content: Record<string, unknown>) => (
    <div className="text-center">
      <div className="w-20 h-20 bg-brown-100 dark:bg-brown-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <User className="w-10 h-10 text-brown-600" />
      </div>
      <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-100">
        {getCoachName()}
      </h3>
      {hasValue(content, "credentials") && Array.isArray(content.credentials) ? (
        <div className="mt-4 space-y-2">
          {(content.credentials as string[]).map((cred, idx) => (
            <p key={idx} className="text-stone-600 dark:text-stone-400 flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-brown-500" />
              {cred}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );

  const renderGenericSection = (content: Record<string, unknown>) => (
    <div className="space-y-3">
      {Object.entries(content).map(([key, value]) => (
        <div key={key}>
          <p className="text-sm font-medium text-stone-500 capitalize">
            {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
          </p>
          <p className="text-stone-800 dark:text-stone-100">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brown-500" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2">
          No Transformation Plan Yet
        </h2>
        <p className="text-stone-500 max-w-md mx-auto">
          Your coach hasn&apos;t published a transformation plan for you yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-brown-500 to-brown-700 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-6 h-6" />
          <span className="text-brown-200 font-medium">Your Transformation Plan</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{plan.plan_name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-brown-100">
          {plan.phase && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
              {plan.phase}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {plan.duration_weeks} weeks
          </span>
          {plan.published_at && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Updated {formatDate(plan.published_at)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      {plan.sections && plan.sections.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm font-medium text-stone-500 mb-3">Jump to Section</p>
          <div className="flex flex-wrap gap-2">
            {plan.sections
              .filter((s) => s.is_visible)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setExpandedSections((prev) => new Set([...prev, section.id]));
                    setActiveSection(section.id);
                    document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-brown-500 text-white"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  {sectionIcons[section.section_type]}
                  {section.title || sectionLabels[section.section_type] || section.section_type}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {plan.sections && plan.sections.length > 0 ? (
          plan.sections
            .filter((s) => s.is_visible)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((section) => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className={`bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden ${
                  activeSection === section.id ? "ring-2 ring-brown-500" : ""
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brown-100 dark:bg-brown-900/30 rounded-xl text-brown-600">
                      {sectionIcons[section.section_type] || <FileText className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-stone-800 dark:text-stone-100">
                        {section.title || sectionLabels[section.section_type] || section.section_type}
                      </p>
                      <p className="text-sm text-stone-500">
                        {sectionLabels[section.section_type]}
                      </p>
                    </div>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronUp className="w-5 h-5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400" />
                  )}
                </button>

                {expandedSections.has(section.id) && (
                  <div className="px-5 pb-5 border-t border-stone-100 dark:border-stone-800">
                    <div className="mt-5">{renderSectionContent(section)}</div>
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No content available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
