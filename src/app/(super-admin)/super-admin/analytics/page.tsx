"use client";

import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
  totalCoaches: number;
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  activeSubscriptions: number;
  avgComplianceRate: number;
  newClientsThisMonth: number;
  churnRate: number;
}

export default function SuperAdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCoaches: 0,
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    previousMonthRevenue: 0,
    activeSubscriptions: 0,
    avgComplianceRate: 0,
    newClientsThisMonth: 0,
    churnRate: 0,
  });

  useEffect(() => {
    async function loadAnalytics() {
      const supabase = createClient();

      try {
        // Get coaches count
        const { count: coachCount } = await supabase
          .from("coaches")
          .select("id", { count: "exact" });

        // Get clients count
        const { count: clientCount } = await supabase
          .from("clients")
          .select("id", { count: "exact" });

        // Get active clients
        const { count: activeClientCount } = await supabase
          .from("clients")
          .select("id", { count: "exact" })
          .eq("status", "active");

        // Get subscriptions
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, status") as { data: { id: string; status: string }[] | null };

        const activeSubscriptions = subscriptions?.filter(s => s.status === "active").length || 0;

        // Get revenue
        const { data: allPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed") as { data: { amount: number }[] | null };

        const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Get this month's revenue
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthlyPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("payment_date", startOfMonth.toISOString()) as { data: { amount: number }[] | null };

        const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Get last month's revenue
        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

        const { data: lastMonthPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("payment_date", startOfLastMonth.toISOString())
          .lt("payment_date", startOfMonth.toISOString()) as { data: { amount: number }[] | null };

        const previousMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Get new clients this month
        const { count: newClients } = await supabase
          .from("clients")
          .select("id", { count: "exact" })
          .gte("created_at", startOfMonth.toISOString());

        setAnalytics({
          totalCoaches: coachCount || 0,
          totalClients: clientCount || 0,
          activeClients: activeClientCount || 0,
          totalRevenue,
          monthlyRevenue,
          previousMonthRevenue,
          activeSubscriptions,
          avgComplianceRate: 0, // Would need daily_checkins data
          newClientsThisMonth: newClients || 0,
          churnRate: 0, // Would need historical data
        });
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, [timeRange]);

  const revenueChange = analytics.previousMonthRevenue > 0
    ? ((analytics.monthlyRevenue - analytics.previousMonthRevenue) / analytics.previousMonthRevenue) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform performance and growth metrics
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "12m"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.totalCoaches}</p>
          <p className="text-sm text-muted-foreground">Total Coaches</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            {analytics.newClientsThisMonth > 0 && (
              <span className="flex items-center text-xs text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                +{analytics.newClientsThisMonth}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.totalClients}</p>
          <p className="text-sm text-muted-foreground">Total Clients</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.activeSubscriptions}</p>
          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            {revenueChange !== 0 && (
              <span className={`flex items-center text-xs ${revenueChange > 0 ? "text-green-600" : "text-red-600"}`}>
                {revenueChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">₹{analytics.monthlyRevenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 text-white/80 mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm">Total Platform Revenue</span>
        </div>
        <p className="text-4xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
        <p className="text-sm text-white/70 mt-2">
          Lifetime earnings across all coaches
        </p>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Revenue chart visualization would go here</p>
          </div>
        </div>

        {/* Client Growth */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Client Growth</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Client growth chart would go here</p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-2">Active Rate</h3>
          <p className="text-3xl font-bold text-foreground">
            {analytics.totalClients > 0
              ? Math.round((analytics.activeClients / analytics.totalClients) * 100)
              : 0}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {analytics.activeClients} of {analytics.totalClients} clients active
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-2">Avg Clients per Coach</h3>
          <p className="text-3xl font-bold text-foreground">
            {analytics.totalCoaches > 0
              ? Math.round(analytics.totalClients / analytics.totalCoaches)
              : 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Across {analytics.totalCoaches} coaches
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-2">Avg Revenue per Client</h3>
          <p className="text-3xl font-bold text-foreground">
            ₹{analytics.totalClients > 0
              ? Math.round(analytics.totalRevenue / analytics.totalClients).toLocaleString()
              : 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Lifetime value
          </p>
        </div>
      </div>
    </div>
  );
}
