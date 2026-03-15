"use client";

import { useState } from "react";
import type { AssessmentData, DietData } from "@/types/onboarding";

interface DietFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const DIET_PREFERENCES = [
  { value: "vegetarian", label: "Vegetarian", description: "No meat, fish, or eggs" },
  { value: "eggetarian", label: "Eggetarian", description: "Vegetarian + eggs" },
  { value: "non_vegetarian", label: "Non-Vegetarian", description: "All foods including meat" },
  { value: "vegan", label: "Vegan", description: "No animal products" },
  { value: "other", label: "Other", description: "Different dietary pattern" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely (1-2 times/month)" },
  { value: "occasionally", label: "Occasionally (1-2 times/week)" },
  { value: "frequently", label: "Frequently (3-5 times/week)" },
  { value: "daily", label: "Daily" },
] as const;

const SMOKING_OPTIONS = [
  { value: "never", label: "Never smoked" },
  { value: "former", label: "Former smoker" },
  { value: "current", label: "Current smoker" },
] as const;

export default function DietForm({ data, onSave, onNext }: DietFormProps) {
  const initialData = data.diet || {
    dietPreference: "non_vegetarian" as const,
    mealsPerDay: 3,
    mealTimings: [],
    eatsOutFrequency: "occasionally" as const,
    cookingFrequency: "occasionally" as const,
    waterIntakeLiters: 2,
    alcoholFrequency: "never" as const,
    smokingStatus: "never" as const,
    caffeineCupsPerDay: 2,
    snackingHabits: "",
  };

  const [formData, setFormData] = useState<DietData>(initialData);
  const [mealTimeInput, setMealTimeInput] = useState("");
  const [otherDiet, setOtherDiet] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const addMealTime = () => {
    if (mealTimeInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        mealTimings: [...prev.mealTimings, mealTimeInput.trim()],
      }));
      setMealTimeInput("");
    }
  };

  const removeMealTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mealTimings: prev.mealTimings.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.dietPreference === "other" && !otherDiet.trim()) {
      newErrors.dietPreference = "Please specify your diet preference";
    }
    if (formData.mealTimings.length === 0) {
      newErrors.mealTimings = "Please add at least one meal timing";
    }
    if (!formData.snackingHabits?.trim()) {
      newErrors.snackingHabits = "Please describe your snacking habits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const finalData = {
        ...formData,
        dietPreference: formData.dietPreference === "other" && otherDiet.trim()
          ? `other: ${otherDiet.trim()}`
          : formData.dietPreference,
      };
      onSave("diet", finalData);
      onNext();
    }
  };

  return (
    <form id="form-diet" onSubmit={handleSubmit} className="space-y-6">
      {/* Diet Preference */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What is your diet preference?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {DIET_PREFERENCES.map((pref) => (
            <button
              key={pref.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, dietPreference: pref.value }))}
              className={`p-4 rounded-lg border text-left transition-colors ${
                formData.dietPreference === pref.value
                  ? "bg-brown-500 border-brown-500 text-white"
                  : "bg-card border-border hover:border-brown-500"
              }`}
            >
              <div className={`font-medium ${formData.dietPreference === pref.value ? "text-white" : "text-foreground"}`}>
                {pref.label}
              </div>
              <div className={`text-sm mt-1 ${formData.dietPreference === pref.value ? "text-brown-100" : "text-stone-500 dark:text-stone-400"}`}>
                {pref.description}
              </div>
            </button>
          ))}
        </div>
        {formData.dietPreference === "other" && (
          <input
            type="text"
            value={otherDiet}
            onChange={(e) => setOtherDiet(e.target.value)}
            placeholder="Please specify your diet preference..."
            className={`mt-3 w-full px-4 py-2.5 rounded-lg border ${
              errors.dietPreference ? "border-red-500" : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        )}
        {errors.dietPreference && (
          <p className="mt-2 text-sm text-red-500">{errors.dietPreference}</p>
        )}
      </div>

      {/* Meals Per Day */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How many meals do you typically eat per day?
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="mealsPerDay"
            min="2"
            max="6"
            value={formData.mealsPerDay}
            onChange={handleChange}
            className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <span className="text-lg font-bold text-brown-500 w-16 text-center">
            {formData.mealsPerDay}
          </span>
        </div>
      </div>

      {/* Meal Timings */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Typical meal timings
        </label>
        <div className="flex gap-2">
          <input
            type="time"
            value={mealTimeInput}
            onChange={(e) => setMealTimeInput(e.target.value)}
            className={`px-4 py-2.5 rounded-lg border ${
              errors.mealTimings && formData.mealTimings.length === 0 ? "border-red-500" : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          <button
            type="button"
            onClick={addMealTime}
            className="px-4 py-2.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-foreground hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            Add
          </button>
        </div>
        {formData.mealTimings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.mealTimings.map((time, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-foreground text-sm"
              >
                {time}
                <button type="button" onClick={() => removeMealTime(index)} className="hover:text-red-500">
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.mealTimings && (
          <p className="mt-1 text-sm text-red-500">{errors.mealTimings}</p>
        )}
      </div>

      {/* Eating Out */}
      <div>
        <label htmlFor="eatsOutFrequency" className="block text-sm font-medium text-foreground mb-1">
          How often do you eat out or order food?
        </label>
        <select
          id="eatsOutFrequency"
          name="eatsOutFrequency"
          value={formData.eatsOutFrequency}
          onChange={handleChange}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Cooking */}
      <div>
        <label htmlFor="cookingFrequency" className="block text-sm font-medium text-foreground mb-1">
          How often do you cook your own meals?
        </label>
        <select
          id="cookingFrequency"
          name="cookingFrequency"
          value={formData.cookingFrequency}
          onChange={handleChange}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Water Intake */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Daily water intake (liters)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="waterIntakeLiters"
            min="0.5"
            max="5"
            step="0.5"
            value={formData.waterIntakeLiters}
            onChange={handleChange}
            className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <span className="text-lg font-bold text-brown-500 w-16 text-center">
            {formData.waterIntakeLiters}L
          </span>
        </div>
      </div>

      {/* Alcohol */}
      <div>
        <label htmlFor="alcoholFrequency" className="block text-sm font-medium text-foreground mb-1">
          Alcohol consumption
        </label>
        <select
          id="alcoholFrequency"
          name="alcoholFrequency"
          value={formData.alcoholFrequency}
          onChange={handleChange}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Smoking */}
      <div>
        <label htmlFor="smokingStatus" className="block text-sm font-medium text-foreground mb-1">
          Smoking status
        </label>
        <select
          id="smokingStatus"
          name="smokingStatus"
          value={formData.smokingStatus}
          onChange={handleChange}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SMOKING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Caffeine */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Cups of tea/coffee per day
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="caffeineCupsPerDay"
            min="0"
            max="10"
            value={formData.caffeineCupsPerDay}
            onChange={handleChange}
            className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <span className="text-lg font-bold text-brown-500 w-16 text-center">
            {formData.caffeineCupsPerDay}
          </span>
        </div>
      </div>

      {/* Snacking Habits */}
      <div>
        <label htmlFor="snackingHabits" className="block text-sm font-medium text-foreground mb-1">
          Describe your snacking habits
        </label>
        <textarea
          id="snackingHabits"
          name="snackingHabits"
          value={formData.snackingHabits || ""}
          onChange={handleChange}
          rows={3}
          placeholder="e.g., I snack a lot in the evening, usually chips or biscuits..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.snackingHabits ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.snackingHabits && (
          <p className="mt-1 text-sm text-red-500">{errors.snackingHabits}</p>
        )}
      </div>
    </form>
  );
}
