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
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("first_name")
          .eq("id", user.id)
          .single();

        // Get client info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: client } = await (supabase as any)
          .from("clients")
          .select("id, created_at")
          .eq("user_id", user.id)
          .single();

        if (!client) {
          setIsLoading(false);
          return;
        }

        // Calculate program days
        const startDate = new Date(client.created_at);
        const today = new Date();
        const programDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if today's check-in exists
        const todayStr = today.toISOString().split("T")[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: todayCheckin } = await (supabase as any)
          .from("daily_checkins")
          .select("id")
          .eq("client_id", client.id)
          .eq("checkin_date", todayStr)
          .single();

        // Get last 7 days of check-ins for compliance
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: weekCheckins } = await (supabase as any)
          .from("daily_checkins")
          .select("checkin_date, morning_weight_kg, step_count, training_completed")
          .eq("client_id", client.id)
          .gte("checkin_date", weekAgo.toISOString().split("T")[0])
          .order("checkin_date", { ascending: true });

        // Calculate weekly stats
        let totalSteps = 0;
        let stepDays = 0;
        let trainingSessions = 0;
        const weights: number[] = [];
        const complianceMap = new Map<string, boolean>();

        if (weekCheckins) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          weekCheckins.forEach((checkin: any) => {
            complianceMap.set(checkin.checkin_date, true);
            if (checkin.step_count) {
              totalSteps += checkin.step_count;
              stepDays++;
            }
            if (checkin.training_completed) {
              trainingSessions++;
            }
            if (checkin.morning_weight_kg) {
              weights.push(parseFloat(checkin.morning_weight_kg));
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

        // Get recent messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: conversations } = await (supabase as any)
          .from("conversations")
          .select("id")
          .eq("client_id", client.id)
          .limit(1)
          .single();

        let recentMessages: DashboardData["recentMessages"] = [];
        if (conversations) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: messages } = await (supabase as any)
            .from("messages")
            .select("id, content, created_at, read_at, sender_id")
            .eq("conversation_id", conversations.id)
            .neq("sender_id", user.id)
            .order("created_at", { ascending: false })
            .limit(2);

          if (messages) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recentMessages = messages.map((msg: any) => ({
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
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {greeting}, {data.user.firstName}!
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Day {data.user.programDays} of your {data.user.totalDays}-day transformation
          </p>
        </div>
        <Link
          href="/check-in/daily"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          <CalendarCheck className="w-5 h-5" />
          {data.todayCheckin.completed ? "View Today's Check-in" : "Complete Check-in"}
        </Link>
      </div>

      {/* Program Progress */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">
            Program Progress
          </h2>
          <span className="text-sm text-stone-500">
            {data.user.totalDays - data.user.programDays} days remaining
          </span>
        </div>
        <div className="relative h-4 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-stone-500">
          <span>Started {data.user.startDate}</span>
          <span className="font-medium text-amber-600">{progressPercent}% complete</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">Compliance</p>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                {data.weeklyStats.complianceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Weight Change */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">This Week</p>
              <div className="flex items-center gap-1">
                <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                  {data.weeklyStats.weightChange > 0 ? "+" : ""}
                  {data.weeklyStats.weightChange} kg
                </p>
                {data.weeklyStats.weightChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : data.weeklyStats.weightChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Average Steps */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">Avg Steps</p>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                {data.weeklyStats.avgSteps.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Training Sessions */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">Workouts</p>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                {data.weeklyStats.trainingSessions}/{data.weeklyStats.targetSessions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Compliance */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">
              Weekly Compliance
            </h2>
            <Link
              href="/progress"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
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
                <span className="text-xs text-stone-500">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Upcoming Tasks
          </h2>
          <div className="space-y-3">
            {data.upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  {task.type === "checkin" ? (
                    <CalendarCheck className="w-4 h-4 text-amber-600" />
                  ) : task.type === "photos" ? (
                    <Calendar className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                    {task.title}
                  </p>
                  <p className="text-xs text-stone-500">{task.dueTime}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Messages */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/plans/nutrition"
              className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                View Meal Plan
              </span>
            </Link>
            <Link
              href="/plans/training"
              className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <Dumbbell className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                View Workout
              </span>
            </Link>
            <Link
              href="/progress/photos"
              className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Progress Photos
              </span>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Message Coach
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">
              Recent Messages
            </h2>
            <Link
              href="/messages"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentMessages.map((message) => (
              <Link
                key={message.id}
                href="/messages"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {message.from}
                    </p>
                    {message.unread && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className="text-sm text-stone-500 truncate">{message.preview}</p>
                  <p className="text-xs text-stone-400 mt-1">{message.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
