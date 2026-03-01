"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Ruler,
  ChevronLeft,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Plus,
  Loader2,
} from "lucide-react";

interface Measurement {
  date: string;
  week: number;
  chest: number;
  waist: number;
  hips: number;
  leftArm: number;
  rightArm: number;
  leftThigh: number;
  rightThigh: number;
}

type MeasurementKey = "chest" | "waist" | "hips" | "leftArm" | "rightArm" | "leftThigh" | "rightThigh";

interface ClientRow {
  id: string;
  start_date: string | null;
}

interface MeasurementRow {
  measured_at: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
}

const MEASUREMENT_CONFIG: Array<{
  key: MeasurementKey;
  label: string;
  color: string;
}> = [
  { key: "chest", label: "Chest", color: "text-blue-500" },
  { key: "waist", label: "Waist", color: "text-red-500" },
  { key: "hips", label: "Hips", color: "text-purple-500" },
  { key: "leftArm", label: "Left Arm", color: "text-green-500" },
  { key: "rightArm", label: "Right Arm", color: "text-green-600" },
  { key: "leftThigh", label: "Left Thigh", color: "text-brown-500" },
  { key: "rightThigh", label: "Right Thigh", color: "text-brown-500" },
];

export default function MeasurementsPage() {
  const [loading, setLoading] = useState(true);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementKey>("waist");

  const supabase = createClient();

  const loadMeasurements = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id, start_date")
        .eq("user_id", user.id)
        .single() as { data: ClientRow | null };

      if (!client) return;

      const { data: measurementsData } = await supabase
        .from("measurements")
        .select("*")
        .eq("client_id", client.id)
        .order("measured_at", { ascending: true }) as { data: MeasurementRow[] | null };

      if (measurementsData && measurementsData.length > 0) {
        const startDate = client.start_date ? new Date(client.start_date) : new Date(measurementsData[0].measured_at);

        const formatted = measurementsData.map((m: MeasurementRow) => {
          const measureDate = new Date(m.measured_at);
          const weekNum = Math.ceil((measureDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1;

          return {
            date: m.measured_at,
            week: weekNum,
            chest: m.chest_cm || 0,
            waist: m.waist_cm || 0,
            hips: m.hips_cm || 0,
            leftArm: m.left_arm_cm || 0,
            rightArm: m.right_arm_cm || 0,
            leftThigh: m.left_thigh_cm || 0,
            rightThigh: m.right_thigh_cm || 0,
          };
        });

        setMeasurements(formatted);
      }

    } catch (error) {
      console.error("Error loading measurements:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brown-500" />
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Progress
            </Link>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              Body Measurements
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              Track your body composition changes
            </p>
          </div>
          <Link
            href="/check-in/weekly"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Measurements
          </Link>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
          <Ruler className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">
            No Measurements Yet
          </h3>
          <p className="text-stone-500 mb-4">
            Complete your weekly check-in to add body measurements.
          </p>
          <Link
            href="/check-in/weekly"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Measurement
          </Link>
        </div>
      </div>
    );
  }

  const firstMeasurement = measurements[0];
  const lastMeasurement = measurements[measurements.length - 1];

  const getChange = (key: MeasurementKey) => {
    return firstMeasurement[key] - lastMeasurement[key];
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-stone-400" />;
  };

  // Chart calculations
  const selectedData = measurements.map((m) => m[selectedMeasurement]);
  const maxValue = Math.max(...selectedData);
  const minValue = Math.min(...selectedData);
  const range = maxValue - minValue || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Progress
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Body Measurements
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Track your body composition changes
          </p>
        </div>
        <Link
          href="/check-in/weekly"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Measurements
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {MEASUREMENT_CONFIG.slice(0, 4).map((config) => {
          const change = getChange(config.key);
          const lastValue = lastMeasurement[config.key];
          return (
            <div
              key={config.key}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-500">{config.label}</span>
                {getChangeIcon(change)}
              </div>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">
                {lastValue > 0 ? `${lastValue} cm` : "N/A"}
              </p>
              {lastValue > 0 && (
                <p
                  className={`text-sm ${
                    change > 0
                      ? "text-green-600"
                      : change < 0
                      ? "text-red-600"
                      : "text-stone-500"
                  }`}
                >
                  {change > 0 ? "-" : change < 0 ? "+" : ""}
                  {Math.abs(change).toFixed(1)} cm from start
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">
            Measurement Trend
          </h2>
          <select
            value={selectedMeasurement}
            onChange={(e) => setSelectedMeasurement(e.target.value as MeasurementKey)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
          >
            {MEASUREMENT_CONFIG.map((config) => (
              <option key={config.key} value={config.key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Simple Line Chart */}
        <div className="h-48 relative">
          {selectedData.some(v => v > 0) ? (
            <>
              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={i * 30 + 15}
                    x2="390"
                    y2={i * 30 + 15}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-stone-200 dark:text-stone-700"
                  />
                ))}

                {/* Y-axis labels */}
                <text x="35" y="20" textAnchor="end" className="text-xs fill-stone-500">
                  {maxValue}
                </text>
                <text x="35" y="140" textAnchor="end" className="text-xs fill-stone-500">
                  {minValue}
                </text>

                {/* Area fill */}
                <path
                  d={`
                    M ${40},${((maxValue - selectedData[0]) / range) * 110 + 20}
                    ${selectedData
                      .map((val, i) => {
                        const x = (i / (selectedData.length - 1)) * 340 + 50;
                        const y = ((maxValue - val) / range) * 110 + 20;
                        return `L ${x},${y}`;
                      })
                      .join(" ")}
                    L ${390},${135}
                    L ${50},${135}
                    Z
                  `}
                  fill="url(#gradient)"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  points={selectedData
                    .map((val, i) => {
                      const x = (i / (selectedData.length - 1)) * 340 + 50;
                      const y = ((maxValue - val) / range) * 110 + 20;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {/* Data points */}
                {selectedData.map((val, i) => {
                  const x = (i / (selectedData.length - 1)) * 340 + 50;
                  const y = ((maxValue - val) / range) * 110 + 20;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#f59e0b"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-stone-500 px-2">
                {measurements.map((m) => (
                  <span key={m.date}>{formatDate(m.date)}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-stone-500">
              No data for {MEASUREMENT_CONFIG.find(c => c.key === selectedMeasurement)?.label}
            </div>
          )}
        </div>
      </div>

      {/* Full History Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">
            Measurement History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-stone-500">Date</th>
                <th className="text-center py-3 px-4 font-medium text-stone-500">Week</th>
                {MEASUREMENT_CONFIG.map((config) => (
                  <th
                    key={config.key}
                    className="text-center py-3 px-4 font-medium text-stone-500"
                  >
                    {config.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {[...measurements].reverse().map((measurement, index) => (
                <tr
                  key={measurement.date}
                  className={index === 0 ? "bg-brown-50 dark:bg-brown-900/10" : ""}
                >
                  <td className="py-3 px-4 text-stone-800 dark:text-stone-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      {formatDate(measurement.date)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-stone-600 dark:text-stone-400">
                    Week {measurement.week}
                  </td>
                  {MEASUREMENT_CONFIG.map((config) => (
                    <td
                      key={config.key}
                      className="py-3 px-4 text-center text-stone-800 dark:text-stone-200"
                    >
                      {measurement[config.key] > 0 ? `${measurement[config.key]} cm` : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex gap-3">
          <Ruler className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Measurement Tips
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>Measure at the same time of day (morning is best)</li>
              <li>Use the same tape measure each time</li>
              <li>Keep the tape snug but not tight</li>
              <li>Measure in the same location on your body</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
