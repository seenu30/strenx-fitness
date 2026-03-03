"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  Loader2,
  Mail,
  MoreVertical,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  clientCount: number;
  specializations: string[];
  experienceYears: number;
  createdAt: string;
  status: string;
}

export default function SuperAdminCoachesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadCoaches() {
      const supabase = createClient();

      try {
        const { data: coachesData } = await supabase
          .from("coaches")
          .select(`
            id,
            user_id,
            specializations,
            experience_years,
            created_at,
            users!inner(first_name, last_name, email, is_active)
          `)
          .order("created_at", { ascending: false });

        interface CoachData {
          id: string;
          user_id: string;
          specializations: string[] | null;
          experience_years: number | null;
          created_at: string;
          users: { first_name: string; last_name: string; email: string; is_active: boolean };
        }

        const formattedCoaches: Coach[] = [];
        for (const coach of (coachesData as CoachData[] || [])) {
          const { count } = await supabase
            .from("clients")
            .select("id", { count: "exact" })
            .eq("coach_id", coach.id);

          formattedCoaches.push({
            id: coach.id,
            userId: coach.user_id,
            name: `${coach.users.first_name} ${coach.users.last_name}`,
            email: coach.users.email,
            clientCount: count || 0,
            specializations: coach.specializations || [],
            experienceYears: coach.experience_years || 0,
            createdAt: new Date(coach.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            status: coach.users.is_active ? "active" : "inactive",
          });
        }

        setCoaches(formattedCoaches);
      } catch (error) {
        console.error("Error loading coaches:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCoaches();
  }, []);

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch =
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || coach.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-foreground">Coaches</h1>
          <p className="text-muted-foreground mt-1">
            Manage all coaches on the platform
          </p>
        </div>
        <Link
          href="/super-admin/coaches/invite"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Coach
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coaches by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{coaches.length}</p>
          <p className="text-sm text-muted-foreground">Total Coaches</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">
            {coaches.filter((c) => c.status === "active").length}
          </p>
          <p className="text-sm text-muted-foreground">Active Coaches</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">
            {coaches.reduce((sum, c) => sum + c.clientCount, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Clients</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">
            {coaches.length > 0
              ? Math.round(
                  coaches.reduce((sum, c) => sum + c.clientCount, 0) / coaches.length
                )
              : 0}
          </p>
          <p className="text-sm text-muted-foreground">Avg Clients/Coach</p>
        </div>
      </div>

      {/* Coaches List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Coach
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Clients
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Specializations
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No coaches found</p>
                  </td>
                </tr>
              ) : (
                filteredCoaches.map((coach) => (
                  <tr
                    key={coach.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
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
                          <p className="font-medium text-foreground">{coach.name}</p>
                          <p className="text-xs text-muted-foreground">{coach.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{coach.clientCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {coach.specializations.slice(0, 2).map((spec) => (
                          <span
                            key={spec}
                            className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full"
                          >
                            {spec}
                          </span>
                        ))}
                        {coach.specializations.length > 2 && (
                          <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                            +{coach.specializations.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground">{coach.experienceYears} years</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          coach.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {coach.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {coach.createdAt}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
