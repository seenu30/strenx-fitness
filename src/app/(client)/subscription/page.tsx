"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  Zap,
  Loader2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalDays: number;
  amount: number;
  paymentStatus: string;
  features: string[];
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  plan: string;
}

interface PlanTemplate {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<PlanTemplate[]>([]);

  const loadSubscriptionData = useCallback(async () => {
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get client info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) {
        setIsLoading(false);
        return;
      }

      // Get active subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subs } = await (supabase as any)
        .from("subscriptions")
        .select(`
          id,
          status,
          start_date,
          end_date,
          plan_templates(id, name, price, duration_days, features)
        `)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        const sub = subs[0];
        const plan = sub.plan_templates;
        const startDate = new Date(sub.start_date);
        const endDate = new Date(sub.end_date);
        const now = new Date();
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Get payment status for this subscription
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: payments } = await (supabase as any)
          .from("payments")
          .select("status, amount")
          .eq("subscription_id", sub.id)
          .eq("status", "completed");

        const paymentStatus = payments && payments.length > 0 ? "paid" : "pending";
        const amount = payments?.[0]?.amount || plan?.price || 0;

        setSubscription({
          id: sub.id,
          plan: plan?.name || "Custom Plan",
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          daysRemaining,
          totalDays,
          amount,
          paymentStatus,
          features: plan?.features || [
            "Personalized nutrition plan",
            "Custom training program",
            "Daily check-ins with coach",
            "Weekly progress reviews",
            "Unlimited messaging support",
          ],
        });
      }

      // Get payment history
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: paymentHistory } = await (supabase as any)
        .from("payments")
        .select(`
          id,
          amount,
          status,
          payment_date,
          subscriptions(plan_templates(name))
        `)
        .eq("client_id", client.id)
        .eq("status", "completed")
        .order("payment_date", { ascending: false })
        .limit(10);

      if (paymentHistory) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setInvoices(paymentHistory.map((p: any, idx: number) => ({
          id: `INV-${new Date(p.payment_date).getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
          date: p.payment_date,
          amount: p.amount,
          status: p.status,
          plan: p.subscriptions?.plan_templates?.name || "Plan",
        })));
      }

      // Get available plans (RLS handles tenant filtering)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planTemplates } = await (supabase as any)
        .from("plan_templates")
        .select("id, name, price, duration_days, features")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (planTemplates) {
        setPlans(planTemplates);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brown-500 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            My Subscription
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Manage your plan and billing information
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
          <CreditCard className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
            No Active Subscription
          </h3>
          <p className="text-stone-500 mb-4">
            You don&apos;t have an active subscription yet. Contact your coach to get started.
          </p>
          <button
            onClick={() => router.push("/messages")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg hover:bg-brown-600"
          >
            <Zap className="w-4 h-4" />
            Contact Coach
          </button>
        </div>

        {/* Available Plans */}
        {plans.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
              Available Plans
            </h3>
            <p className="text-stone-500 text-sm mb-4">
              Talk to your coach to get started with one of these plans.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-lg border-2 border-stone-200 dark:border-stone-700"
                >
                  <p className="font-semibold text-stone-800 dark:text-stone-100">
                    {plan.name}
                  </p>
                  <p className="text-2xl font-bold text-brown-500 mt-2">
                    {formatCurrency(plan.price)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">{plan.duration_days} days</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const progressPercent = Math.round(
    ((subscription.totalDays - subscription.daysRemaining) / subscription.totalDays) * 100
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          My Subscription
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Manage your plan and billing information
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-brown-500 to-brown-500 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-brown-100 text-sm mb-1">Current Plan</p>
            <h2 className="text-2xl font-bold">{subscription.plan}</h2>
          </div>
          {subscription.status === "active" ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Active
            </span>
          ) : subscription.status === "pending" ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              <XCircle className="w-4 h-4" />
              {subscription.status}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{subscription.daysRemaining}</p>
            <p className="text-brown-100 text-sm">Days Left</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{subscription.totalDays}</p>
            <p className="text-brown-100 text-sm">Total Days</p>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {subscription.totalDays - subscription.daysRemaining}
            </p>
            <p className="text-brown-100 text-sm">Days Completed</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan Details */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Plan Details
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-stone-500">Start Date</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {formatDate(subscription.startDate)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-stone-500">End Date</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {formatDate(subscription.endDate)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-stone-500">Amount Paid</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {formatCurrency(subscription.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-stone-500">Payment Status</span>
              {subscription.paymentStatus === "paid" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brown-100 text-brown-600 dark:bg-brown-900/30 dark:text-brown-400 rounded-full text-sm font-medium">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            What&apos;s Included
          </h3>

          <ul className="space-y-3">
            {subscription.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700 dark:text-stone-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Renewal Notice */}
      {subscription.daysRemaining <= 14 && subscription.daysRemaining > 0 && (
        <div className="bg-brown-50 dark:bg-brown-900/20 rounded-xl border border-brown-200 dark:border-brown-700 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-brown-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-brown-700 dark:text-brown-200">
                Your plan expires soon
              </p>
              <p className="text-sm text-brown-600 dark:text-brown-300 mt-1">
                Your {subscription.plan} plan will expire in {subscription.daysRemaining}{" "}
                days. Contact your coach to renew and continue your transformation
                journey.
              </p>
              <button
                onClick={() => router.push("/messages")}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg text-sm font-medium hover:bg-brown-600"
              >
                <Zap className="w-4 h-4" />
                Contact Coach to Renew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {invoices.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Payment History
          </h3>

          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg bg-stone-50 dark:bg-stone-800"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {invoice.plan}
                    </p>
                    <p className="text-sm text-stone-500">
                      {invoice.id} &bull; {formatDate(invoice.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {formatCurrency(invoice.amount)}
                  </span>
                  <button className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      {plans.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Available Plans
          </h3>
          <p className="text-stone-500 text-sm mb-4">
            Interested in a different plan? Talk to your coach about switching.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.name === subscription.plan;
              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrent
                      ? "border-brown-500 bg-brown-50 dark:bg-brown-900/20"
                      : "border-stone-200 dark:border-stone-700"
                  }`}
                >
                  {isCurrent && (
                    <span className="text-xs font-medium text-brown-500 mb-2 block">
                      Current Plan
                    </span>
                  )}
                  <p className="font-semibold text-stone-800 dark:text-stone-100">
                    {plan.name}
                  </p>
                  <p className="text-2xl font-bold text-brown-500 mt-2">
                    {formatCurrency(plan.price)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">{plan.duration_days} days</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
