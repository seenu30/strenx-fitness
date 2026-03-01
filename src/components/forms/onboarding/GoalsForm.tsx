"use client";

import { useState } from "react";
import type { AssessmentData, GoalsData } from "@/types/onboarding";

interface GoalsFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const PRIMARY_GOALS = [
  { value: "fat_loss", label: "Fat Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "body_recomposition", label: "Body Recomposition" },
  { value: "strength", label: "Build Strength" },
  { value: "endurance", label: "Improve Endurance" },
  { value: "general_fitness", label: "General Fitness" },
  { value: "sports_performance", label: "Sports Performance" },
  { value: "health_improvement", label: "Health Improvement" },
];

const SECONDARY_GOALS = [
  "Improve energy levels",
  "Better sleep quality",
  "Reduce stress",
  "Build healthy habits",
  "Improve posture",
  "Increase flexibility",
  "Better mental clarity",
  "Boost confidence",
];

const TIMELINE_OPTIONS = [
  { value: 4, label: "1 month" },
  { value: 8, label: "2 months" },
  { value: 12, label: "3 months" },
  { value: 24, label: "6 months" },
  { value: 52, label: "1 year" },
];

export default function GoalsForm({
  data,
  onSave,
  onNext,
}: GoalsFormProps) {
  const initialData = data.goals || {
    primaryGoal: "",
    secondaryGoals: [],
    targetWeightKg: undefined,
    targetTimelineWeeks: 12,
    motivationLevel: 7,
    commitmentHoursPerWeek: 5,
    previousAttempts: "",
  };

  const [formData, setFormData] = useState<GoalsData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSecondaryGoalToggle = (goal: string) => {
    setFormData((prev) => ({
      ...prev,
      secondaryGoals: prev.secondaryGoals.includes(goal)
        ? prev.secondaryGoals.filter((g) => g !== goal)
        : [...prev.secondaryGoals, goal],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.primaryGoal) {
      newErrors.primaryGoal = "Please select your primary goal";
    }
    if (formData.motivationLevel < 1 || formData.motivationLevel > 10) {
      newErrors.motivationLevel = "Please rate your motivation (1-10)";
    }
    if (formData.commitmentHoursPerWeek < 1) {
      newErrors.commitmentHoursPerWeek = "Please specify weekly commitment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("goals", formData);
      onNext();
    }
  };

  return (
    <form id="form-goals" onSubmit={handleSubmit} className="space-y-6">
      {/* Primary Goal */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          What is your primary goal? *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRIMARY_GOALS.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, primaryGoal: goal.value }));
                if (errors.primaryGoal) {
                  setErrors((prev) => ({ ...prev, primaryGoal: "" }));
                }
              }}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                formData.primaryGoal === goal.value
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:border-amber-500"
              }`}
            >
              {goal.label}
            </button>
          ))}
        </div>
        {errors.primaryGoal && (
          <p className="mt-2 text-sm text-red-500">{errors.primaryGoal}</p>
        )}
      </div>

      {/* Secondary Goals */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Any secondary goals? (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => handleSecondaryGoalToggle(goal)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.secondaryGoals.includes(goal)
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Target Weight (optional) */}
      <div>
        <label
          htmlFor="targetWeightKg"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          Target Weight (kg) - Optional
        </label>
        <input
          id="targetWeightKg"
          name="targetWeightKg"
          type="number"
          value={formData.targetWeightKg || ""}
          onChange={handleChange}
          min="30"
          max="200"
          step="0.5"
          placeholder="Leave blank if unsure"
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Timeline */}
      <div>
        <label
          htmlFor="targetTimelineWeeks"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          How long do you want to achieve your goal? *
        </label>
        <select
          id="targetTimelineWeeks"
          name="targetTimelineWeeks"
          value={formData.targetTimelineWeeks}
          onChange={handleChange}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {TIMELINE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Motivation Level */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          How motivated are you to achieve this goal? *
        </label>
        <div className="space-y-2">
          <input
            type="range"
            name="motivationLevel"
            min="1"
            max="10"
            value={formData.motivationLevel}
            onChange={handleChange}
            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
          <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
            <span>Not very (1)</span>
            <span className="font-bold text-amber-600">{formData.motivationLevel}</span>
            <span>Extremely (10)</span>
          </div>
        </div>
        {errors.motivationLevel && (
          <p className="mt-1 text-sm text-red-500">{errors.motivationLevel}</p>
        )}
      </div>

      {/* Commitment */}
      <div>
        <label
          htmlFor="commitmentHoursPerWeek"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          Hours per week you can commit to training *
        </label>
        <input
          id="commitmentHoursPerWeek"
          name="commitmentHoursPerWeek"
          type="number"
          value={formData.commitmentHoursPerWeek || ""}
          onChange={handleChange}
          min="1"
          max="30"
          placeholder="e.g., 5"
          className={`w-full max-w-xs px-4 py-2.5 rounded-lg border ${
            errors.commitmentHoursPerWeek
              ? "border-red-500"
              : "border-stone-300 dark:border-stone-600"
          } bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500`}
        />
        {errors.commitmentHoursPerWeek && (
          <p className="mt-1 text-sm text-red-500">{errors.commitmentHoursPerWeek}</p>
        )}
      </div>

      {/* Previous Attempts */}
      <div>
        <label
          htmlFor="previousAttempts"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          Have you tried achieving this goal before? What happened?
        </label>
        <textarea
          id="previousAttempts"
          name="previousAttempts"
          value={formData.previousAttempts || ""}
          onChange={handleChange}
          rows={3}
          placeholder="Share your past experiences..."
          className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>
    </form>
  );
}
