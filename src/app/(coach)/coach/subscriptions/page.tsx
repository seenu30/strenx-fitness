"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Mail,
  RefreshCw,
  DollarSign,
  Users,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SubscriptionRow {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  clients: {
    id: string;
    user_id: string;
    users: { first_name: string; last_name: string; email: string };
  };
  subscription_plans: { name: string; price_amount: number } | null;
}

interface PaymentRow {
  subscription_id: string;
  status: string;
  payment_date: string;
  amount: number;
}

interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  email: string;
  plan: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  paymentStatus: string;
  lastPaymentDate: string | null;
}

interface ClientOption {
  id: string;
  name: string;
  email: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

type SubStatus = "all" | "active" | "expiring" | "paused" | "pending" | "completed" | "cancelled";
type PaymentStatus = "all" | "paid" | "pending";
type UserRole = "coach" | "admin";

export default function SubscriptionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("all");
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("coach");

  // New subscription modal state
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    loadClientsAndPlans();
  }, []);

  async function loadSubscriptions() {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user role
      const { data: userProfile } = await (supabase as SupabaseClient)
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (userProfile?.role as UserRole) || "coach";
      setUserRole(role);

      let clientIds: string[] = [];

      if (role === "admin") {
        // Admin sees all clients
        const { data: allClients } = await (supabase as SupabaseClient)
          .from("clients")
          .select("id");
        clientIds = (allClients || []).map((c: { id: string }) => c.id);
      } else {
        // Coach sees only their clients
        const { data: coach } = await (supabase as SupabaseClient)
          .from("coaches")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!coach) {
          setIsLoading(false);
          return;
        }

        const { data: coachClients } = await (supabase as SupabaseClient)
          .from("clients")
          .select("id")
          .eq("coach_id", coach.id);

        clientIds = (coachClients || []).map((c: { id: string }) => c.id);
      }

      // Get subscriptions with client info
      const { data: subs, error } = await (supabase as SupabaseClient)
        .from("subscriptions")
        .select(`
          id,
          status,
          start_date,
          end_date,
          clients!inner(
            id,
            user_id,
            users!inner(first_name, last_name, email)
          ),
          subscription_plans(name, price_amount)
        `)
        .in("client_id", clientIds.length > 0 ? clientIds : [""])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
        setIsLoading(false);
        return;
      }

      // Get latest payment for each subscription
      const { data: payments } = await (supabase as SupabaseClient)
        .from("payments")
        .select("subscription_id, status, payment_date, amount")
        .in("client_id", clientIds.length > 0 ? clientIds : [""])
        .order("payment_date", { ascending: false });

      // Map subscriptions to our format
      const formattedSubs: Subscription[] = ((subs || []) as unknown as SubscriptionRow[]).map((sub) => {
        const client = sub.clients;
        const user = client.users;
        const plan = sub.subscription_plans;

        // Find latest payment for this subscription
        const subPayments = ((payments || []) as PaymentRow[]).filter((p) => p.subscription_id === sub.id);
        const latestPayment = subPayments[0];
        const hasPaidPayment = subPayments.some((p) => p.status === "completed");

        // Determine subscription status based on dates
        let status = sub.status;
        const now = new Date();
        const endDate = new Date(sub.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (status === "active" && daysRemaining <= 7 && daysRemaining > 0) {
          status = "expiring";
        } else if (status === "active" && daysRemaining <= 0) {
          status = "completed";
        }

        return {
          id: sub.id,
          clientId: client.id,
          clientName: `${user.first_name} ${user.last_name}`,
          email: user.email,
          plan: plan?.name || "Custom Plan",
          amount: latestPayment?.amount || plan?.price_amount || 0,
          status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          paymentStatus: hasPaidPayment ? "paid" : "pending",
          lastPaymentDate: latestPayment?.payment_date || null,
        };
      });

      setSubscriptions(formattedSubs);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkPaid(subscriptionId: string) {
    setIsProcessing(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get subscription details
      const { data: sub } = await (supabase as SupabaseClient)
        .from("subscriptions")
        .select("client_id, subscription_plans(price_amount)")
        .eq("id", subscriptionId)
        .single();

      if (!sub) return;

      // Create payment record
      await (supabase as SupabaseClient).from("payments").insert({
        client_id: (sub as { client_id: string }).client_id,
        subscription_id: subscriptionId,
        amount: (sub as unknown as { subscription_plans?: { price_amount: number } }).subscription_plans?.price_amount || 0,
        status: "completed",
        payment_method: "manual",
        payment_date: new Date().toISOString(),
        notes: paymentReference || "Manual payment recorded by coach",
      });

      // Update subscription status to active if pending
      await (supabase as SupabaseClient)
        .from("subscriptions")
        .update({ status: "active" })
        .eq("id", subscriptionId)
        .eq("status", "pending");

      // Reload subscriptions
      await loadSubscriptions();
      setShowPaymentModal(null);
      setPaymentReference("");
    } catch (error) {
      console.error("Error marking payment:", error);
    } finally {
      setIsProcessing(false);
    }
  }

  async function loadClientsAndPlans() {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach's clients
      const { data: coach } = await (supabase as SupabaseClient)
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (coach) {
        const { data: clientsData } = await (supabase as SupabaseClient)
          .from("clients")
          .select("id, users!inner(first_name, last_name, email)")
          .eq("coach_id", coach.id);

        if (clientsData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setClients(
            clientsData.map((c: any) => ({
              id: c.id,
              name: `${c.users.first_name} ${c.users.last_name}`,
              email: c.users.email,
            }))
          );
        }
      }

      // Get active plans
      const { data: plansData } = await (supabase as SupabaseClient)
        .from("subscription_plans")
        .select("id, name, price_amount, duration_days")
        .eq("is_active", true)
        .order("sort_order");

      if (plansData) {
        setPlans(
          plansData.map((p: { id: string; name: string; price_amount: number; duration_days: number }) => ({
            id: p.id,
            name: p.name,
            price: p.price_amount,
            durationDays: p.duration_days,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading clients and plans:", error);
    }
  }

  async function handleCreateSubscription() {
    if (!selectedClientId || !selectedPlanId) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          planId: selectedPlanId,
          customAmount: customAmount ? parseInt(customAmount) : undefined,
          isPaid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      // Reset modal and reload
      setShowNewSubModal(false);
      setSelectedClientId("");
      setSelectedPlanId("");
      setCustomAmount("");
      setIsPaid(false);
      await loadSubscriptions();
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert(error instanceof Error ? error.message : "Failed to create subscription");
    } finally {
      setIsCreating(false);
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const filteredSubs = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || sub.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case "expiring":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-brown-100 text-brown-600 dark:bg-brown-900/30 dark:text-brown-400 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Expiring Soon
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400 rounded-full">
            <Clock className="w-3 h-3" />
            Paused
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === "paid") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
        <XCircle className="w-3 h-3" />
        Pending
      </span>
    );
  };

  // Stats
  const totalRevenue = subscriptions
    .filter((s) => s.paymentStatus === "paid")
    .reduce((sum, s) => sum + s.amount, 0);
  const activeCount = subscriptions.filter((s) => s.status === "active" || s.status === "expiring").length;
  const pendingPayments = subscriptions.filter((s) => s.paymentStatus === "pending").length;
  const expiringCount = subscriptions.filter((s) => s.status === "expiring").length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Subscriptions
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {userRole === "admin"
              ? "Overview of all client subscriptions"
              : "Manage your client subscriptions and payments"}
          </p>
        </div>
        {userRole === "coach" && (
          <button
            onClick={() => setShowNewSubModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Subscription
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Active Subscriptions</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {activeCount}
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Pending Payments</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{pendingPayments}</p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-brown-500">{expiringCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SubStatus)}
          className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="paused">Paused</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus)}
          className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 dark:bg-stone-800/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-stone-500 text-sm">
                  Client
                </th>
                <th className="text-left py-3 px-4 font-medium text-stone-500 text-sm">
                  Plan
                </th>
                <th className="text-center py-3 px-4 font-medium text-stone-500 text-sm">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-medium text-stone-500 text-sm">
                  Payment
                </th>
                <th className="text-right py-3 px-4 font-medium text-stone-500 text-sm">
                  Amount
                </th>
                <th className="text-center py-3 px-4 font-medium text-stone-500 text-sm">
                  Period
                </th>
                <th className="text-center py-3 px-4 font-medium text-stone-500 text-sm">
                  Days Left
                </th>
                <th className="text-right py-3 px-4 font-medium text-stone-500 text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSubs.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <Link
                      href={`/admin/clients/${sub.clientId}`}
                      className="group"
                    >
                      <p className="font-medium text-stone-800 dark:text-stone-200 group-hover:text-brown-500">
                        {sub.clientName}
                      </p>
                      <p className="text-xs text-stone-500">{sub.email}</p>
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-stone-800 dark:text-stone-200">
                      {sub.plan}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getPaymentBadge(sub.paymentStatus)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {formatCurrency(sub.amount)}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {formatDate(sub.startDate)}
                    </p>
                    <p className="text-xs text-stone-500">
                      to {formatDate(sub.endDate)}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {sub.status === "completed" || sub.status === "cancelled" ? (
                      <span className="text-stone-500">-</span>
                    ) : (
                      <span
                        className={`font-medium ${
                          getDaysRemaining(sub.endDate) <= 7
                            ? "text-red-600"
                            : getDaysRemaining(sub.endDate) <= 14
                            ? "text-brown-500"
                            : "text-stone-800 dark:text-stone-200"
                        }`}
                      >
                        {getDaysRemaining(sub.endDate)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {sub.paymentStatus === "pending" && (
                        <button
                          onClick={() => setShowPaymentModal(sub.id)}
                          className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                        <Mail className="w-4 h-4" />
                      </button>
                      {(sub.status === "active" || sub.status === "expiring") && (
                        <button className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubs.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <p className="text-stone-500">No subscriptions found.</p>
            <p className="text-sm text-stone-400 mt-1">
              Invite a client to create their first subscription.
            </p>
            <Link
              href="/coach/clients"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600"
            >
              <Plus className="w-4 h-4" />
              Go to Clients
            </Link>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
              Confirm Payment Received
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Are you sure you want to mark this subscription as paid? This
              action will activate the client&apos;s subscription.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Payment Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., UPI transaction ID"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(null);
                  setPaymentReference("");
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkPaid(showPaymentModal)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Subscription Modal */}
      {showNewSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                Create New Subscription
              </h3>
              <button
                onClick={() => setShowNewSubModal(false)}
                className="p-1 text-stone-500 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Client
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                >
                  <option value="">Select a plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)} ({plan.durationDays} days)
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Custom Amount (Optional)
                </label>
                <input
                  type="number"
                  placeholder={selectedPlan ? `Plan price: ${formatCurrency(selectedPlan.price)}` : "Enter custom amount"}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Payment Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 text-brown-500 border-stone-300 rounded focus:ring-brown-500"
                />
                <label htmlFor="isPaid" className="text-sm text-stone-700 dark:text-stone-300">
                  Payment already received
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewSubModal(false)}
                disabled={isCreating}
                className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubscription}
                disabled={isCreating || !selectedClientId || !selectedPlanId}
                className="flex-1 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Subscription"
                )}
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-4 text-center">
              Need to add a new client?{" "}
              <Link href="/coach/clients" className="text-brown-500 hover:underline">
                Go to Clients page
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
