"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price_amount: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  duration_days: string;
  features: string;
}

const initialFormData: FormData = {
  name: "",
  description: "",
  price: "",
  duration_days: "30",
  features: "",
};

export default function AdminPlansPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    const supabase = createClient();

    try {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_amount", { ascending: true });

      setPlans((data as SubscriptionPlan[]) || []);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePlanStatus(plan: SubscriptionPlan) {
    const supabase = createClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("subscription_plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);

      setPlans(plans.map(p =>
        p.id === plan.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  }

  function openCreateModal() {
    setEditingPlan(null);
    setFormData(initialFormData);
    setShowModal(true);
  }

  function openEditModal(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: (plan.price_amount / 100).toString(), // Convert from paise to rupees
      duration_days: plan.duration_days.toString(),
      features: plan.features?.join("\n") || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPlan(null);
    setFormData(initialFormData);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.duration_days) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const featuresArray = formData.features
        .split("\n")
        .map(f => f.trim())
        .filter(Boolean);

      const planData = {
        name: formData.name,
        description: formData.description || null,
        price_amount: (parseInt(formData.price) || 0) * 100, // Convert rupees to paise
        duration_days: parseInt(formData.duration_days) || 30,
        features: featuresArray,
      };

      if (editingPlan) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("subscription_plans")
          .update(planData)
          .eq("id", editingPlan.id);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("subscription_plans")
          .insert({
            ...planData,
            is_active: true,
          });
      }

      closeModal();
      await loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(planId: string) {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    const supabase = createClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      await loadPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans available to coaches
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{plans.length}</p>
          <p className="text-sm text-muted-foreground">Total Plans</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">
            {plans.filter(p => p.is_active).length}
          </p>
          <p className="text-sm text-muted-foreground">Active Plans</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">
            ₹{plans.length > 0 ? Math.min(...plans.map(p => p.price_amount / 100)).toLocaleString() : 0}
          </p>
          <p className="text-sm text-muted-foreground">Lowest Price</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">
            ₹{plans.length > 0 ? Math.max(...plans.map(p => p.price_amount / 100)).toLocaleString() : 0}
          </p>
          <p className="text-sm text-muted-foreground">Highest Price</p>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Plans Created</h3>
          <p className="text-muted-foreground mb-4">
            Create subscription plans that coaches can offer to their clients.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card rounded-xl border ${
                plan.is_active ? "border-border" : "border-border opacity-60"
              } overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.duration_days} days</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      plan.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-3xl font-bold text-foreground mb-4">
                  ₹{(plan.price_amount / 100).toLocaleString()}
                </p>

                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                )}

                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-6 py-4 bg-muted/50 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => togglePlanStatus(plan)}
                  className={`text-sm ${
                    plan.is_active
                      ? "text-amber-600 hover:text-amber-700"
                      : "text-green-600 hover:text-green-700"
                  }`}
                >
                  {plan.is_active ? "Deactivate" : "Activate"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editingPlan ? "Edit Plan" : "Create New Plan"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Plan"
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="5000"
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    placeholder="30"
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Features (one per line)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Personalized nutrition plan&#10;Weekly check-ins&#10;24/7 chat support"
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name || !formData.price}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingPlan ? "Save Changes" : "Create Plan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
