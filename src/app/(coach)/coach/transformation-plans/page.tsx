"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  Loader2,
  User,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";

interface TransformationPlanListItem {
  id: string;
  plan_name: string;
  phase: string | null;
  duration_weeks: number;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  } | null;
  sections: { id: string; section_type: string }[];
}

type StatusFilter = "all" | "draft" | "published" | "archived";

export default function TransformationPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<TransformationPlanListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  const supabase = createClient();

  const loadPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/transformation-plans");
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error loading transformation plans:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleArchivePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to archive this plan?")) return;
    setShowDropdown(null);
    setArchiving(planId);

    try {
      const response = await fetch(`/api/transformation-plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadPlans();
      }
    } catch (error) {
      console.error("Error archiving plan:", error);
    } finally {
      setArchiving(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 rounded-full">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const getClientName = (plan: TransformationPlanListItem) => {
    if (!plan.client?.users) return "Unknown Client";
    const { first_name, last_name } = plan.client.users;
    return `${first_name || ""} ${last_name || ""}`.trim() || "Unnamed Client";
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(plan).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: plans.length,
    draft: plans.filter((p) => p.status === "draft").length,
    published: plans.filter((p) => p.status === "published").length,
    archived: plans.filter((p) => p.status === "archived").length,
  };

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
            Transformation Plans
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Create personalized transformation plans for your clients
          </p>
        </div>
        <Link
          href="/coach/transformation-plans/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {(["all", "draft", "published", "archived"] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === status
                ? "bg-brown-500 text-white"
                : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
            }`}
          >
            {status === "all" && <FileText className="w-4 h-4" />}
            {status === "draft" && <Clock className="w-4 h-4" />}
            {status === "published" && <CheckCircle2 className="w-4 h-4" />}
            {status === "archived" && <Archive className="w-4 h-4" />}
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search by plan name or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
        />
      </div>

      {/* Plans List */}
      {filteredPlans.length > 0 ? (
        <div className="grid gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brown-100 dark:bg-brown-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-brown-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                        {plan.plan_name}
                      </h3>
                      {getStatusBadge(plan.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getClientName(plan)}
                      </span>
                      {plan.phase && (
                        <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-600 dark:text-stone-400">
                          {plan.phase}
                        </span>
                      )}
                      <span>{plan.duration_weeks} weeks</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {formatDate(plan.created_at)}
                      </span>
                      {plan.published_at && (
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Published {formatDate(plan.published_at)}
                        </span>
                      )}
                      <span>{plan.sections?.length || 0} sections</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/coach/transformation-plans/${plan.id}`}
                    className="px-3 py-1.5 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20 font-medium"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </Link>
                  {plan.status !== "archived" && (
                    <Link
                      href={`/coach/transformation-plans/${plan.id}/edit`}
                      className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 font-medium"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </Link>
                  )}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowDropdown(showDropdown === plan.id ? null : plan.id)
                      }
                      className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5 text-stone-400" />
                    </button>
                    {showDropdown === plan.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-10">
                        {plan.status === "draft" && (
                          <Link
                            href={`/coach/transformation-plans/${plan.id}/edit`}
                            className="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                            onClick={() => setShowDropdown(null)}
                          >
                            <Send className="w-4 h-4" />
                            Publish
                          </Link>
                        )}
                        {plan.status !== "archived" && (
                          <button
                            onClick={() => handleArchivePlan(plan.id)}
                            disabled={archiving === plan.id}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            {archiving === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Archive
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
          {searchQuery || statusFilter !== "all" ? (
            <p className="text-stone-500">No plans found matching your filters.</p>
          ) : (
            <>
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 mb-4">No transformation plans created yet.</p>
              <Link
                href="/coach/transformation-plans/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
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
