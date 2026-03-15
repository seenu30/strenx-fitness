"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Activity,
  Target,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ClientRow {
  id: string;
  status: string;
  user_id: string;
  users: { first_name: string; last_name: string };
}

interface CheckinRow {
  id: string;
  created_at: string;
  coach_reviewed: boolean;
  clients: { user_id: string; users: { first_name: string; last_name: string } };
}

interface RiskFlagRow {
  id: string;
  flag_type: string;
  severity: string;
  description: string;
  created_at: string;
  clients: { user_id: string; users: { first_name: string; last_name: string } };
}

interface ComplianceCheckinRow {
  checkin_date: string;
}

interface PaymentRow {
  amount: number;
}

interface SubscriptionRow {
  id: string;
  status: string;
  end_date: string | null;
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  pendingCheckins: number;
  riskFlags: number;
  avgCompliance: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  activePlans: number;
  renewalsDue: number;
  pendingPayments: number;
  expiringThisWeek: number;
}

interface RecentCheckin {
  id: string;
  clientName: string;
  type: "daily" | "weekly";
  time: string;
  status: "pending" | "reviewed";
}

interface RiskFlag {
  id: string;
  clientName: string;
  type: string;
  severity: string;
  description: string;
  date: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingCheckins: 0,
    riskFlags: 0,
    avgCompliance: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    activePlans: 0,
    renewalsDue: 0,
    pendingPayments: 0,
    expiringThisWeek: 0,
  });
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [complianceData, setComplianceData] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ]);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();

      try {
        // Get coach info
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

        const coachId = coach.id;

        const { data: clients } = await (supabase as SupabaseClient)
          .from("clients")
          .select("id, status, user_id, users!inner(first_name, last_name)")
          .eq("coach_id", coachId);

        const totalClients = clients?.length || 0;
        const activeClients = (clients as ClientRow[] | null)?.filter((c) => c.status === "active").length || 0;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Get client IDs for this coach
        const clientIds = (clients as ClientRow[] | null)?.map(c => c.id) || [];

        const { data: dailyCheckins } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select(`
            id,
            created_at,
            coach_reviewed,
            clients!inner(user_id, users!inner(first_name, last_name))
          `)
          .in("client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .gte("created_at", yesterday.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        const { data: weeklyCheckins } = await (supabase as SupabaseClient)
          .from("weekly_checkins")
          .select(`
            id,
            created_at,
            coach_reviewed,
            clients!inner(user_id, users!inner(first_name, last_name))
          `)
          .in("client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .gte("created_at", yesterday.toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        // Combine and format recent check-ins
        const allCheckins: RecentCheckin[] = [];

        (dailyCheckins as CheckinRow[] | null)?.forEach((checkin) => {
          const clientData = checkin.clients;
          allCheckins.push({
            id: checkin.id,
            clientName: `${clientData.users.first_name} ${clientData.users.last_name}`,
            type: "daily",
            time: formatTimeAgo(new Date(checkin.created_at)),
            status: checkin.coach_reviewed ? "reviewed" : "pending",
          });
        });

        (weeklyCheckins as CheckinRow[] | null)?.forEach((checkin) => {
          const clientData = checkin.clients;
          allCheckins.push({
            id: checkin.id,
            clientName: `${clientData.users.first_name} ${clientData.users.last_name}`,
            type: "weekly",
            time: formatTimeAgo(new Date(checkin.created_at)),
            status: checkin.coach_reviewed ? "reviewed" : "pending",
          });
        });

        // Sort by time and take top 5 (most recent first)
        allCheckins.sort(() => 0);

        const pendingCount = allCheckins.filter(c => c.status === "pending").length;

        const { data: flags } = await (supabase as SupabaseClient)
          .from("risk_flags")
          .select(`
            id,
            flag_type,
            severity,
            description,
            created_at,
            clients!inner(user_id, users!inner(first_name, last_name))
          `)
          .in("client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        const formattedFlags: RiskFlag[] = ((flags || []) as unknown as RiskFlagRow[]).map((flag) => {
          const clientData = flag.clients;
          return {
            id: flag.id,
            clientName: `${clientData.users.first_name} ${clientData.users.last_name}`,
            type: flag.flag_type,
            severity: flag.severity,
            description: flag.description,
            date: formatDateAgo(new Date(flag.created_at)),
          };
        });

        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const { data: complianceCheckins } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select("checkin_date")
          .in("client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .gte("checkin_date", fourWeeksAgo.toISOString().split('T')[0]);

        // Calculate compliance per day for each week
        const weeklyCompliance: number[][] = [];
        for (let week = 0; week < 4; week++) {
          const weekData: number[] = [];
          for (let day = 0; day < 7; day++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - (week * 7) - (6 - day));
            const dateStr = targetDate.toISOString().split('T')[0];

            const checkinsOnDay = (complianceCheckins as ComplianceCheckinRow[] | null)?.filter((c) => c.checkin_date === dateStr).length || 0;
            const compliancePercent = activeClients > 0
              ? Math.round((checkinsOnDay / activeClients) * 100)
              : 0;
            weekData.push(Math.min(compliancePercent, 100));
          }
          weeklyCompliance.push(weekData);
        }

        // Calculate average compliance
        const allComplianceValues = weeklyCompliance.flat();
        const avgCompliance = allComplianceValues.length > 0
          ? Math.round(allComplianceValues.reduce((a, b) => a + b, 0) / allComplianceValues.length)
          : 0;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: payments } = await (supabase as SupabaseClient)
          .from("payments")
          .select("amount, subscriptions!inner(client_id)")
          .in("subscriptions.client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .eq("status", "completed")
          .gte("payment_date", startOfMonth.toISOString());

        const monthlyRevenue = (payments as PaymentRow[] | null)?.reduce((sum: number, p) => sum + (p.amount || 0), 0) || 0;

        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);

        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);

        const { data: lastMonthPayments } = await (supabase as SupabaseClient)
          .from("payments")
          .select("amount, subscriptions!inner(client_id)")
          .in("subscriptions.client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .eq("status", "completed")
          .gte("payment_date", startOfLastMonth.toISOString())
          .lte("payment_date", endOfLastMonth.toISOString());

        const lastMonthRevenue = (lastMonthPayments as PaymentRow[] | null)?.reduce((sum: number, p) => sum + (p.amount || 0), 0) || 0;

        const { data: subscriptions } = await (supabase as SupabaseClient)
          .from("subscriptions")
          .select("id, status, end_date")
          .in("client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']);

        // Count active plans
        const activePlans = (subscriptions as SubscriptionRow[] | null)?.filter((s) => s.status === "active").length || 0;

        // Count renewals due (subscriptions ending in next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const renewalsDue = (subscriptions as SubscriptionRow[] | null)?.filter((s) => {
          if (s.status !== "active" || !s.end_date) return false;
          const endDate = new Date(s.end_date);
          return endDate <= thirtyDaysFromNow;
        }).length || 0;

        // Count expiring this week
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const expiringThisWeek = (subscriptions as SubscriptionRow[] | null)?.filter((s) => {
          if (s.status !== "active" || !s.end_date) return false;
          const endDate = new Date(s.end_date);
          return endDate <= oneWeekFromNow;
        }).length || 0;

        const { data: pendingPaymentsList } = await (supabase as SupabaseClient)
          .from("payments")
          .select("id, subscriptions!inner(client_id)")
          .in("subscriptions.client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
          .eq("status", "pending");

        const pendingPayments = pendingPaymentsList?.length || 0;

        setStats({
          totalClients,
          activeClients,
          pendingCheckins: pendingCount,
          riskFlags: flags?.length || 0,
          avgCompliance,
          monthlyRevenue,
          lastMonthRevenue,
          activePlans,
          renewalsDue,
          pendingPayments,
          expiringThisWeek,
        });
        setRecentCheckins(allCheckins.slice(0, 5));
        setRiskFlags(formattedFlags);
        setComplianceData(weeklyCompliance);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
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

  function formatDateAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  }
  const getComplianceColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 80) return "bg-green-400";
    if (value >= 70) return "bg-primary/80";
    if (value >= 60) return "bg-primary";
    return "bg-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your clients.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{stats.totalClients} total</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.activeClients}
          </p>
          <p className="text-sm text-muted-foreground">Active Clients</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            {stats.pendingCheckins > 0 && (
              <span className="text-xs text-primary font-medium">Needs attention</span>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.pendingCheckins}
          </p>
          <p className="text-sm text-muted-foreground">Pending Check-ins</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.avgCompliance}%
          </p>
          <p className="text-sm text-muted-foreground">Avg Compliance</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <Link
              href="/coach/risk-flags"
              className="text-xs text-red-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.riskFlags}
          </p>
          <p className="text-sm text-muted-foreground">Risk Flags</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Compliance Heatmap */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-foreground">
                Compliance Heatmap
              </h2>
              <p className="text-sm text-muted-foreground">Last 4 weeks overview</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded bg-red-500" />
                <div className="w-3 h-3 rounded bg-primary" />
                <div className="w-3 h-3 rounded bg-primary/80" />
                <div className="w-3 h-3 rounded bg-green-400" />
                <div className="w-3 h-3 rounded bg-green-500" />
              </div>
              <span>High</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Day labels */}
            <div className="flex gap-2 pl-16">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex-1 text-center text-xs text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {complianceData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex items-center gap-2">
                <span className="w-14 text-xs text-muted-foreground text-right">
                  Week {4 - weekIndex}
                </span>
                <div className="flex-1 flex gap-2">
                  {week.map((value, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`flex-1 h-8 rounded ${getComplianceColor(value)} flex items-center justify-center`}
                      title={`${value}% compliance`}
                    >
                      <span className="text-xs font-medium text-white">
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Flags */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Active Risk Flags
            </h2>
            <Link
              href="/coach/risk-flags"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {riskFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active risk flags</p>
            ) : riskFlags.map((flag) => (
              <div
                key={flag.id}
                className="p-3 rounded-lg border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">
                    {flag.clientName}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(flag.severity)}`}
                  >
                    {flag.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {flag.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{flag.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Check-ins and Revenue */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Recent Check-ins
            </h2>
            <Link
              href="/coach/clients"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent check-ins</p>
            ) : recentCheckins.map((checkin) => (
              <div
                key={checkin.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {checkin.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {checkin.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {checkin.type === "weekly" ? "Weekly" : "Daily"} check-in
                      &bull; {checkin.time}
                    </p>
                  </div>
                </div>
                {checkin.status === "pending" ? (
                  <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    Pending
                  </span>
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Revenue Overview
            </h2>
            <Link
              href="/coach/subscriptions"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary to-primary/80">
              <div className="flex items-center gap-2 text-primary-foreground/80 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">This Month</span>
              </div>
              <p className="text-3xl font-bold text-primary-foreground">
                ₹{stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-primary-foreground/80 mt-1">
                {stats.lastMonthRevenue > 0 ? (
                  <>
                    {stats.monthlyRevenue >= stats.lastMonthRevenue ? "+" : ""}
                    {Math.round(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)}% from last month
                  </>
                ) : (
                  stats.monthlyRevenue > 0 ? "First month tracking" : "No revenue yet"
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Active Plans</p>
                <p className="text-xl font-bold text-foreground">
                  {stats.activePlans}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Renewals Due</p>
                <p className="text-xl font-bold text-foreground">
                  {stats.renewalsDue}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending Payments</span>
                <span className="font-medium text-primary">{stats.pendingPayments} client{stats.pendingPayments !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Expiring This Week</span>
                <span className="font-medium text-red-600">{stats.expiringThisWeek} client{stats.expiringThisWeek !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/coach/clients"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Users className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">
              View Clients
            </span>
          </Link>
          <Link
            href="/coach/plans/create"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Activity className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Create Plan
            </span>
          </Link>
          <Link
            href="/coach/risk-flags"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Review Flags
            </span>
          </Link>
          <Link
            href="/coach/analytics"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">
              View Analytics
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
