"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Activity,
  UserPlus,
  Loader2,
  BarChart3,
  Shield,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalCoaches: number;
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activePlans: number;
  totalSubscriptions: number;
}

interface RecentCoach {
  id: string;
  name: string;
  email: string;
  clientCount: number;
  createdAt: string;
}

interface RecentSubscription {
  id: string;
  clientName: string;
  planName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCoaches: 0,
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activePlans: 0,
    totalSubscriptions: 0,
  });
  const [recentCoaches, setRecentCoaches] = useState<RecentCoach[]>([]);
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();

      try {
        // Get total coaches
        const { data: coaches, count: coachCount } = await supabase
          .from("coaches")
          .select(`
            id,
            user_id,
            created_at,
            users!inner(first_name, last_name, email)
          `, { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(5);

        // Get total clients
        const { count: clientCount } = await supabase
          .from("clients")
          .select("id", { count: "exact" });

        // Get active clients
        const { count: activeClientCount } = await supabase
          .from("clients")
          .select("id", { count: "exact" })
          .eq("status", "active");

        // Get subscription stats
        const { data: subscriptions, count: subscriptionCount } = await supabase
          .from("subscriptions")
          .select(`
            id,
            status,
            amount,
            created_at,
            clients!inner(user_id, users!inner(first_name, last_name)),
            subscription_plans(name)
          `, { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(5) as { data: { status: string; amount: number }[] | null; count: number | null };

        const activePlans = subscriptions?.filter(s => s.status === "active").length || 0;

        // Get revenue data
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthlyPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("payment_date", startOfMonth.toISOString()) as { data: { amount: number }[] | null };

        const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const { data: allPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed") as { data: { amount: number }[] | null };

        const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Format recent coaches
        interface CoachData {
          id: string;
          user_id: string;
          created_at: string;
          users: { first_name: string; last_name: string; email: string };
        }

        const formattedCoaches: RecentCoach[] = [];
        for (const coach of (coaches as CoachData[] || [])) {
          // Get client count for this coach
          const { count } = await supabase
            .from("clients")
            .select("id", { count: "exact" })
            .eq("coach_id", coach.id);

          formattedCoaches.push({
            id: coach.id,
            name: `${coach.users.first_name} ${coach.users.last_name}`,
            email: coach.users.email,
            clientCount: count || 0,
            createdAt: formatDate(new Date(coach.created_at)),
          });
        }

        // Format recent subscriptions
        interface SubscriptionData {
          id: string;
          status: string;
          amount: number;
          created_at: string;
          clients: { user_id: string; users: { first_name: string; last_name: string } };
          subscription_plans: { name: string } | null;
        }

        const formattedSubscriptions: RecentSubscription[] = (subscriptions as SubscriptionData[] || []).map(sub => ({
          id: sub.id,
          clientName: `${sub.clients.users.first_name} ${sub.clients.users.last_name}`,
          planName: sub.subscription_plans?.name || "Custom Plan",
          amount: sub.amount || 0,
          status: sub.status,
          createdAt: formatDate(new Date(sub.created_at)),
        }));

        setStats({
          totalCoaches: coachCount || 0,
          totalClients: clientCount || 0,
          activeClients: activeClientCount || 0,
          totalRevenue,
          monthlyRevenue,
          activePlans,
          totalSubscriptions: subscriptionCount || 0,
        });
        setRecentCoaches(formattedCoaches);
        setRecentSubscriptions(formattedSubscriptions);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          System Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage the entire Strenx platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.totalCoaches}
          </p>
          <p className="text-sm text-muted-foreground">Total Coaches</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {stats.activeClients} active
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.totalClients}
          </p>
          <p className="text-sm text-muted-foreground">Total Clients</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.activePlans}
          </p>
          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-3">
            {stats.totalSubscriptions}
          </p>
          <p className="text-sm text-muted-foreground">Total Subscriptions</p>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Total Platform Revenue</span>
          </div>
          <p className="text-4xl font-bold">
            ₹{stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-white/70 mt-2">
            Across all coaches and clients
          </p>
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">This Month&apos;s Revenue</span>
          </div>
          <p className="text-4xl font-bold">
            ₹{stats.monthlyRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-white/70 mt-2">
            {stats.totalSubscriptions} total subscriptions
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Coaches */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Recent Coaches
            </h2>
            <Link
              href="/admin/coaches"
              className="text-sm text-violet-600 hover:text-violet-500 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCoaches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No coaches found
              </p>
            ) : (
              recentCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                        {coach.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {coach.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {coach.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {coach.clientCount} clients
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {coach.createdAt}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Recent Subscriptions
            </h2>
            <Link
              href="/admin/plans"
              className="text-sm text-violet-600 hover:text-violet-500 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentSubscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subscriptions found
              </p>
            ) : (
              recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">
                      {sub.clientName}
                    </p>
                    <span className="text-sm font-medium text-green-600">
                      ₹{sub.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{sub.planName}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      sub.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))
            )}
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
            href="/admin/coaches/invite"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-violet-500 hover:bg-violet-500/5 transition-colors"
          >
            <UserPlus className="w-6 h-6 text-violet-500" />
            <span className="text-sm font-medium text-foreground">
              Invite Coach
            </span>
          </Link>
          <Link
            href="/admin/plans"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-violet-500 hover:bg-violet-500/5 transition-colors"
          >
            <CreditCard className="w-6 h-6 text-violet-500" />
            <span className="text-sm font-medium text-foreground">
              Manage Plans
            </span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-violet-500 hover:bg-violet-500/5 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-violet-500" />
            <span className="text-sm font-medium text-foreground">
              View Analytics
            </span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-violet-500 hover:bg-violet-500/5 transition-colors"
          >
            <Activity className="w-6 h-6 text-violet-500" />
            <span className="text-sm font-medium text-foreground">
              System Settings
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
