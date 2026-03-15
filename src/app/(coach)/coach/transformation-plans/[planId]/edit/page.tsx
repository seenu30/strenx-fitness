"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Download,
  FileText,
  Utensils,
  Dumbbell,
  Pill,
  Heart,
  Target,
  Coffee,
  Moon,
  User,
  Calendar,
  Clock,
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
}

const sectionTypes: { type: TransformationPlanSectionType; label: string; icon: React.ReactNode }[] = [
  { type: "header", label: "Header", icon: <FileText className="w-4 h-4" /> },
  { type: "blood_report_strategy", label: "Blood Report Strategy", icon: <Heart className="w-4 h-4" /> },
  { type: "daily_macros", label: "Daily Macros", icon: <Target className="w-4 h-4" /> },
  { type: "meal_timing", label: "Meal Timing", icon: <Clock className="w-4 h-4" /> },
  { type: "morning_drinks", label: "Morning Drinks", icon: <Coffee className="w-4 h-4" /> },
  { type: "bedtime_drink", label: "Bedtime Drink", icon: <Moon className="w-4 h-4" /> },
  { type: "meal_plan", label: "Meal Plan", icon: <Utensils className="w-4 h-4" /> },
  { type: "snack_ideas", label: "Snack Ideas", icon: <Utensils className="w-4 h-4" /> },
  { type: "supplements", label: "Supplements", icon: <Pill className="w-4 h-4" /> },
  { type: "training_program", label: "Training Program", icon: <Dumbbell className="w-4 h-4" /> },
  { type: "progression_strategy", label: "Progression Strategy", icon: <Target className="w-4 h-4" /> },
  { type: "recovery_rules", label: "Recovery Rules", icon: <Heart className="w-4 h-4" /> },
  { type: "checkin_protocol", label: "Check-in Protocol", icon: <Calendar className="w-4 h-4" /> },
  { type: "coach_credentials", label: "Coach Credentials", icon: <User className="w-4 h-4" /> },
];

