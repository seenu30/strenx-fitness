"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  CreditCard,
  Users,
  Loader2,
  Eye,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/types/application";

interface ApplicationRow {
  id: string;
  email: string;
  phone: string | null;
  status: ApplicationStatus;
  progress_percentage: number;
  assessment_data: {
    personalInfo?: {
      firstName?: string;
      lastName?: string;
    };
  };
  submitted_at: string | null;
  created_at: string;
  selected_plan_id: string | null;
  plan: {
    id: string;
    name: string;
    price_amount: number;
  } | null;
}

interface Application {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  status: ApplicationStatus;
  progress: number;
  planName: string | null;
  submittedAt: string | null;
  createdAt: string;
}

type StatusFilter = "all" | ApplicationStatus;

export default function ApplicationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    const supabase = createClient();

    try {
      const { data: apps, error } = await (supabase as SupabaseClient)
        .from("client_applications")
        .select(`
          id,
          email,
          phone,
          status,
          progress_percentage,
          assessment_data,
          submitted_at,
          created_at,
          selected_plan_id,
          plan:subscription_plans(id, name, price_amount)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        setIsLoading(false);
        return;
      }

      // Format applications
      const formatted: Application[] = ((apps || []) as unknown as ApplicationRow[]).map((app) => {
        const personalInfo = app.assessment_data?.personalInfo || {};
        const name = personalInfo.firstName && personalInfo.lastName
          ? `${personalInfo.firstName} ${personalInfo.lastName}`
          : app.email.split("@")[0];

        return {
          id: app.id,
          email: app.email,
          phone: app.phone,
          name,
          status: app.status,
          progress: app.progress_percentage,
          planName: app.plan?.name || null,
          submittedAt: app.submitted_at,
          createdAt: app.created_at,
        };
      });

      setApplications(formatted);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.email.toLowerCase().includes(query) ||
        app.name.toLowerCase().includes(query) ||
        app.phone?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get status counts
  const statusCounts = {
    all: applications.length,
    submitted: applications.filter((a) => a.status === "submitted").length,
    approved: applications.filter((a) => a.status === "approved").length,
    payment_received: applications.filter((a) => a.status === "payment_received").length,
    invited: applications.filter((a) => a.status === "invited").length,
    completed: applications.filter((a) => a.status === "completed").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    draft: applications.filter((a) => a.status === "draft").length,
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "submitted":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "payment_received":
        return <CreditCard className="w-4 h-4" />;
      case "invited":
        return <Mail className="w-4 h-4" />;
      case "completed":
        return <Users className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground">
            Review and manage client applications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {statusCounts.submitted}
              </p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <CreditCard className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {statusCounts.approved}
              </p>
              <p className="text-sm text-muted-foreground">Awaiting Payment</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {statusCounts.payment_received}
              </p>
              <p className="text-sm text-muted-foreground">Ready to Invite</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {statusCounts.completed}
              </p>
              <p className="text-sm text-muted-foreground">Converted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="pl-10 pr-8 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="submitted">Submitted ({statusCounts.submitted})</option>
            <option value="approved">Approved ({statusCounts.approved})</option>
            <option value="payment_received">Payment Received ({statusCounts.payment_received})</option>
            <option value="invited">Invited ({statusCounts.invited})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No applications found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Applications will appear here when clients submit them"}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{app.name}</p>
                        <p className="text-sm text-muted-foreground">{app.email}</p>
                        {app.phone && (
                          <p className="text-sm text-muted-foreground">{app.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[app.status]
                        }`}
                      >
                        {getStatusIcon(app.status)}
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {app.planName || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(app.submittedAt || app.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/coach/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
