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
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        // Get coach's tenant_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: coach } = await (supabase as any)
          .from("coaches")
          .select("id, tenant_id")
          .eq("user_id", user.id)
          .single();

        const tenantId = coach?.tenant_id;

        // 1. Get client counts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: clients } = await (supabase as any)
          .from("clients")
          .select("id, status, user_id, users!inner(first_name, last_name)")
          .eq("tenant_id", tenantId);

        const totalClients = clients?.length || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeClients = clients?.filter((c: any) => c.status === "active").length || 0;

        // 2. Get recent daily check-ins (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dailyCheckins } = await (supabase as any)
          .from("daily_checkins")
          .select(`
            id,
            created_at,
            coach_reviewed,
            clients!inner(user_id, users!inner(first_name, last_name))
          `)
          .eq("tenant_id", tenantId)
          .gte("created_at", yesterday.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        // 3. Get recent weekly check-ins
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: weeklyCheckins } = await (supabase as any)
          .from("weekly_checkins")
          .select(`
            id,
            created_at,
            coach_reviewed,
            clients!inner(user_id, users!inner(first_name, last_name))
          `)
          .eq("tenant_id", tenantId)
          .gte("created_at", yesterday.toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        // Combine and format recent check-ins
        const allCheckins: RecentCheckin[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dailyCheckins?.forEach((checkin: any) => {
          const clientData = checkin.clients as { users: { first_name: string; last_name: string } };
          allCheckins.push({
            id: checkin.id,
            clientName: `${clientData.users.first_name} ${clientData.users.last_name}`,
            type: "daily",
            time: formatTimeAgo(new Date(checkin.created_at)),
            status: checkin.coach_reviewed ? "reviewed" : "pending",
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        weeklyCheckins?.forEach((checkin: any) => {
          const clientData = checkin.clients as { users: { first_name: string; last_name: string } };
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

        // 4. Get active risk flags
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: flags } = await (supabase as any)
          .from("risk_flags")
          .select(`
            id,
            flag_type,
            severity,
            description,
            created_at,
            clients!inner(user_id, users!inner(first_name, last_name))
          `)
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedFlags: RiskFlag[] = (flags || []).map((flag: any) => {
          const clientData = flag.clients as { users: { first_name: string; last_name: string } };
          return {
            id: flag.id,
            clientName: `${clientData.users.first_name} ${clientData.users.last_name}`,
            type: flag.flag_type,
            severity: flag.severity,
            description: flag.description,
            date: formatDateAgo(new Date(flag.created_at)),
          };
        });

        // 5. Calculate compliance for last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: complianceCheckins } = await (supabase as any)
          .from("daily_checkins")
          .select("checkin_date")
          .eq("tenant_id", tenantId)
          .gte("checkin_date", fourWeeksAgo.toISOString().split('T')[0]);

        // Calculate compliance per day for each week
        const weeklyCompliance: number[][] = [];
        for (let week = 0; week < 4; week++) {
          const weekData: number[] = [];
          for (let day = 0; day < 7; day++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - (week * 7) - (6 - day));
            const dateStr = targetDate.toISOString().split('T')[0];

            const checkinsOnDay = complianceCheckins?.filter((c: any) => c.checkin_date === dateStr).length || 0;
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

        // 6. Get monthly revenue
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: payments } = await (supabase as any)
          .from("payments")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("payment_date", startOfMonth.toISOString());

        const monthlyRevenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

        // 7. Get last month's revenue for comparison
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);

        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0); // Last day of previous month
        endOfLastMonth.setHours(23, 59, 59, 999);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: lastMonthPayments } = await (supabase as any)
          .from("payments")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("payment_date", startOfLastMonth.toISOString())
          .lte("payment_date", endOfLastMonth.toISOString());

        const lastMonthRevenue = lastMonthPayments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

        // 8. Get subscription stats
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subscriptions } = await (supabase as any)
          .from("subscriptions")
          .select("id, status, end_date")
          .eq("tenant_id", tenantId);

        // Count active plans
        const activePlans = subscriptions?.filter((s: any) => s.status === "active").length || 0;

        // Count renewals due (subscriptions ending in next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const renewalsDue = subscriptions?.filter((s: any) => {
          if (s.status !== "active" || !s.end_date) return false;
          const endDate = new Date(s.end_date);
          return endDate <= thirtyDaysFromNow;
        }).length || 0;

        // Count expiring this week
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const expiringThisWeek = subscriptions?.filter((s: any) => {
          if (s.status !== "active" || !s.end_date) return false;
          const endDate = new Date(s.end_date);
          return endDate <= oneWeekFromNow;
        }).length || 0;

        // 9. Get pending payments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pendingPaymentsList } = await (supabase as any)
          .from("payments")
          .select("id")
          .eq("tenant_id", tenantId)
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
    if (value >= 70) return "bg-amber-400";
    if (value >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Dashboard Overview
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your clients.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-stone-500 font-medium">{stats.totalClients} total</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-3">
            {stats.activeClients}
          </p>
          <p className="text-sm text-stone-500">Active Clients</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            {stats.pendingCheckins > 0 && (
              <span className="text-xs text-amber-600 font-medium">Needs attention</span>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-3">
            {stats.pendingCheckins}
          </p>
          <p className="text-sm text-stone-500">Pending Check-ins</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-3">
            {stats.avgCompliance}%
          </p>
          <p className="text-sm text-stone-500">Avg Compliance</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <Link
              href="/admin/risk-flags"
              className="text-xs text-red-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-3">
            {stats.riskFlags}
          </p>
          <p className="text-sm text-stone-500">Risk Flags</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Compliance Heatmap */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-stone-800 dark:text-stone-100">
                Compliance Heatmap
              </h2>
              <p className="text-sm text-stone-500">Last 4 weeks overview</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Low</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded bg-red-500" />
                <div className="w-3 h-3 rounded bg-amber-500" />
                <div className="w-3 h-3 rounded bg-amber-400" />
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
                  className="flex-1 text-center text-xs text-stone-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {complianceData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex items-center gap-2">
                <span className="w-14 text-xs text-stone-500 text-right">
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
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">
              Active Risk Flags
            </h2>
            <Link
              href="/admin/risk-flags"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {riskFlags.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">No active risk flags</p>
            ) : riskFlags.map((flag) => (
              <div
                key={flag.id}
                className="p-3 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-stone-800 dark:text-stone-200">
                    {flag.clientName}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(flag.severity)}`}
                  >
                    {flag.severity}
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {flag.description}
                </p>
                <p className="text-xs text-stone-500 mt-2">{flag.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Check-ins and Revenue */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">
              Recent Check-ins
            </h2>
            <Link
              href="/admin/clients"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCheckins.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">No recent check-ins</p>
            ) : recentCheckins.map((checkin) => (
              <div
                key={checkin.id}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      {checkin.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {checkin.clientName}
                    </p>
                    <p className="text-xs text-stone-500">
                      {checkin.type === "weekly" ? "Weekly" : "Daily"} check-in
                      &bull; {checkin.time}
                    </p>
                  </div>
                </div>
                {checkin.status === "pending" ? (
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
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
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">
              Revenue Overview
            </h2>
            <Link
              href="/admin/subscriptions"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
              <div className="flex items-center gap-2 text-amber-100 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">This Month</span>
              </div>
              <p className="text-3xl font-bold text-white">
                ₹{stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-amber-100 mt-1">
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
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p className="text-sm text-stone-500 mb-1">Active Plans</p>
                <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                  {stats.activePlans}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p className="text-sm text-stone-500 mb-1">Renewals Due</p>
                <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                  {stats.renewalsDue}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Pending Payments</span>
                <span className="font-medium text-amber-600">{stats.pendingPayments} client{stats.pendingPayments !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-stone-500">Expiring This Week</span>
                <span className="font-medium text-red-600">{stats.expiringThisWeek} client{stats.expiringThisWeek !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/clients/invite"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <Users className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Invite Client
            </span>
          </Link>
          <Link
            href="/admin/plans/create"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <Activity className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Create Plan
            </span>
          </Link>
          <Link
            href="/admin/risk-flags"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Review Flags
            </span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              View Analytics
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
