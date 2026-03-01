"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  CalendarCheck,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Camera,
  Scale,
  Loader2,
} from "lucide-react";

interface CheckinStatus {
  dailyComplete: boolean;
  weeklyComplete: boolean;
  currentStreak: number;
  totalCheckins: number;
  weeklyDue: boolean;
}

interface RecentCheckin {
  date: string;
  type: "daily" | "weekly";
  status: string;
  weight: number | null;
}

interface DailyCheckinRecord {
  created_at: string;
  weight?: number;
}

interface WeeklyCheckinRecord {
  created_at: string;
}

interface ClientRecord {
  id: string;
}

interface CheckinIdRecord {
  id: string;
}

export default function CheckInPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<CheckinStatus>({
    dailyComplete: false,
    weeklyComplete: false,
    currentStreak: 0,
    totalCheckins: 0,
    weeklyDue: false,
  });
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([]);

  const supabase = createClient();

  const loadCheckinData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single() as { data: ClientRecord | null };

      if (!client) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayCheckin } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("client_id", client.id)
        .gte("created_at", today.toISOString())
        .limit(1) as { data: CheckinIdRecord[] | null };

      const dailyComplete = (todayCheckin?.length || 0) > 0;

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weeklyCheckin } = await supabase
        .from("weekly_checkins")
        .select("id")
        .eq("client_id", client.id)
        .gte("created_at", startOfWeek.toISOString())
        .limit(1) as { data: CheckinIdRecord[] | null };

      const weeklyComplete = (weeklyCheckin?.length || 0) > 0;

      const isSunday = today.getDay() === 0;
      const weeklyDue = isSunday && !weeklyComplete;

      const { data: allDailyCheckins } = await supabase
        .from("daily_checkins")
        .select("created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false }) as { data: DailyCheckinRecord[] | null };

      let currentStreak = 0;
      if (allDailyCheckins && allDailyCheckins.length > 0) {
        const checkDate = new Date(today);

        if (!dailyComplete) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        const checkinDates = new Set(
          allDailyCheckins.map((c: DailyCheckinRecord) =>
            new Date(c.created_at).toISOString().split("T")[0]
          )
        );

        while (true) {
          const dateStr = checkDate.toISOString().split("T")[0];
          if (checkinDates.has(dateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        if (dailyComplete) {
          currentStreak = Math.max(currentStreak, 1);
        }
      }

      const { data: totalDaily } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("client_id", client.id) as { data: CheckinIdRecord[] | null };

      const { data: totalWeekly } = await supabase
        .from("weekly_checkins")
        .select("id")
        .eq("client_id", client.id) as { data: CheckinIdRecord[] | null };

      const totalCheckins = (totalDaily?.length || 0) + (totalWeekly?.length || 0);

      setStatus({
        dailyComplete,
        weeklyComplete,
        currentStreak,
        totalCheckins,
        weeklyDue,
      });

      const { data: recentDaily } = await supabase
        .from("daily_checkins")
        .select("created_at, weight")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(5) as { data: DailyCheckinRecord[] | null };

      const { data: recentWeekly } = await supabase
        .from("weekly_checkins")
        .select("created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(2) as { data: WeeklyCheckinRecord[] | null };

      const combined: RecentCheckin[] = [];

      (recentDaily || []).forEach((c: DailyCheckinRecord) => {
        combined.push({
          date: c.created_at,
          type: "daily",
          status: "complete",
          weight: c.weight ?? null,
        });
      });

      (recentWeekly || []).forEach((c: WeeklyCheckinRecord) => {
        combined.push({
          date: c.created_at,
          type: "weekly",
          status: "complete",
          weight: null,
        });
      });

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentCheckins(combined.slice(0, 5));

    } catch (error) {
      console.error("Error loading check-in data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadCheckinData();
  }, [loadCheckinData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Check-in
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your daily progress and weekly measurements
        </p>
      </div>

      {/* Check-in Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Check-in */}
        <div
          className={`bg-card rounded-xl border-2 overflow-hidden ${
            status.dailyComplete
              ? "border-green-500"
              : "border-primary"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    status.dailyComplete
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-primary/10"
                  }`}
                >
                  <CalendarCheck
                    className={`w-6 h-6 ${
                      status.dailyComplete
                        ? "text-green-600"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    Daily Check-in
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Weight, meals, training
                  </p>
                </div>
              </div>
              {status.dailyComplete ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Log your morning weight
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Upload meal photos
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Track steps and training
                </span>
              </div>
            </div>

            <Link
              href="/check-in/daily"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                status.dailyComplete
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {status.dailyComplete ? "View Today's Check-in" : "Complete Daily Check-in"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Weekly Check-in */}
        <div
          className={`bg-card rounded-xl border-2 overflow-hidden ${
            status.weeklyComplete
              ? "border-green-500"
              : status.weeklyDue
              ? "border-purple-500"
              : "border-border"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    status.weeklyComplete
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-purple-100 dark:bg-purple-900/30"
                  }`}
                >
                  <Calendar
                    className={`w-6 h-6 ${
                      status.weeklyComplete
                        ? "text-green-600"
                        : "text-purple-600"
                    }`}
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    Weekly Check-in
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Photos, measurements, reflection
                  </p>
                </div>
              </div>
              {status.weeklyComplete ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </span>
              ) : status.weeklyDue ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Due Today
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  <Clock className="w-3 h-3" />
                  Sunday
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Progress photos (front, side, back)
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Body measurements
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Weekly reflection and questions
                </span>
              </div>
            </div>

            <Link
              href="/check-in/weekly"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                status.weeklyComplete
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : status.weeklyDue
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status.weeklyComplete
                ? "View Weekly Check-in"
                : status.weeklyDue
                ? "Complete Weekly Check-in"
                : "Weekly Check-in (Sunday)"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {status.currentStreak}
              </p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {status.totalCheckins}
              </p>
              <p className="text-sm text-muted-foreground">Total Check-ins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">
          Recent Check-ins
        </h2>
        <div className="space-y-3">
          {recentCheckins.length > 0 ? (
            recentCheckins.map((checkin, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      checkin.type === "weekly"
                        ? "bg-purple-100 dark:bg-purple-900/30"
                        : "bg-blue-100 dark:bg-blue-900/30"
                    }`}
                  >
                    {checkin.type === "weekly" ? (
                      <Calendar
                        className={`w-4 h-4 ${
                          checkin.type === "weekly"
                            ? "text-purple-600"
                            : "text-blue-600"
                        }`}
                      />
                    ) : (
                      <CalendarCheck className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {checkin.type} Check-in
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(checkin.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {checkin.weight && (
                    <p className="font-medium text-foreground">
                      {checkin.weight} kg
                    </p>
                  )}
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No check-ins yet. Complete your first check-in above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
