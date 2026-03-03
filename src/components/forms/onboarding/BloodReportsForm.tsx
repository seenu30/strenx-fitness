"use client";

import { useState } from "react";
import type { AssessmentData, BloodReportsData } from "@/types/onboarding";

interface BloodReportsFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export default function BloodReportsForm({
  data,
  onSave,
  onNext,
}: BloodReportsFormProps) {
  const initialData = data.bloodReports || {
    hasRecentReports: false,
    reportDate: "",
    labName: "",
  };

  const [formData, setFormData] = useState<BloodReportsData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || undefined : value,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasRecentReports) {
      newErrors.hasRecentReports = "Blood reports are required. Please check the box and provide your report details.";
    } else {
      if (!formData.reportDate) {
        newErrors.reportDate = "Please enter the report date";
      }
      if (!formData.labName?.trim()) {
        newErrors.labName = "Please enter the lab name";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("bloodReports", formData);
      onNext();
    }
  };

  return (
    <form id="form-blood_reports" onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Blood reports are required. They help your coach create a personalized
          nutrition plan based on your actual health markers. Please provide your
          recent blood test results (within the last 3 months).
        </p>
      </div>

      {/* Has Recent Reports */}
      <div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasRecentReports"
            checked={formData.hasRecentReports}
            onChange={(e) => setFormData((prev) => ({ ...prev, hasRecentReports: e.target.checked }))}
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="hasRecentReports" className="text-sm font-medium text-foreground">
            I have blood reports from the last 3 months *
          </label>
        </div>
        {errors.hasRecentReports && (
          <p className="mt-2 text-sm text-red-500">{errors.hasRecentReports}</p>
        )}
      </div>

      {formData.hasRecentReports && (
        <>
          {/* Report Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Report Date *
              </label>
              <input
                type="date"
                name="reportDate"
                value={formData.reportDate || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.reportDate ? "border-red-500" : "border-border"
                } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.reportDate && (
                <p className="mt-1 text-sm text-red-500">{errors.reportDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Lab Name *
              </label>
              <input
                type="text"
                name="labName"
                value={formData.labName || ""}
                onChange={handleChange}
                placeholder="e.g., Dr. Lal PathLabs"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.labName ? "border-red-500" : "border-border"
                } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.labName && (
                <p className="mt-1 text-sm text-red-500">{errors.labName}</p>
              )}
            </div>
          </div>

          {/* CBC */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Complete Blood Count (CBC)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Hemoglobin (g/dL)</label>
                <input type="number" name="hemoglobin" value={formData.hemoglobin || ""} onChange={handleChange} step="0.1" placeholder="12-16" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">RBC (million/μL)</label>
                <input type="number" name="rbc" value={formData.rbc || ""} onChange={handleChange} step="0.01" placeholder="4.5-5.5" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">WBC (thousand/μL)</label>
                <input type="number" name="wbc" value={formData.wbc || ""} onChange={handleChange} step="0.1" placeholder="4-11" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Platelets (thousand/μL)</label>
                <input type="number" name="platelets" value={formData.platelets || ""} onChange={handleChange} placeholder="150-400" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
            </div>
          </div>

          {/* Thyroid */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Thyroid Panel
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">TSH (mIU/L)</label>
                <input type="number" name="tsh" value={formData.tsh || ""} onChange={handleChange} step="0.01" placeholder="0.4-4.0" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">T3 (ng/dL)</label>
                <input type="number" name="t3" value={formData.t3 || ""} onChange={handleChange} step="1" placeholder="80-200" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">T4 (μg/dL)</label>
                <input type="number" name="t4" value={formData.t4 || ""} onChange={handleChange} step="0.1" placeholder="4.5-12" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
            </div>
          </div>

          {/* Lipid Profile */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Lipid Profile
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Total Cholesterol</label>
                <input type="number" name="totalCholesterol" value={formData.totalCholesterol || ""} onChange={handleChange} placeholder="<200" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">LDL (mg/dL)</label>
                <input type="number" name="ldl" value={formData.ldl || ""} onChange={handleChange} placeholder="<100" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">HDL (mg/dL)</label>
                <input type="number" name="hdl" value={formData.hdl || ""} onChange={handleChange} placeholder=">40" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Triglycerides</label>
                <input type="number" name="triglycerides" value={formData.triglycerides || ""} onChange={handleChange} placeholder="<150" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
            </div>
          </div>

          {/* Blood Sugar */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Blood Sugar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Fasting Glucose (mg/dL)</label>
                <input type="number" name="fastingGlucose" value={formData.fastingGlucose || ""} onChange={handleChange} placeholder="70-100" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">HbA1c (%)</label>
                <input type="number" name="hba1c" value={formData.hba1c || ""} onChange={handleChange} step="0.1" placeholder="<5.7" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
            </div>
          </div>

          {/* Vitamins & Minerals */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Vitamins & Minerals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Vitamin D (ng/mL)</label>
                <input type="number" name="vitaminD" value={formData.vitaminD || ""} onChange={handleChange} placeholder="30-100" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Vitamin B12 (pg/mL)</label>
                <input type="number" name="vitaminB12" value={formData.vitaminB12 || ""} onChange={handleChange} placeholder="200-900" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Iron (μg/dL)</label>
                <input type="number" name="iron" value={formData.iron || ""} onChange={handleChange} placeholder="60-170" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Ferritin (ng/mL)</label>
                <input type="number" name="ferritin" value={formData.ferritin || ""} onChange={handleChange} placeholder="20-200" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" />
              </div>
            </div>
          </div>
        </>
      )}

      {!formData.hasRecentReports && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Please check the box above and enter your blood report details. If you don&apos;t have
          recent reports, please get a blood test done and come back to complete your application.
        </p>
      )}
    </form>
  );
}
