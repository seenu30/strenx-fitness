"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Send,
  Loader2,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Utensils,
  Dumbbell,
  Pill,
  Heart,
  Target,
  Coffee,
  Moon,
  ChevronDown,
  ChevronUp,
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
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sections: PlanSection[];
  client: {
    id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  } | null;
  coach: {
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
  coach_credentials: <User className="w-5 h-5" />,
  custom: <FileText className="w-5 h-5" />,
};

const sectionLabels: Record<string, string> = {
  header: "Header",
  blood_report_strategy: "Blood Report Strategy",
  daily_macros: "Daily Macros",
  meal_timing: "Meal Timing",
  morning_drinks: "Morning Drinks",
  bedtime_drink: "Bedtime Drink",
  meal_plan: "Meal Plan",
  snack_ideas: "Snack Ideas",
  supplements: "Supplements",
  training_program: "Training Program",
  progression_strategy: "Progression Strategy",
  recovery_rules: "Recovery Rules",
  checkin_protocol: "Check-in Protocol",
  coach_credentials: "Coach Credentials",
  custom: "Custom Section",
};

export default function TransformationPlanViewPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const loadPlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/transformation-plans/${planId}`);
      const data = await response.json();

      if (data.success && data.plan) {
        setPlan(data.plan);
        // Expand all sections by default
        const sectionIds = (data.plan.sections || []).map((s: PlanSection) => s.id);
        setExpandedSections(new Set(sectionIds));
      }
    } catch (error) {
      console.error("Error loading plan:", error);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish this plan to the client?")) return;
    setPublishing(true);

    try {
      const response = await fetch(`/api/transformation-plans/${planId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        await loadPlan();
        alert("Plan published successfully!");
      } else {
        alert(data.error || "Failed to publish plan");
      }
    } catch (error) {
      console.error("Error publishing plan:", error);
      alert("Failed to publish plan");
    } finally {
      setPublishing(false);
    }
  };

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
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getClientName = () => {
    if (!plan?.client?.users) return "Unknown Client";
    const { first_name, last_name } = plan.client.users;
    return `${first_name || ""} ${last_name || ""}`.trim() || "Unnamed Client";
  };

  const renderSectionContent = (section: PlanSection) => {
    const content = section.content;

    return (
      <pre className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-wrap bg-stone-50 dark:bg-stone-800/50 p-4 rounded-lg overflow-x-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

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
        <p className="text-stone-500">Plan not found.</p>
        <Link href="/coach/transformation-plans" className="text-brown-500 hover:underline mt-2 inline-block">
          Back to plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/coach/transformation-plans"
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {plan.plan_name}
              </h1>
              {plan.status === "published" ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                  <Clock className="w-3 h-3" />
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {getClientName()}
              </span>
              {plan.phase && <span>{plan.phase}</span>}
              <span>{plan.duration_weeks} weeks</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plan.status !== "archived" && (
            <>
              <Link
                href={`/coach/transformation-plans/${planId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              {plan.status === "draft" && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Publish to Client
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-stone-500">Client</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">{getClientName()}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500">Phase</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">{plan.phase || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500">Duration</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">{plan.duration_weeks} weeks</p>
          </div>
          <div>
            <p className="text-sm text-stone-500">Created</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">{formatDate(plan.created_at)}</p>
          </div>
        </div>
        {plan.published_at && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="text-sm text-green-600 dark:text-green-400">
              Published on {formatDate(plan.published_at)}
            </p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
          Plan Sections ({plan.sections?.length || 0})
        </h2>

        {plan.sections && plan.sections.length > 0 ? (
          plan.sections
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((section) => (
              <div
                key={section.id}
                className={`bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden ${
                  !section.is_visible ? "opacity-60" : ""
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-100 dark:bg-brown-900/30 rounded-lg text-brown-600">
                      {sectionIcons[section.section_type] || <FileText className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-stone-800 dark:text-stone-100">
                        {section.title || sectionLabels[section.section_type] || section.section_type}
                      </p>
                      <p className="text-sm text-stone-500">
                        {sectionLabels[section.section_type]}
                        {!section.is_visible && " (Hidden from client)"}
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
                  <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-800">
                    <div className="mt-4">{renderSectionContent(section)}</div>
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 mb-4">No sections added yet.</p>
            <Link
              href={`/coach/transformation-plans/${planId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 font-medium"
            >
              <Edit className="w-4 h-4" />
              Add Sections
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
