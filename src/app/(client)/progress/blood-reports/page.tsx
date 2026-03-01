"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
  Loader2,
} from "lucide-react";

type MarkerCategory = "cbc" | "thyroid" | "lipid" | "diabetes" | "vitamins" | "kidney";

interface MarkerConfig {
  key: string;
  label: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  category: MarkerCategory;
}

interface BloodValues {
  hemoglobin?: number;
  tsh?: number;
  t3?: number;
  t4?: number;
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  fastingGlucose?: number;
  hba1c?: number;
  vitaminD?: number;
  vitaminB12?: number;
  iron?: number;
  creatinine?: number;
}

interface BloodReport {
  id: string;
  date: string;
  labName: string;
  values: BloodValues;
  hasAbnormalValues: boolean;
  abnormalMarkers: string[];
}

const MARKERS: MarkerConfig[] = [
  // CBC
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", normalMin: 12, normalMax: 17, category: "cbc" },
  // Thyroid
  { key: "tsh", label: "TSH", unit: "mIU/L", normalMin: 0.4, normalMax: 4.0, category: "thyroid" },
  { key: "t3", label: "T3", unit: "ng/mL", normalMin: 0.8, normalMax: 2.0, category: "thyroid" },
  { key: "t4", label: "T4", unit: "µg/dL", normalMin: 5.0, normalMax: 12.0, category: "thyroid" },
  // Lipid Profile
  { key: "totalCholesterol", label: "Total Cholesterol", unit: "mg/dL", normalMin: 0, normalMax: 200, category: "lipid" },
  { key: "ldl", label: "LDL", unit: "mg/dL", normalMin: 0, normalMax: 100, category: "lipid" },
  { key: "hdl", label: "HDL", unit: "mg/dL", normalMin: 40, normalMax: 100, category: "lipid" },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", normalMin: 0, normalMax: 150, category: "lipid" },
  // Diabetes
  { key: "fastingGlucose", label: "Fasting Glucose", unit: "mg/dL", normalMin: 70, normalMax: 100, category: "diabetes" },
  { key: "hba1c", label: "HbA1c", unit: "%", normalMin: 4.0, normalMax: 5.7, category: "diabetes" },
  // Vitamins
  { key: "vitaminD", label: "Vitamin D", unit: "ng/mL", normalMin: 30, normalMax: 100, category: "vitamins" },
  { key: "vitaminB12", label: "Vitamin B12", unit: "pg/mL", normalMin: 200, normalMax: 900, category: "vitamins" },
  { key: "iron", label: "Iron", unit: "µg/dL", normalMin: 60, normalMax: 170, category: "vitamins" },
  // Kidney
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", normalMin: 0.7, normalMax: 1.3, category: "kidney" },
];

const CATEGORY_LABELS: Record<MarkerCategory, string> = {
  cbc: "Complete Blood Count",
  thyroid: "Thyroid Panel",
  lipid: "Lipid Profile",
  diabetes: "Blood Sugar",
  vitamins: "Vitamins & Minerals",
  kidney: "Kidney Function",
};

