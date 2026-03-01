"use client";

import { useState } from "react";
import type { AssessmentData, LifestyleData } from "@/types/onboarding";

interface LifestyleFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const SLEEP_QUALITY_OPTIONS = [
  { value: "poor", label: "Poor", description: "Frequent waking, not restful" },
  { value: "fair", label: "Fair", description: "Some issues, could be better" },
  { value: "good", label: "Good", description: "Generally restful" },
  { value: "excellent", label: "Excellent", description: "Deep, uninterrupted sleep" },
] as const;

const SLEEP_ISSUES = [
  "Difficulty falling asleep",
  "Waking up frequently",
  "Waking too early",
  "Snoring/sleep apnea",
  "Restless legs",
  "Using phone before bed",
  "Irregular sleep schedule",
  "None",
];

const STRESS_SOURCES = [
  "Work",
  "Family",
  "Finances",
  "Health",
  "Relationships",
  "Studies",
  "Commute",
  "None",
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise, desk job" },
  { value: "lightly_active", label: "Lightly Active", description: "Light exercise 1-3 days/week" },
  { value: "moderately_active", label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
  { value: "very_active", label: "Very Active", description: "Hard exercise 6-7 days/week" },
  { value: "extremely_active", label: "Extremely Active", description: "Very hard exercise, physical job" },
] as const;

const WORK_TYPES = [
  { value: "desk_job", label: "Desk Job" },
  { value: "standing", label: "Standing Job" },
  { value: "physical_labor", label: "Physical Labor" },
  { value: "mixed", label: "Mixed" },
  { value: "work_from_home", label: "Work From Home" },
] as const;

export default function LifestyleForm({ data, onSave, onNext }: LifestyleFormProps) {
  const initialData = data.lifestyle || {
    sleepHours: 7,
    sleepQuality: "good" as const,
    sleepIssues: [],
    stressLevel: 5,
    stressSources: [],
    activityLevel: "lightly_active" as const,
    dailySteps: undefined,
    workType: "desk_job" as const,
    screenTimeHours: 6,
  };

  const [formData, setFormData] = useState<LifestyleData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleArrayToggle = (field: keyof LifestyleData, value: string) => {
    setFormData((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave("lifestyle", formData);
    onNext();
  };

  return (
    <form id="form-lifestyle" onSubmit={handleSubmit} className="space-y-6">
      {/* Sleep Hours */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How many hours of sleep do you get on average?
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="sleepHours"
            min="4"
            max="10"
            step="0.5"
            value={formData.sleepHours}
            onChange={handleChange}
            className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <span className="text-lg font-bold text-brown-500 w-16 text-center">
            {formData.sleepHours}h
          </span>
        </div>
      </div>

      {/* Sleep Quality */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How would you rate your sleep quality?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SLEEP_QUALITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, sleepQuality: option.value }))}
              className={`p-3 rounded-lg border text-left transition-colors ${
                formData.sleepQuality === option.value
                  ? "bg-brown-500 border-brown-500 text-white"
                  : "bg-card border-border hover:border-brown-500"
              }`}
            >
              <div className={`font-medium ${formData.sleepQuality === option.value ? "text-white" : "text-foreground"}`}>
                {option.label}
              </div>
              <div className={`text-xs mt-1 ${formData.sleepQuality === option.value ? "text-brown-100" : "text-stone-500 dark:text-stone-400"}`}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sleep Issues */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Do you have any sleep issues?
        </label>
        <div className="flex flex-wrap gap-2">
          {SLEEP_ISSUES.map((issue) => (
            <button
              key={issue}
              type="button"
              onClick={() => handleArrayToggle("sleepIssues", issue)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.sleepIssues.includes(issue)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {issue}
            </button>
          ))}
        </div>
      </div>

      {/* Stress Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What is your typical stress level?
        </label>
        <div className="space-y-2">
          <input
            type="range"
            name="stressLevel"
            min="1"
            max="10"
            value={formData.stressLevel}
            onChange={handleChange}
            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
            <span>Very Low (1)</span>
            <span className="font-bold text-brown-500">{formData.stressLevel}</span>
            <span>Very High (10)</span>
          </div>
        </div>
      </div>

      {/* Stress Sources */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What are your main sources of stress?
        </label>
        <div className="flex flex-wrap gap-2">
          {STRESS_SOURCES.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => handleArrayToggle("stressSources", source)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.stressSources.includes(source)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What is your current activity level (outside of planned workouts)?
        </label>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, activityLevel: level.value }))}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                formData.activityLevel === level.value
                  ? "bg-brown-500 border-brown-500 text-white"
                  : "bg-card border-border hover:border-brown-500"
              }`}
            >
              <span className={`font-medium ${formData.activityLevel === level.value ? "text-white" : "text-foreground"}`}>
                {level.label}
              </span>
              <span className={`text-sm ml-2 ${formData.activityLevel === level.value ? "text-brown-100" : "text-stone-500 dark:text-stone-400"}`}>
                - {level.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Steps */}
      <div>
        <label htmlFor="dailySteps" className="block text-sm font-medium text-foreground mb-1">
          Approximate daily steps (if you track)
        </label>
        <input
          id="dailySteps"
          name="dailySteps"
          type="number"
          value={formData.dailySteps || ""}
          onChange={handleChange}
          placeholder="e.g., 5000"
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Work Type */}
      <div>
        <label htmlFor="workType" className="block text-sm font-medium text-foreground mb-1">
          What type of work do you do?
        </label>
        <select
          id="workType"
          name="workType"
          value={formData.workType}
          onChange={handleChange}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {WORK_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Screen Time */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Daily screen time (hours)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="screenTimeHours"
            min="1"
            max="16"
            value={formData.screenTimeHours}
            onChange={handleChange}
            className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <span className="text-lg font-bold text-brown-500 w-16 text-center">
            {formData.screenTimeHours}h
          </span>
        </div>
      </div>
    </form>
  );
}
