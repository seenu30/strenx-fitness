"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ClientRow {
  id: string;
  status: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

interface SubscriptionRow {
  client_id: string;
  start_date: string;
  end_date: string;
  subscription_plans: {
    name: string;
  };
}

interface RiskFlagRow {
  client_id: string;
}

interface CheckinRow {
  client_id: string;
  created_at?: string;
  checkin_date?: string;
  morning_weight_kg?: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  startDate: string;
  endDate: string;
  compliance: number;
  weightChange: number;
  lastCheckin: string;
  riskFlags: number;
}

type ClientStatus = "all" | "active" | "paused" | "completed" | "pending";
type SortField = "name" | "compliance" | "lastCheckin" | "startDate";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: coach } = await (supabase as SupabaseClient)
          .from("coaches")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!coach) {
          setIsLoading(false);
          return;
        }

        const { data: clientsData } = await (supabase as SupabaseClient)
          .from("clients")
          .select(`
            id,
            status,
            created_at,
            users!inner(first_name, last_name, email, phone)
          `)
          .eq("coach_id", coach.id);

        if (!clientsData || clientsData.length === 0) {
          setClients([]);
          setIsLoading(false);
          return;
        }

        const typedClientsData = clientsData as unknown as ClientRow[];
        const { data: subscriptions } = await (supabase as SupabaseClient)
          .from("subscriptions")
          .select(`
            client_id,
            start_date,
            end_date,
            subscription_plans!inner(name)
          `)
          .in("client_id", typedClientsData.map((c) => c.id));

        const { data: riskFlagsData } = await (supabase as SupabaseClient)
          .from("risk_flags")
          .select("client_id")
          .eq("is_active", true)
          .in("client_id", typedClientsData.map((c) => c.id));

        const { data: lastCheckins } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select("client_id, created_at")
          .in("client_id", typedClientsData.map((c) => c.id))
          .order("created_at", { ascending: false });

        const { data: weights } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select("client_id, morning_weight_kg, checkin_date")
          .not("morning_weight_kg", "is", null)
          .in("client_id", typedClientsData.map((c) => c.id))
          .order("checkin_date", { ascending: true });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentCheckins } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select("client_id, checkin_date")
          .gte("checkin_date", sevenDaysAgo.toISOString().split('T')[0])
          .in("client_id", typedClientsData.map((c) => c.id));

        const typedSubscriptions = (subscriptions || []) as unknown as SubscriptionRow[];
        const typedRiskFlags = (riskFlagsData || []) as unknown as RiskFlagRow[];
        const typedLastCheckins = (lastCheckins || []) as unknown as CheckinRow[];
        const typedRecentCheckins = (recentCheckins || []) as unknown as CheckinRow[];
        const typedWeights = (weights || []) as unknown as CheckinRow[];

        const formattedClients: Client[] = typedClientsData.map((client) => {
          const userData = client.users;

          const subscription = typedSubscriptions.find((s) => s.client_id === client.id);
          const planData = subscription?.subscription_plans;

          const riskFlagCount = typedRiskFlags.filter((f) => f.client_id === client.id).length;

          const lastCheckinData = typedLastCheckins.find((c) => c.client_id === client.id);
          const lastCheckinStr = lastCheckinData?.created_at
            ? formatTimeAgo(new Date(lastCheckinData.created_at))
            : "Never";

          const clientRecentCheckins = typedRecentCheckins.filter((c) => c.client_id === client.id).length;
          const compliance = Math.round((clientRecentCheckins / 7) * 100);

          const clientWeights = typedWeights.filter((w) => w.client_id === client.id);
          let weightChange = 0;
          if (clientWeights.length >= 2) {
            const firstWeight = clientWeights[0].morning_weight_kg || 0;
            const lastWeight = clientWeights[clientWeights.length - 1].morning_weight_kg || 0;
            weightChange = Number((lastWeight - firstWeight).toFixed(1));
          }

          return {
            id: client.id,
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            phone: userData.phone || "",
            status: client.status || "active",
            plan: planData?.name || "No plan",
            startDate: subscription?.start_date || client.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            endDate: subscription?.end_date || "",
            compliance,
            weightChange,
            lastCheckin: lastCheckinStr,
            riskFlags: riskFlagCount,
          };
        });

        setClients(formattedClients);
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadClients();
  }, []);

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "compliance":
        comparison = a.compliance - b.compliance;
        break;
      case "startDate":
        comparison =
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        break;
      default:
        comparison = 0;
    }
    return sortAsc ? comparison : -comparison;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            <Clock className="w-3 h-3" />
            Paused
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 85) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (compliance >= 70) return "text-primary bg-primary/10";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  const getWeightChangeIcon = (change: number) => {
    if (change < 0)
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusCounts = {
    all: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    paused: clients.filter((c) => c.status === "paused").length,
    completed: clients.filter((c) => c.status === "completed").length,
    pending: clients.filter((c) => c.status === "pending").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your client roster and track their progress
          </p>
        </div>
        <Link
          href="/admin/clients/invite"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Client
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "active", "paused", "completed", "pending"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border"
              }`}
            >
              {status} ({statusCounts[status]})
            </button>
          )
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted"
        >
          <Filter className="w-4 h-4" />
          Sort
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Sort Options */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-card rounded-lg border border-border">
          <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
          {[
            { field: "name", label: "Name" },
            { field: "compliance", label: "Compliance" },
            { field: "startDate", label: "Start Date" },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => {
                if (sortField === field) {
                  setSortAsc(!sortAsc);
                } else {
                  setSortField(field as SortField);
                  setSortAsc(true);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                sortField === field
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label} {sortField === field && (sortAsc ? "↑" : "↓")}
            </button>
          ))}
        </div>
      )}

      {/* Client List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                  Client
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                  Plan
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">
                  Compliance
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">
                  Weight
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                  Last Check-in
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">
                  Flags
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-foreground">
                      {client.plan}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(client.startDate)} - {formatDate(client.endDate)}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(client.status)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-sm font-medium ${getComplianceColor(client.compliance)}`}
                    >
                      {client.compliance}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-1">
                      {getWeightChangeIcon(client.weightChange)}
                      <span
                        className={`text-sm font-medium ${
                          client.weightChange < 0
                            ? "text-green-600"
                            : client.weightChange > 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {client.weightChange > 0 ? "+" : ""}
                        {client.weightChange} kg
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-muted-foreground">
                      {client.lastCheckin}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {client.riskFlags > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        {client.riskFlags}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`mailto:${client.email}`}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="px-3 py-1 text-sm text-primary hover:text-primary/80 font-medium"
                      >
                        View
                      </Link>
                      <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No clients found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
