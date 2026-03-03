"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

interface Metrics {
  totalClients: { value: number; change: number };
  activeClients: { value: number; change: number };
  avgCompliance: { value: number; change: number };
  churnRate: { value: number; change: number };
  monthlyRevenue: { value: number; change: number };
  avgClientDuration: { value: number; change: number };
}

interface TopClient {
  name: string;
  compliance: number;
  weightLost: number;
  plan: string;
}

interface PlanDistribution {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
}

interface TrendData {
  compliance: number[];
  revenue: number[];
  clients: number[];
}

type TimeRange = "7d" | "30d" | "90d" | "12m";

interface CoachData {
  id: string;
}

interface UserData {
  first_name: string;
  last_name: string;
}

interface PlanTemplate {
  name: string;
  price: number;
}

interface Subscription {
  id: string;
  status: string;
  plan_templates: PlanTemplate | null;
}

interface ClientData {
  id: string;
  user_id: string;
  status: string;
  start_date: string | null;
  created_at: string;
  users: UserData | null;
  subscriptions: Subscription[] | null;
}

interface CheckinData {
  client_id: string;
  created_at: string;
}

interface WeightData {
  weight: number;
  created_at: string;
}

interface PaymentData {
  amount: number;
  payment_date?: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    totalClients: { value: 0, change: 0 },
    activeClients: { value: 0, change: 0 },
    avgCompliance: { value: 0, change: 0 },
    churnRate: { value: 0, change: 0 },
    monthlyRevenue: { value: 0, change: 0 },
    avgClientDuration: { value: 0, change: 0 },
  });
  const [trends, setTrends] = useState<TrendData>({
    compliance: [],
    revenue: [],
    clients: [],
  });
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);

  const supabase = createClient();

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single() as { data: CoachData | null };

      if (!coach) return;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calculate date ranges based on timeRange
      let daysBack = 30;
      if (timeRange === "7d") daysBack = 7;
      else if (timeRange === "90d") daysBack = 90;
      else if (timeRange === "12m") daysBack = 365;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysBack);

      const { data: clients } = await supabase
        .from("clients")
        .select(`
          id,
          user_id,
          status,
          start_date,
          created_at,
          users!inner(first_name, last_name),
          subscriptions(
            id,
            status,
            plan_templates(name, price)
          )
        `)
        .eq("coach_id", coach.id) as { data: ClientData[] | null };

      const allClients: ClientData[] = clients || [];
      const totalClients = allClients.length;
      const activeClients = allClients.filter((c) => c.status === "active").length;

      const clientsInPeriod = allClients.filter((c) =>
        new Date(c.created_at) >= startDate
      ).length;
      const clientsInPreviousPeriod = allClients.filter((c) =>
        new Date(c.created_at) >= previousStartDate && new Date(c.created_at) < startDate
      ).length;
      const clientChange = clientsInPreviousPeriod > 0
        ? ((clientsInPeriod - clientsInPreviousPeriod) / clientsInPreviousPeriod) * 100
        : clientsInPeriod > 0 ? 100 : 0;

      const clientIds = allClients.map((c) => c.id);
      const safeClientIds = clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'];
      const { data: checkins } = await supabase
        .from("daily_checkins")
        .select("client_id, created_at")
        .in("client_id", safeClientIds)
        .gte("created_at", startDate.toISOString()) as { data: CheckinData[] | null };

      // Calculate average compliance (check-ins per client / days in period)
      const checkinCount = checkins?.length || 0;
      const avgCompliance = totalClients > 0
        ? Math.round((checkinCount / (totalClients * daysBack)) * 100)
        : 0;

      const { data: previousCheckins } = await supabase
        .from("daily_checkins")
        .select("id")
        .in("client_id", safeClientIds)
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString()) as { data: { id: string }[] | null };

      const previousCheckinCount = previousCheckins?.length || 0;
      const previousAvgCompliance = totalClients > 0
        ? Math.round((previousCheckinCount / (totalClients * daysBack)) * 100)
        : 0;
      const complianceChange = previousAvgCompliance > 0
        ? avgCompliance - previousAvgCompliance
        : 0;

      const monthStart = new Date(currentYear, currentMonth, 1);
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, payment_date")
        .in("client_id", safeClientIds)
        .eq("status", "completed")
        .gte("payment_date", monthStart.toISOString()) as { data: PaymentData[] | null };

      const monthlyRevenue = payments?.reduce((sum: number, p: PaymentData) => sum + (p.amount || 0), 0) || 0;

      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const { data: prevPayments } = await supabase
        .from("payments")
        .select("amount")
        .in("client_id", safeClientIds)
        .eq("status", "completed")
        .gte("payment_date", prevMonthStart.toISOString())
        .lt("payment_date", monthStart.toISOString()) as { data: PaymentData[] | null };

      const prevMonthRevenue = prevPayments?.reduce((sum: number, p: PaymentData) => sum + (p.amount || 0), 0) || 0;
      const revenueChange = prevMonthRevenue > 0
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : monthlyRevenue > 0 ? 100 : 0;

      const inactiveClients = allClients.filter((c) => c.status === "inactive").length;
      const churnRate = totalClients > 0 ? (inactiveClients / totalClients) * 100 : 0;

      const durations = allClients
        .filter((c): c is ClientData & { start_date: string } => c.start_date !== null)
        .map((c) => {
          const start = new Date(c.start_date);
          const diff = now.getTime() - start.getTime();
          return Math.floor(diff / (1000 * 60 * 60 * 24));
        });
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      setMetrics({
        totalClients: { value: totalClients, change: Math.round(clientChange * 10) / 10 },
        activeClients: { value: activeClients, change: Math.round(clientChange * 10) / 10 },
        avgCompliance: { value: Math.min(avgCompliance, 100), change: complianceChange },
        churnRate: { value: Math.round(churnRate * 10) / 10, change: 0 },
        monthlyRevenue: { value: monthlyRevenue, change: Math.round(revenueChange * 10) / 10 },
        avgClientDuration: { value: avgDuration, change: 0 },
      });

      // Build 12-month trends
      const revenueTrend: number[] = [];
      const clientTrend: number[] = [];
      const complianceTrend: number[] = [];

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1);

        const { data: monthPayments } = await supabase
          .from("payments")
          .select("amount")
          .in("client_id", safeClientIds)
          .eq("status", "completed")
          .gte("payment_date", monthDate.toISOString())
          .lt("payment_date", nextMonthDate.toISOString()) as { data: PaymentData[] | null };

        const monthRevenue = monthPayments?.reduce((sum: number, p: PaymentData) => sum + (p.amount || 0), 0) || 0;
        revenueTrend.push(monthRevenue);

        const clientsAtMonth = allClients.filter((c) =>
          new Date(c.created_at) <= nextMonthDate
        ).length;
        clientTrend.push(clientsAtMonth);

        const daysInMonth = Math.floor((nextMonthDate.getTime() - monthDate.getTime()) / (1000 * 60 * 60 * 24));
        const { data: monthCheckins } = await supabase
          .from("daily_checkins")
          .select("id")
          .in("client_id", safeClientIds)
          .gte("created_at", monthDate.toISOString())
          .lt("created_at", nextMonthDate.toISOString()) as { data: { id: string }[] | null };

        const monthCheckinCount = monthCheckins?.length || 0;
        const monthCompliance = clientsAtMonth > 0
          ? Math.round((monthCheckinCount / (clientsAtMonth * daysInMonth)) * 100)
          : 0;
        complianceTrend.push(Math.min(monthCompliance, 100));
      }

      setTrends({
        compliance: complianceTrend,
        revenue: revenueTrend,
        clients: clientTrend,
      });

      const topClientsData: TopClient[] = [];
      for (const clientItem of allClients.slice(0, 10)) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: clientCheckins } = await supabase
          .from("daily_checkins")
          .select("id, weight")
          .eq("client_id", clientItem.id)
          .gte("created_at", thirtyDaysAgo.toISOString()) as { data: { id: string; weight: number | null }[] | null };

        const compliance = Math.round(((clientCheckins?.length || 0) / 30) * 100);

        const { data: weightData } = await supabase
          .from("daily_checkins")
          .select("weight, created_at")
          .eq("client_id", clientItem.id)
          .not("weight", "is", null)
          .order("created_at", { ascending: true }) as { data: WeightData[] | null };

        let weightLost = 0;
        if (weightData && weightData.length >= 2) {
          const firstWeight = weightData[0].weight;
          const lastWeight = weightData[weightData.length - 1].weight;
          weightLost = Math.round((firstWeight - lastWeight) * 10) / 10;
        }

        const activeSub = clientItem.subscriptions?.find((s) => s.status === "active");
        const planName = activeSub?.plan_templates?.name || "No Plan";

        topClientsData.push({
          name: `${clientItem.users?.first_name || ""} ${clientItem.users?.last_name || ""}`.trim() || "Unknown",
          compliance: Math.min(compliance, 100),
          weightLost,
          plan: planName,
        });
      }

      // Sort by compliance descending
      topClientsData.sort((a, b) => b.compliance - a.compliance);
      setTopClients(topClientsData.slice(0, 5));

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          plan_templates(name, price)
        `)
        .in("client_id", safeClientIds)
        .eq("status", "active") as { data: Subscription[] | null };

      const planCounts: Record<string, { count: number; revenue: number }> = {};
      (subscriptions || []).forEach((sub) => {
        const planName = sub.plan_templates?.name || "Unknown Plan";
        const price = sub.plan_templates?.price || 0;
        if (!planCounts[planName]) {
          planCounts[planName] = { count: 0, revenue: 0 };
        }
        planCounts[planName].count++;
        planCounts[planName].revenue += price;
      });

      const totalSubs = subscriptions?.length || 0;
      const distribution: PlanDistribution[] = Object.entries(planCounts).map(([name, data]) => ({
        name,
        count: data.count,
        percentage: totalSubs > 0 ? Math.round((data.count / totalSubs) * 100) : 0,
        revenue: data.revenue,
      }));

      distribution.sort((a, b) => b.count - a.count);
      setPlanDistribution(distribution);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderTrendLine = (data: number[], color: string, height: number = 60) => {
    if (data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <svg className="w-full" viewBox={`0 0 ${data.length * 30} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data
            .map((val, i) => {
              const x = i * 30 + 15;
              const y = height - 5 - ((val - min) / range) * (height - 10);
              return `${x},${y}`;
            })
            .join(" ")}
        />
      </svg>
    );
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
            Analytics
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Track your coaching business performance
          </p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "12m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-brown-500 text-white"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
              }`}
            >
              {range === "7d"
                ? "7 Days"
                : range === "30d"
                ? "30 Days"
                : range === "90d"
                ? "90 Days"
                : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            {metrics.totalClients.change !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  metrics.totalClients.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.totalClients.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(metrics.totalClients.change)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {metrics.totalClients.value}
          </p>
          <p className="text-sm text-stone-500">Total Clients</p>
          <div className="mt-3 h-10">{renderTrendLine(trends.clients, "#3b82f6", 40)}</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            {metrics.avgCompliance.change !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  metrics.avgCompliance.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.avgCompliance.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(metrics.avgCompliance.change)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {metrics.avgCompliance.value}%
          </p>
          <p className="text-sm text-stone-500">Avg Compliance</p>
          <div className="mt-3 h-10">{renderTrendLine(trends.compliance, "#22c55e", 40)}</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-brown-100 dark:bg-brown-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-brown-500" />
            </div>
            {metrics.monthlyRevenue.change !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  metrics.monthlyRevenue.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.monthlyRevenue.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(metrics.monthlyRevenue.change)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {formatCurrency(metrics.monthlyRevenue.value)}
          </p>
          <p className="text-sm text-stone-500">Monthly Revenue</p>
          <div className="mt-3 h-10">{renderTrendLine(trends.revenue, "#f59e0b", 40)}</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            {metrics.activeClients.change !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  metrics.activeClients.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.activeClients.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(metrics.activeClients.change)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {metrics.activeClients.value}
          </p>
          <p className="text-sm text-stone-500">Active Clients</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {metrics.churnRate.value}%
          </p>
          <p className="text-sm text-stone-500">Churn Rate</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {metrics.avgClientDuration.value} days
          </p>
          <p className="text-sm text-stone-500">Avg Client Duration</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Revenue Trend
          </h2>
          <div className="h-48 relative">
            {trends.revenue.length > 0 && Math.max(...trends.revenue) > 0 ? (
              <>
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="40"
                      y1={i * 30 + 15}
                      x2="390"
                      y2={i * 30 + 15}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-stone-200 dark:text-stone-700"
                    />
                  ))}

                  {/* Area fill */}
                  {(() => {
                    const maxVal = Math.max(...trends.revenue);
                    const minVal = Math.min(...trends.revenue);
                    const range = maxVal - minVal || 1;
                    return (
                      <>
                        <path
                          d={`
                            M 50,${135 - ((trends.revenue[0] - minVal) / range) * 110}
                            ${trends.revenue.map((val, i) => {
                              const x = (i / (trends.revenue.length - 1)) * 340 + 50;
                              const y = 135 - ((val - minVal) / range) * 110;
                              return `L ${x},${y}`;
                            }).join(" ")}
                            L 390,135
                            L 50,135
                            Z
                          `}
                          fill="url(#revenueGradient)"
                          opacity="0.3"
                        />
                        <defs>
                          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Line */}
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          points={trends.revenue.map((val, i) => {
                            const x = (i / (trends.revenue.length - 1)) * 340 + 50;
                            const y = 135 - ((val - minVal) / range) * 110;
                            return `${x},${y}`;
                          }).join(" ")}
                        />

                        {/* Data points */}
                        {trends.revenue.map((val, i) => {
                          const x = (i / (trends.revenue.length - 1)) * 340 + 50;
                          const y = 135 - ((val - minVal) / range) * 110;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#f59e0b"
                              stroke="white"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-stone-500 px-2">
                  {MONTHS.map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-stone-500">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Plan Distribution
          </h2>
          <div className="space-y-4">
            {planDistribution.length > 0 ? (
              planDistribution.map((plan, index) => {
                const colors = ["bg-brown-500", "bg-blue-500", "bg-green-500", "bg-purple-500"];
                return (
                  <div key={plan.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {plan.name}
                      </span>
                      <span className="text-sm text-stone-500">
                        {plan.count} clients ({plan.percentage}%)
                      </span>
                    </div>
                    <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[index % colors.length]} rounded-full`}
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Revenue: {formatCurrency(plan.revenue)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-stone-500 py-8">
                No active subscriptions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          Top Performing Clients
        </h2>
        <div className="overflow-x-auto">
          {topClients.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left py-3 px-4 font-medium text-stone-500 text-sm">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500 text-sm">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-stone-500 text-sm">
                    Plan
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500 text-sm">
                    Compliance
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500 text-sm">
                    Weight Lost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {topClients.map((client, index) => (
                  <tr key={`${client.name}-${index}`}>
                    <td className="py-3 px-4">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-brown-100 text-brown-600"
                            : index === 1
                            ? "bg-stone-200 text-stone-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {client.name}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-stone-600 dark:text-stone-400">
                      {client.plan}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg text-sm font-medium ${
                          client.compliance >= 90
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : client.compliance >= 80
                            ? "bg-brown-100 text-brown-600 dark:bg-brown-900/30 dark:text-brown-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {client.compliance}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={client.weightLost > 0 ? "text-green-600 font-medium" : "text-stone-500"}>
                        {client.weightLost > 0 ? `-${client.weightLost} kg` : "0 kg"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-stone-500 py-8">
              No client data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