export default function TransformationPlanEditPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pullingData, setPullingData] = useState(false);
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAddSection, setShowAddSection] = useState(false);
  const [planDetails, setPlanDetails] = useState({
    plan_name: "",
    phase: "",
    duration_weeks: 4,
  });

  const loadPlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/transformation-plans/${planId}`);
      const data = await response.json();

      if (data.success && data.plan) {
        setPlan(data.plan);
        setSections(data.plan.sections || []);
        setPlanDetails({
          plan_name: data.plan.plan_name,
          phase: data.plan.phase || "",
          duration_weeks: data.plan.duration_weeks,
        });
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

  const handleSavePlanDetails = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/transformation-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planDetails),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Failed to save plan details");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Failed to save plan details");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async (sectionType: TransformationPlanSectionType) => {
    setSaving(true);
    setShowAddSection(false);

    try {
      const response = await fetch(`/api/transformation-plans/${planId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_type: sectionType,
          title: null,
          content: {},
          is_visible: true,
          sort_order: sections.length,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadPlan();
      } else {
        alert(data.error || "Failed to add section");
      }
    } catch (error) {
      console.error("Error adding section:", error);
      alert("Failed to add section");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section: PlanSection) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/transformation-plans/${planId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_type: section.section_type,
          title: section.title,
          content: section.content,
          is_visible: section.is_visible,
          sort_order: section.sort_order,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Failed to save section");
      }
    } catch (error) {
      console.error("Error saving section:", error);
      alert("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    setSaving(true);

    try {
      const response = await fetch(
        `/api/transformation-plans/${planId}/sections?section_id=${sectionId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        await loadPlan();
      } else {
        alert(data.error || "Failed to delete section");
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Failed to delete section");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (section: PlanSection) => {
    const updatedSection = { ...section, is_visible: !section.is_visible };
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? updatedSection : s))
    );
    await handleSaveSection(updatedSection);
  };

  const handlePullData = async () => {
    if (!confirm("This will fetch data from existing plans and assessments. Continue?")) return;
    setPullingData(true);

    try {
      const response = await fetch(`/api/transformation-plans/${planId}/pull-data`);
      const data = await response.json();

      if (data.success && data.data) {
        // Create/update sections with pulled data
        const pulledData = data.data;

        for (const [key, value] of Object.entries(pulledData)) {
          const sectionType = key === "bloodReportStrategy" ? "blood_report_strategy" :
                              key === "dailyMacros" ? "daily_macros" :
                              key === "mealPlan" ? "meal_plan" :
                              key === "trainingProgram" ? "training_program" :
                              key === "coachCredentials" ? "coach_credentials" :
                              key;

          if (value && typeof value === "object") {
            await fetch(`/api/transformation-plans/${planId}/sections`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                section_type: sectionType,
                content: value,
                is_visible: true,
              }),
            });
          }
        }

        await loadPlan();
        alert("Data pulled successfully!");
      } else {
        alert("No data found to pull");
      }
    } catch (error) {
      console.error("Error pulling data:", error);
      alert("Failed to pull data");
    } finally {
      setPullingData(false);
    }
  };

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
        alert("Plan published successfully!");
        router.push(`/coach/transformation-plans/${planId}`);
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

  const updateSectionContent = (sectionId: string, content: Record<string, unknown>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content } : s))
    );
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

  const getSectionIcon = (type: string) => {
    const found = sectionTypes.find((s) => s.type === type);
    return found?.icon || <FileText className="w-4 h-4" />;
  };

  const getSectionLabel = (type: string) => {
    const found = sectionTypes.find((s) => s.type === type);
    return found?.label || type;
  };

  const getClientName = () => {
    if (!plan?.client?.users) return "Unknown Client";
    const { first_name, last_name } = plan.client.users;
    return `${first_name || ""} ${last_name || ""}`.trim() || "Unnamed Client";
  };

  const existingSectionTypes = sections.map((s) => s.section_type);
  const availableSectionTypes = sectionTypes.filter(
    (s) => !existingSectionTypes.includes(s.type)
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
        <p className="text-stone-500">Plan not found.</p>
        <Link href="/coach/transformation-plans" className="text-brown-500 hover:underline mt-2 inline-block">
          Back to plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/coach/transformation-plans/${planId}`}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              Edit Transformation Plan
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              {getClientName()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePullData}
            disabled={pullingData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium"
          >
            {pullingData ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Pull Data
          </button>
          {plan.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={publishing || sections.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
          Plan Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Plan Name
            </label>
            <input
              type="text"
              value={planDetails.plan_name}
              onChange={(e) => setPlanDetails({ ...planDetails, plan_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Phase
            </label>
            <input
              type="text"
              value={planDetails.phase}
              onChange={(e) => setPlanDetails({ ...planDetails, phase: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              placeholder="e.g., Phase 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Duration (weeks)
            </label>
            <select
              value={planDetails.duration_weeks}
              onChange={(e) => setPlanDetails({ ...planDetails, duration_weeks: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              {[2, 4, 6, 8, 10, 12, 16].map((weeks) => (
                <option key={weeks} value={weeks}>
                  {weeks} weeks
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSavePlanDetails}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Details
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Sections ({sections.length})
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>

            {showAddSection && availableSectionTypes.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-2 z-20 max-h-80 overflow-y-auto">
                {availableSectionTypes.map((section) => (
                  <button
                    key={section.type}
                    onClick={() => handleAddSection(section.type)}
                    className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <div
                  key={section.id}
                  className={`bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden ${
                    !section.is_visible ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <GripVertical className="w-4 h-4 text-stone-400" />
                      <div className="p-2 bg-brown-100 dark:bg-brown-900/30 rounded-lg text-brown-600">
                        {getSectionIcon(section.section_type)}
                      </div>
                      <div>
                        <p className="font-medium text-stone-800 dark:text-stone-100">
                          {section.title || getSectionLabel(section.section_type)}
                        </p>
                        <p className="text-sm text-stone-500">
                          {getSectionLabel(section.section_type)}
                        </p>
                      </div>
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="w-5 h-5 text-stone-400 ml-auto" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-stone-400 ml-auto" />
                      )}
                    </button>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleVisibility(section)}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                        title={section.is_visible ? "Hide from client" : "Show to client"}
                      >
                        {section.is_visible ? (
                          <Eye className="w-4 h-4 text-stone-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-stone-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedSections.has(section.id) && (
                    <div className="p-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                            Section Title (optional)
                          </label>
                          <input
                            type="text"
                            value={section.title || ""}
                            onChange={(e) => {
                              const updated = { ...section, title: e.target.value || null };
                              setSections((prev) =>
                                prev.map((s) => (s.id === section.id ? updated : s))
                              );
                            }}
                            onBlur={() => handleSaveSection(section)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                            placeholder={getSectionLabel(section.section_type)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                            Content (JSON)
                          </label>
                          <textarea
                            value={JSON.stringify(section.content, null, 2)}
                            onChange={(e) => {
                              try {
                                const content = JSON.parse(e.target.value);
                                updateSectionContent(section.id, content);
                              } catch {
                                // Invalid JSON, ignore
                              }
                            }}
                            onBlur={() => handleSaveSection(section)}
                            className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono text-sm resize-y min-h-[200px]"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSaveSection(section)}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 disabled:opacity-50 font-medium text-sm"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Section
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 mb-4">No sections yet. Start by adding sections or pulling data from existing plans.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handlePullData}
                disabled={pullingData}
                className="inline-flex items-center gap-2 px-4 py-2 border border-brown-500 text-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20 font-medium"
              >
                {pullingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Pull from Existing Data
              </button>
              <button
                onClick={() => setShowAddSection(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Section Manually
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      {sections.length > 0 && plan.status === "draft" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-4 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {sections.length} section{sections.length !== 1 ? "s" : ""} • Last saved just now
            </p>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish to Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
