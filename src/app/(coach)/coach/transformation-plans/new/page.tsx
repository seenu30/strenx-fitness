"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Search,
  User,
  Loader2,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  status: string | null;
  users: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default function NewTransformationPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    plan_name: "Transformation Plan",
    phase: "Phase 1",
    duration_weeks: 4,
  });

  const supabase = createClient();

  const loadClients = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach info
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) return;

      // Get active clients for this coach
      const { data: clientsData } = await supabase
        .from("clients")
        .select(`
          id,
          status,
          users!inner(first_name, last_name, email)
        `)
        .eq("coach_id", coach.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setClients((clientsData || []) as Client[]);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreatePlan = async () => {
    if (!selectedClient) return;
    setCreating(true);

    try {
      const response = await fetch("/api/transformation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClient.id,
          plan_name: formData.plan_name,
          phase: formData.phase,
          duration_weeks: formData.duration_weeks,
        }),
      });

      const data = await response.json();

      if (data.success && data.plan) {
        router.push(`/coach/transformation-plans/${data.plan.id}/edit`);
      } else {
        alert(data.error || "Failed to create plan");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Failed to create plan");
    } finally {
      setCreating(false);
    }
  };

  const getClientName = (client: Client) => {
    const { first_name, last_name } = client.users;
    return `${first_name || ""} ${last_name || ""}`.trim() || "Unnamed Client";
  };

  const filteredClients = clients.filter((client) => {
    const name = getClientName(client).toLowerCase();
    const email = client.users.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brown-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/coach/transformation-plans"
          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Create Transformation Plan
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Select a client and set up plan details
          </p>
        </div>
      </div>

      {/* Step 1: Select Client */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
          1. Select Client
        </h2>

        {selectedClient ? (
          <div className="flex items-center justify-between p-4 bg-brown-50 dark:bg-brown-900/20 border border-brown-200 dark:border-brown-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brown-100 dark:bg-brown-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-brown-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100">
                  {getClientName(selectedClient)}
                </p>
                <p className="text-sm text-stone-500">{selectedClient.users.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-sm text-brown-600 hover:text-brown-700 font-medium"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
              />
            </div>

            {filteredClients.length > 0 ? (
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 dark:text-stone-100 truncate">
                        {getClientName(client)}
                      </p>
                      <p className="text-sm text-stone-500 truncate">{client.users.email}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-stone-300 dark:text-stone-600" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-stone-500">
                {searchQuery ? "No clients found matching your search." : "No active clients found."}
              </p>
            )}
          </>
        )}
      </div>

      {/* Step 2: Plan Details */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">
          2. Plan Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Plan Name
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={formData.plan_name}
                onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
                placeholder="e.g., 12-Week Body Transformation"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Phase
              </label>
              <input
                type="text"
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
                placeholder="e.g., Phase 1, Fat Loss, Maintenance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Duration (weeks)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <select
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brown-500 focus:border-transparent"
                >
                  {[2, 4, 6, 8, 10, 12, 16].map((weeks) => (
                    <option key={weeks} value={weeks}>
                      {weeks} weeks
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/coach/transformation-plans"
          className="flex-1 px-4 py-3 text-center border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium"
        >
          Cancel
        </Link>
        <button
          onClick={handleCreatePlan}
          disabled={!selectedClient || !formData.plan_name || creating}
          className="flex-1 px-4 py-3 bg-brown-500 text-white rounded-lg hover:bg-brown-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            "Create & Edit Plan"
          )}
        </button>
      </div>
    </div>
  );
}
