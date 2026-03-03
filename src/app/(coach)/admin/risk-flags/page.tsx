"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  User,
  Heart,
  Activity,
  MessageSquare,
  Shield,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RiskFlag {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  dateCreated: string;
  status: string;
  restrictions: string[];
  acknowledgedBy?: string;
  acknowledgedDate?: string;
  acknowledgedNotes?: string;
}

type FlagStatus = "all" | "pending" | "acknowledged" | "resolved";
type FlagType = "all" | "medical" | "compliance" | "behavioral";

export default function RiskFlagsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FlagStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FlagType>("all");
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRiskFlags();
  }, []);

  async function loadRiskFlags() {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get coach's id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: coach } = await (supabase as any)
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const coachId = coach?.id;

      // Get client IDs for this coach
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clients } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("coach_id", coachId);

      const clientIds = clients?.length > 0
        ? clients.map((c: { id: string }) => c.id)
        : ['00000000-0000-0000-0000-000000000000'];

      // Get risk flags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: riskFlags, error } = await (supabase as any)
        .from("risk_flags")
        .select(`
          id,
          flag_type,
          severity,
          description,
          is_active,
          created_at,
          acknowledged_at,
          acknowledged_by,
          acknowledged_notes,
          resolved_at,
          clients!inner(
            id,
            users!inner(first_name, last_name)
          )
        `)
        .in("client_id", clientIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching risk flags:", error);
        setIsLoading(false);
        return;
      }

      // Format flags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedFlags: RiskFlag[] = (riskFlags || []).map((flag: any) => {
        const client = flag.clients;
        const user = client.users;

        // Determine status
        let status = "pending";
        if (flag.resolved_at) {
          status = "resolved";
        } else if (flag.acknowledged_at) {
          status = "acknowledged";
        }

        // Generate title based on flag type
        const typeToTitle: Record<string, string> = {
          medical: "Medical Concern",
          compliance: "Compliance Issue",
          behavioral: "Behavioral Flag",
          missed_checkins: "Missed Check-ins",
          weight_change: "Significant Weight Change",
          low_compliance: "Low Compliance Rate",
        };

        // Generate restrictions based on severity and type
        const restrictions: string[] = [];
        if (flag.flag_type === "medical" && flag.severity === "high") {
          restrictions.push("Requires medical clearance");
          restrictions.push("Modified training only");
        } else if (flag.flag_type === "medical" && flag.severity === "medium") {
          restrictions.push("Monitor during sessions");
        }

        return {
          id: flag.id,
          clientId: client.id,
          clientName: `${user.first_name} ${user.last_name}`,
          type: flag.flag_type,
          severity: flag.severity,
          title: typeToTitle[flag.flag_type] || "Risk Flag",
          description: flag.description,
          dateCreated: flag.created_at,
          status,
          restrictions,
          acknowledgedBy: flag.acknowledged_by ? "Coach" : undefined,
          acknowledgedDate: flag.acknowledged_at,
          acknowledgedNotes: flag.acknowledged_notes,
        };
      });

      setFlags(formattedFlags);
    } catch (error) {
      console.error("Error loading risk flags:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcknowledge(flagId: string) {
    setIsProcessing(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("risk_flags")
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
          acknowledged_notes: acknowledgeNotes,
        })
        .eq("id", flagId);

      // Reload flags
      await loadRiskFlags();
      setSelectedFlag(null);
      setAcknowledgeNotes("");
    } catch (error) {
      console.error("Error acknowledging flag:", error);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleResolve(flagId: string) {
    setIsProcessing(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("risk_flags")
        .update({
          resolved_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", flagId);

      // Reload flags
      await loadRiskFlags();
    } catch (error) {
      console.error("Error resolving flag:", error);
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      flag.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || flag.status === statusFilter;
    const matchesType = typeFilter === "all" || flag.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = flags.filter((f) => f.status === "pending").length;
  const highSeverityCount = flags.filter(
    (f) => f.severity === "high" && f.status === "pending"
  ).length;
  const medicalCount = flags.filter((f) => f.type === "medical").length;
  const complianceCount = flags.filter((f) => f.type === "compliance" || f.type === "missed_checkins" || f.type === "low_compliance").length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "medium":
        return "bg-brown-100 text-brown-600 dark:bg-brown-900/30 dark:text-brown-400 border-brown-200 dark:border-brown-700";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-brown-500" />;
      case "acknowledged":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brown-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Risk Flags
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Review and manage client risk notifications
        </p>
      </div>

      {/* Alert Banner */}
      {highSeverityCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                {highSeverityCount} High Severity Flag{highSeverityCount > 1 ? "s" : ""} Require
                Attention
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Please review and acknowledge these flags before continuing with affected
                clients.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-brown-500">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">High Severity</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{highSeverityCount}</p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-sm">Medical</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {medicalCount}
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Compliance</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {complianceCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by client or flag title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FlagStatus)}
          className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FlagType)}
          className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
        >
          <option value="all">All Types</option>
          <option value="medical">Medical</option>
          <option value="compliance">Compliance</option>
          <option value="behavioral">Behavioral</option>
        </select>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => (
          <div
            key={flag.id}
            className={`bg-white dark:bg-stone-900 rounded-xl border overflow-hidden ${
              flag.status === "pending" && flag.severity === "high"
                ? "border-red-300 dark:border-red-800"
                : "border-stone-200 dark:border-stone-800"
            }`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      flag.type === "medical"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-brown-100 dark:bg-brown-900/30"
                    }`}
                  >
                    {flag.type === "medical" ? (
                      <Heart className="w-5 h-5 text-red-600" />
                    ) : (
                      <Activity className="w-5 h-5 text-brown-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                        {flag.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getSeverityColor(flag.severity)}`}
                      >
                        {flag.severity}
                      </span>
                    </div>
                    <Link
                      href={`/admin/clients/${flag.clientId}`}
                      className="text-sm text-brown-500 hover:text-brown-600 flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      {flag.clientName}
                    </Link>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                      {flag.description}
                    </p>

                    {flag.restrictions && flag.restrictions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-stone-500 mb-1.5">
                          Recommended Restrictions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {flag.restrictions.map((restriction, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full"
                            >
                              <Shield className="w-3 h-3" />
                              {restriction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-1.5 text-sm text-stone-500">
                    {getStatusIcon(flag.status)}
                    <span className="capitalize">{flag.status}</span>
                  </div>
                  <span className="text-xs text-stone-400">
                    {formatDate(flag.dateCreated)}
                  </span>
                </div>
              </div>

              {/* Acknowledgment Info */}
              {flag.status !== "pending" && flag.acknowledgedNotes && (
                <div className="mt-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <p className="text-xs text-stone-500 mb-1">
                    Acknowledged by {flag.acknowledgedBy} on{" "}
                    {formatDate(flag.acknowledgedDate!)}
                  </p>
                  <p className="text-sm text-stone-700 dark:text-stone-300">
                    {flag.acknowledgedNotes}
                  </p>
                </div>
              )}

              {/* Actions for Pending Flags */}
              {flag.status === "pending" && (
                <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                  {selectedFlag === flag.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={acknowledgeNotes}
                        onChange={(e) => setAcknowledgeNotes(e.target.value)}
                        placeholder="Add notes about how you're addressing this flag..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcknowledge(flag.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-brown-500 text-white rounded-lg text-sm font-medium hover:bg-brown-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                          Acknowledge Flag
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFlag(null);
                            setAcknowledgeNotes("");
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFlag(flag.id)}
                        className="px-4 py-2 bg-brown-500 text-white rounded-lg text-sm font-medium hover:bg-brown-600"
                      >
                        Acknowledge
                      </button>
                      <Link
                        href={`/admin/clients/${flag.clientId}`}
                        className="px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                      >
                        View Client
                      </Link>
                      <Link
                        href="/admin/messages"
                        className="px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Actions for Acknowledged Flags */}
              {flag.status === "acknowledged" && (
                <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                  <button
                    onClick={() => handleResolve(flag.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Mark as Resolved
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredFlags.length === 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-stone-600 dark:text-stone-400">
              {flags.length === 0
                ? "No risk flags have been created yet."
                : "No risk flags match your filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
