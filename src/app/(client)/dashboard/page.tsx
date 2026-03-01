"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  UtensilsCrossed,
  Dumbbell,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Flame,
  Footprints,
  Scale,
  Calendar,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type DailyCheckin = Database["public"]["Tables"]["daily_checkins"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

interface ClientRow {
  id: string;
  created_at: string;
}

interface ConversationRow {
  id: string;
}

interface ProfileRow {
  first_name: string | null;
}

interface CheckinRow {
  id: string;
}

interface WeekCheckinRow {
  checkin_date: string;
  morning_weight_kg: number | null;
  step_count: number | null;
  training_completed: boolean | null;
}

interface DashboardData {
  user: {
    firstName: string;
    programDays: number;
    totalDays: number;
    startDate: string;
  };
  todayCheckin: {
    completed: boolean;
  };
  weeklyStats: {
    complianceRate: number;
    weightChange: number;
    avgSteps: number;
    trainingSessions: number;
    targetSessions: number;
  };
  recentMessages: Array<{
    id: string;
    from: string;
    preview: string;
    time: string;
    unread: boolean;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueTime: string;
    type: string;
  }>;
  compliance: {
    lastWeek: boolean[];
    days: string[];
  };
}

const DEFAULT_DATA: DashboardData = {
  user: {
    firstName: "there",
    programDays: 0,
    totalDays: 90,
    startDate: new Date().toISOString().split("T")[0],
  },
  todayCheckin: { completed: false },
  weeklyStats: {
    complianceRate: 0,
    weightChange: 0,
    avgSteps: 0,
    trainingSessions: 0,
    targetSessions: 5,
  },
  recentMessages: [],
  upcomingTasks: [
    { id: "1", title: "Daily Check-in", dueTime: "Today", type: "checkin" },
  ],
  compliance: {
    lastWeek: [false, false, false, false, false, false, false],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  // Load dashboard data from Supabase
  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await (supabase as SupabaseClient)
          .from("users")
          .select("first_name")
          .eq("id", user.id)
          .single() as { data: ProfileRow | null };

        const { data: client } = await (supabase as SupabaseClient)
          .from("clients")
          .select("id, created_at")
          .eq("user_id", user.id)
          .single() as { data: ClientRow | null };

        if (!client) {
          setIsLoading(false);
          return;
        }

        // Calculate program days
        const startDate = new Date(client.created_at);
        const today = new Date();
        const programDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const todayStr = today.toISOString().split("T")[0];
        const { data: todayCheckin } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select("id")
          .eq("client_id", client.id)
          .eq("checkin_date", todayStr)
          .single() as { data: CheckinRow | null };

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { data: weekCheckins } = await (supabase as SupabaseClient)
          .from("daily_checkins")
          .select("checkin_date, morning_weight_kg, step_count, training_completed")
          .eq("client_id", client.id)
          .gte("checkin_date", weekAgo.toISOString().split("T")[0])
          .order("checkin_date", { ascending: true }) as { data: WeekCheckinRow[] | null };

        // Calculate weekly stats
        let totalSteps = 0;
        let stepDays = 0;
        let trainingSessions = 0;
        const weights: number[] = [];
        const complianceMap = new Map<string, boolean>();

        if (weekCheckins) {
          (weekCheckins as Pick<DailyCheckin, "checkin_date" | "morning_weight_kg" | "step_count" | "training_completed">[]).forEach((checkin) => {
            complianceMap.set(checkin.checkin_date, true);
            if (checkin.step_count) {
              totalSteps += checkin.step_count;
              stepDays++;
            }
            if (checkin.training_completed) {
              trainingSessions++;
            }
            if (checkin.morning_weight_kg) {
              weights.push(checkin.morning_weight_kg);
            }
          });
        }

        // Build compliance array for last 7 days
        const complianceDays: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          complianceDays.push(complianceMap.has(dateStr));
        }

        // Calculate weight change (first vs last in the week)
        const weightChange = weights.length >= 2
          ? Number((weights[weights.length - 1] - weights[0]).toFixed(1))
          : 0;

        // Calculate compliance rate
        const complianceRate = Math.round((complianceMap.size / 7) * 100);

        const { data: conversations } = await (supabase as SupabaseClient)
          .from("conversations")
          .select("id")
          .eq("client_id", client.id)
          .limit(1)
          .single() as { data: ConversationRow | null };

        let recentMessages: DashboardData["recentMessages"] = [];
        if (conversations) {
          const { data: messages } = await supabase
            .from("messages")
            .select("id, content, created_at, read_at, sender_id")
            .eq("conversation_id", conversations.id)
            .neq("sender_id", user.id)
            .order("created_at", { ascending: false })
            .limit(2);

          if (messages) {
            recentMessages = (messages as Pick<Message, "id" | "content" | "created_at" | "read_at" | "sender_id">[]).map((msg) => ({
              id: msg.id,
              from: "Coach",
              preview: msg.content.substring(0, 40) + (msg.content.length > 40 ? "..." : ""),
              time: formatTimeAgo(new Date(msg.created_at)),
              unread: !msg.read_at,
            }));
          }
        }

        setData({
          user: {
            firstName: profile?.first_name || "there",
            programDays: Math.max(0, programDays),
            totalDays: 90,
            startDate: startDate.toISOString().split("T")[0],
          },
          todayCheckin: {
            completed: !!todayCheckin,
          },
          weeklyStats: {
            complianceRate,
            weightChange,
            avgSteps: stepDays > 0 ? Math.round(totalSteps / stepDays) : 0,
            trainingSessions,
            targetSessions: 5,
          },
          recentMessages,
          upcomingTasks: [
            { id: "1", title: "Daily Check-in", dueTime: "Today", type: "checkin" },
            { id: "2", title: "Weekly Progress Photos", dueTime: "In 2 days", type: "photos" },
          ],
          compliance: {
            lastWeek: complianceDays,
            days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          },
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
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
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  }

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const progressPercent = Math.round(
    (data.user.programDays / data.user.totalDays) * 100
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {data.user.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Day {data.user.programDays} of your {data.user.totalDays}-day transformation
          </p>
        </div>
        <Link
          href="/check-in/daily"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <CalendarCheck className="w-5 h-5" />
          {data.todayCheckin.completed ? "View Today's Check-in" : "Complete Check-in"}
        </Link>
      </div>

      {/* Program Progress */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">
            Program Progress
          </h2>
          <span className="text-sm text-muted-foreground">
            {data.user.totalDays - data.user.programDays} days remaining
          </span>
        </div>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Started {data.user.startDate}</span>
          <span className="font-medium text-primary">{progressPercent}% complete</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compliance</p>
              <p className="text-xl font-bold text-foreground">
                {data.weeklyStats.complianceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Weight Change */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <div className="flex items-center gap-1">
                <p className="text-xl font-bold text-foreground">
                  {data.weeklyStats.weightChange > 0 ? "+" : ""}
                  {data.weeklyStats.weightChange} kg
                </p>
                {data.weeklyStats.weightChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : data.weeklyStats.weightChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Average Steps */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Steps</p>
              <p className="text-xl font-bold text-foreground">
                {data.weeklyStats.avgSteps.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Training Sessions */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Workouts</p>
              <p className="text-xl font-bold text-foreground">
                {data.weeklyStats.trainingSessions}/{data.weeklyStats.targetSessions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Compliance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Weekly Compliance
            </h2>
            <Link
              href="/progress"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              View Details <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex justify-between">
            {data.compliance.days.map((day, index) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    data.compliance.lastWeek[index]
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  {data.compliance.lastWeek[index] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Upcoming Tasks
          </h2>
          <div className="space-y-3">
            {data.upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {task.type === "checkin" ? (
                    <CalendarCheck className="w-4 h-4 text-primary" />
                  ) : task.type === "photos" ? (
                    <Calendar className="w-4 h-4 text-primary" />
                  ) : (
                    <Clock className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.dueTime}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Messages */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/plans/nutrition"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                View Meal Plan
              </span>
            </Link>
            <Link
              href="/plans/training"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <Dumbbell className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                View Workout
              </span>
            </Link>
            <Link
              href="/progress/photos"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Progress Photos
              </span>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Message Coach
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Recent Messages
            </h2>
            <Link
              href="/messages"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentMessages.map((message) => (
              <Link
                key={message.id}
                href="/messages"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {message.from}
                    </p>
                    {message.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{message.preview}</p>
                  <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