export default function BloodReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<BloodReport[]>([]);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("/api/blood-reports");
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      } catch (error) {
        console.error("Error loading blood reports:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReports();
  }, []);

  const latestReport = reports.length > 0 ? reports[0] : null;
  const previousReport = reports.length > 1 ? reports[1] : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatus = (value: number | undefined, marker: MarkerConfig) => {
    if (value === undefined) return "unknown";
    if (value < marker.normalMin) return "low";
    if (value > marker.normalMax) return "high";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "unknown":
        return "text-stone-400 bg-stone-50 dark:bg-stone-800";
      default:
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
    }
  };

  const getChangeIcon = (current: number | undefined, previous: number | undefined, marker: MarkerConfig) => {
    if (current === undefined || previous === undefined) return null;
    const diff = current - previous;
    const currentStatus = getStatus(current, marker);
    const previousStatus = getStatus(previous, marker);

    // Improved status
    if (currentStatus === "normal" && previousStatus !== "normal") {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    // Worsened status
    if (currentStatus !== "normal" && previousStatus === "normal") {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    // Same status, show direction
    if (Math.abs(diff) < 0.01) return <Minus className="w-4 h-4 text-stone-400" />;
    return diff > 0 ? (
      <TrendingUp className="w-4 h-4 text-stone-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-stone-400" />
    );
  };

  const filteredMarkers =
    selectedCategory === "all"
      ? MARKERS
      : MARKERS.filter((m) => m.category === selectedCategory);

  const categories = Object.keys(CATEGORY_LABELS) as MarkerCategory[];

  // Count issues
  const issueCount = latestReport
    ? MARKERS.filter((marker) => {
        const value = latestReport.values[marker.key as keyof BloodValues];
        return value !== undefined && getStatus(value, marker) !== "normal";
      }).length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  // Empty state - no reports
  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Progress
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Blood Report Tracker
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Monitor your health markers over time
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
          <Activity className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2">
            No Blood Reports Yet
          </h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Upload your blood test reports to track your health markers over time.
            Your coach can help analyze the results and optimize your nutrition plan.
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Contact Coach to Add Report
          </Link>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                About Blood Reports
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your blood report data is encrypted and only visible to you and your coach.
                Regular monitoring helps optimize your nutrition and training plan for better results.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Blood Report Tracker
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Monitor your health markers over time
          </p>
        </div>
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Report
        </Link>
      </div>

      {/* Latest Report Summary */}
      {latestReport && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-stone-800 dark:text-stone-100">
                Latest Report
              </h2>
              <p className="text-sm text-stone-500 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {formatDate(latestReport.date)} • {latestReport.labName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {latestReport.hasAbnormalValues || issueCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {issueCount || latestReport.abnormalMarkers?.length || 0} markers need attention
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  All markers normal
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats - show if values exist */}
          {Object.keys(latestReport.values).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p className="text-xs text-stone-500">Hemoglobin</p>
                <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
                  {latestReport.values.hemoglobin ?? "-"} g/dL
                </p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p className="text-xs text-stone-500">Vitamin D</p>
                <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
                  {latestReport.values.vitaminD ?? "-"} ng/mL
                </p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p className="text-xs text-stone-500">Cholesterol</p>
                <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
                  {latestReport.values.totalCholesterol ?? "-"} mg/dL
                </p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <p className="text-xs text-stone-500">HbA1c</p>
                <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
                  {latestReport.values.hba1c ?? "-"}%
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50 text-center">
              <p className="text-stone-500">
                Report metadata available. Contact your coach to view detailed values.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-amber-600 text-white"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          All Markers
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-amber-600 text-white"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Detailed Markers Table */}
      {latestReport && Object.keys(latestReport.values).length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-stone-500">Marker</th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500">Current</th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500">Previous</th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500">Change</th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500">Normal Range</th>
                  <th className="text-center py-3 px-4 font-medium text-stone-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredMarkers.map((marker) => {
                  const currentValue = latestReport.values[marker.key as keyof BloodValues];
                  const previousValue = previousReport
                    ? previousReport.values[marker.key as keyof BloodValues]
                    : undefined;
                  const status = getStatus(currentValue, marker);
                  const change = currentValue !== undefined && previousValue !== undefined
                    ? currentValue - previousValue
                    : 0;

                  return (
                    <tr key={marker.key}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800 dark:text-stone-200">
                          {marker.label}
                        </div>
                        <div className="text-xs text-stone-500">{marker.unit}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-stone-800 dark:text-stone-200">
                        {currentValue ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {previousValue ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getChangeIcon(currentValue, previousValue, marker)}
                          {currentValue !== undefined && previousValue !== undefined && (
                            <span className="text-stone-500">
                              {change > 0 ? "+" : ""}
                              {change.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {marker.normalMin} - {marker.normalMax}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report History */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          Report History
        </h2>
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">
                    {formatDate(report.date)}
                  </p>
                  <p className="text-sm text-stone-500">{report.labName}</p>
                </div>
              </div>
              {report.hasAbnormalValues && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Needs Review
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              About Blood Reports
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Your blood report data is encrypted and only visible to you and your coach.
              Regular monitoring helps optimize your nutrition and training plan for better results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
