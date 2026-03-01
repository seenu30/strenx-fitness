"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Ruler,
  Camera,
  Activity,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProgressData {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  weightHistory: Array<{ date: string; weight: number }>;
  measurements: {
    start: { chest: number; waist: number; hips: number; arm: number; thigh: number };
    current: { chest: number; waist: number; hips: number; arm: number; thigh: number };
  };
  photoCount: number;
  complianceStats: {
    overall: number;
  };
}

interface ClientRow {
  id: string;
  tenant_id: string;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
}

interface WeightCheckinRow {
  checkin_date: string;
  morning_weight_kg: number | null;
}

interface MeasurementRow {
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  left_thigh_cm: number | null;
}

interface CheckinRow {
  id: string;
}

const DEFAULT_DATA: ProgressData = {
  startWeight: 0,
  currentWeight: 0,
  targetWeight: 0,
  weightHistory: [],
  measurements: {
    start: { chest: 0, waist: 0, hips: 0, arm: 0, thigh: 0 },
    current: { chest: 0, waist: 0, hips: 0, arm: 0, thigh: 0 },
  },
  photoCount: 0,
  complianceStats: { overall: 0 },
};

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ProgressData>(DEFAULT_DATA);

  useEffect(() => {
    async function loadProgressData() {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: client } = await supabase
          .from("clients")
          .select("id, tenant_id, start_weight_kg, target_weight_kg")
          .eq("user_id", user.id)
          .single() as { data: ClientRow | null };

        if (!client) {
          setIsLoading(false);
          return;
        }

        const { data: weightCheckins } = await supabase
          .from("daily_checkins")
          .select("checkin_date, morning_weight_kg")
          .eq("client_id", client.id)
          .not("morning_weight_kg", "is", null)
          .order("checkin_date", { ascending: true }) as { data: WeightCheckinRow[] | null };

        const weightHistory = (weightCheckins || []).map((w: WeightCheckinRow) => ({
          date: new Date(w.checkin_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          weight: w.morning_weight_kg ?? 0,
        }));

        const startWeight = client.start_weight_kg || (weightHistory.length > 0 ? weightHistory[0].weight : 0);
        const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : startWeight;
        const targetWeight = client.target_weight_kg || startWeight - 10;

        const { data: measurementsData } = await supabase
          .from("measurements")
          .select("*")
          .eq("client_id", client.id)
          .order("measurement_date", { ascending: true }) as { data: MeasurementRow[] | null };

        let startMeasurements = { chest: 0, waist: 0, hips: 0, arm: 0, thigh: 0 };
        let currentMeasurements = { chest: 0, waist: 0, hips: 0, arm: 0, thigh: 0 };

        if (measurementsData && measurementsData.length > 0) {
          const first = measurementsData[0];
          const last = measurementsData[measurementsData.length - 1];

          startMeasurements = {
            chest: first.chest_cm || 0,
            waist: first.waist_cm || 0,
            hips: first.hips_cm || 0,
            arm: first.left_arm_cm || 0,
            thigh: first.left_thigh_cm || 0,
          };

          currentMeasurements = {
            chest: last.chest_cm || 0,
            waist: last.waist_cm || 0,
            hips: last.hips_cm || 0,
            arm: last.left_arm_cm || 0,
            thigh: last.left_thigh_cm || 0,
          };
        }

        const { count: photoCount } = await supabase
          .from("progress_photos")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id);

        // Calculate compliance (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentCheckins } = await supabase
          .from("daily_checkins")
          .select("id")
          .eq("client_id", client.id)
          .gte("checkin_date", sevenDaysAgo.toISOString().split('T')[0]) as { data: CheckinRow[] | null };

        const compliance = Math.round(((recentCheckins?.length || 0) / 7) * 100);

        setData({
          startWeight,
          currentWeight,
          targetWeight,
          weightHistory,
          measurements: {
            start: startMeasurements,
            current: currentMeasurements,
          },
          photoCount: photoCount || 0,
          complianceStats: { overall: compliance },
        });
      } catch (error) {
        console.error("Error loading progress data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgressData();
  }, []);

  const weightLost = data.startWeight - data.currentWeight;
  const weightRemaining = data.currentWeight - data.targetWeight;
  const totalToLose = data.startWeight - data.targetWeight;
  const progressPercent = totalToLose > 0 ? Math.round((weightLost / totalToLose) * 100) : 0;

  // Simple chart rendering
  const maxWeight = data.weightHistory.length > 0
    ? Math.max(...data.weightHistory.map((d) => d.weight))
    : 100;
  const minWeight = data.weightHistory.length > 0
    ? Math.min(...data.weightHistory.map((d) => d.weight))
    : 50;
  const weightRange = maxWeight - minWeight || 1;

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
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Progress Tracking
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Track your transformation journey
        </p>
      </div>

      {/* Weight Progress Card */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">
            Weight Progress
          </h2>
          <div className="flex gap-2">
            {(["1m", "3m", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? "bg-brown-500 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                }`}
              >
                {range === "1m" ? "1M" : range === "3m" ? "3M" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
            <p className="text-xs text-stone-500 mb-1">Starting</p>
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {data.startWeight > 0 ? `${data.startWeight} kg` : "-"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-brown-50 dark:bg-brown-900/20">
            <p className="text-xs text-stone-500 mb-1">Current</p>
            <p className="text-lg font-bold text-brown-500">
              {data.currentWeight > 0 ? `${data.currentWeight} kg` : "-"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-xs text-stone-500 mb-1">Target</p>
            <p className="text-lg font-bold text-green-600">
              {data.targetWeight > 0 ? `${data.targetWeight} kg` : "-"}
            </p>
          </div>
        </div>

        {/* Simple Chart */}
        <div className="h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 37.5}
                x2="400"
                y2={i * 37.5}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-stone-200 dark:text-stone-700"
              />
            ))}

            {/* Line chart */}
            {data.weightHistory.length > 1 && (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-brown-500"
                points={data.weightHistory
                  .map((d, i) => {
                    const x = (i / (data.weightHistory.length - 1)) * 380 + 10;
                    const y = ((maxWeight - d.weight) / weightRange) * 120 + 15;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            )}

            {/* Data points */}
            {data.weightHistory.map((d, i) => {
              const x = data.weightHistory.length > 1
                ? (i / (data.weightHistory.length - 1)) * 380 + 10
                : 200;
              const y = ((maxWeight - d.weight) / weightRange) * 120 + 15;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="currentColor"
                  className="text-brown-500"
                />
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-stone-500 px-2">
            {data.weightHistory.length === 0 ? (
              <span className="w-full text-center">No weight data yet</span>
            ) : data.weightHistory.filter((_, i) => i % 2 === 0).map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-stone-600 dark:text-stone-400">
              Lost {weightLost.toFixed(1)} kg
            </span>
            <span className="text-stone-600 dark:text-stone-400">
              {weightRemaining.toFixed(1)} kg to go
            </span>
          </div>
          <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brown-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="text-center text-sm text-brown-500 font-medium mt-2">
            {progressPercent}% to goal
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Weight Lost */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Lost</p>
              <p className="text-xl font-bold text-green-600">
                -{weightLost.toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        {/* Waist Change */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Ruler className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Waist</p>
              <p className="text-xl font-bold text-blue-600">
                {data.measurements.start.waist > 0
                  ? `${data.measurements.start.waist - data.measurements.current.waist > 0 ? "-" : "+"}${Math.abs(data.measurements.start.waist - data.measurements.current.waist)} cm`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brown-100 dark:bg-brown-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-brown-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Compliance</p>
              <p className="text-xl font-bold text-brown-500">
                {data.complianceStats.overall}%
              </p>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Photos</p>
              <p className="text-xl font-bold text-purple-600">
                {data.photoCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Measurements Summary */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">
            Body Measurements
          </h2>
          <Link
            href="/progress/measurements"
            className="text-sm text-brown-500 hover:text-brown-600 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-stone-500 border-b border-stone-200 dark:border-stone-700">
                <th className="text-left py-2 font-medium">Measurement</th>
                <th className="text-center py-2 font-medium">Start</th>
                <th className="text-center py-2 font-medium">Current</th>
                <th className="text-center py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {Object.entries(data.measurements.start).map(([key, startValue]) => {
                const currentValue = data.measurements.current[key as keyof typeof data.measurements.current];
                const change = startValue - currentValue;
                const hasData = startValue > 0 || currentValue > 0;
                return (
                  <tr key={key}>
                    <td className="py-3 text-stone-800 dark:text-stone-200 capitalize">
                      {key}
                    </td>
                    <td className="py-3 text-center text-stone-600 dark:text-stone-400">
                      {hasData ? `${startValue} cm` : "-"}
                    </td>
                    <td className="py-3 text-center text-stone-800 dark:text-stone-200 font-medium">
                      {hasData ? `${currentValue} cm` : "-"}
                    </td>
                    <td className="py-3 text-center">
                      {hasData ? (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            change > 0
                              ? "text-green-600"
                              : change < 0
                              ? "text-red-600"
                              : "text-stone-500"
                          }`}
                        >
                          {change > 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : change < 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          {change > 0 ? "-" : change < 0 ? "+" : ""}
                          {Math.abs(change)} cm
                        </span>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/progress/photos"
          className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brown-300 dark:hover:border-brown-600 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Camera className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-stone-800 dark:text-stone-200">
              Progress Photos
            </h3>
            <p className="text-sm text-stone-500">Compare your transformation</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 ml-auto" />
        </Link>

        <Link
          href="/progress/measurements"
          className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brown-300 dark:hover:border-brown-600 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Ruler className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-stone-800 dark:text-stone-200">
              Measurements
            </h3>
            <p className="text-sm text-stone-500">Body measurement history</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 ml-auto" />
        </Link>

        <Link
          href="/progress/blood-reports"
          className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brown-300 dark:hover:border-brown-600 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Activity className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-stone-800 dark:text-stone-200">
              Blood Reports
            </h3>
            <p className="text-sm text-stone-500">Track health markers</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 ml-auto" />
        </Link>
      </div>
    </div>
  );
}
