"use client";

import { useState } from "react";
import type { AssessmentData, FoodPreferencesData } from "@/types/onboarding";

interface FoodPreferencesFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const COMMON_FOODS = [
  "Rice", "Roti/Chapati", "Oats", "Quinoa", "Bread",
  "Chicken", "Fish", "Eggs", "Paneer", "Tofu", "Dal/Lentils",
  "Vegetables", "Salads", "Fruits", "Nuts", "Seeds",
  "Milk", "Curd/Yogurt", "Cheese", "Whey Protein",
];

const COMMON_ALLERGIES = [
  "Nuts", "Peanuts", "Dairy", "Eggs", "Shellfish",
  "Gluten", "Soy", "Sesame", "None",
];

const CUISINES = [
  "North Indian", "South Indian", "Chinese", "Italian",
  "Mediterranean", "Mexican", "Thai", "Japanese",
  "Continental", "American",
];

const SPICE_LEVELS = [
  { value: "none", label: "No Spice" },
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "hot", label: "Hot" },
  { value: "very_hot", label: "Very Hot" },
] as const;

export default function FoodPreferencesForm({ data, onSave, onNext }: FoodPreferencesFormProps) {
  const initialData = data.foodPreferences || {
    likedFoods: [],
    dislikedFoods: [],
    foodAllergies: [],
    foodIntolerances: [],
    religiousRestrictions: "",
    cuisinePreferences: [],
    spiceToleranceLevel: "medium" as const,
  };

  const [formData, setFormData] = useState<FoodPreferencesData>(initialData);
  const [intoleranceInput, setIntoleranceInput] = useState("");

  const handleArrayToggle = (field: keyof FoodPreferencesData, value: string) => {
    setFormData((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addIntolerance = () => {
    if (intoleranceInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        foodIntolerances: [...prev.foodIntolerances, intoleranceInput.trim()],
      }));
      setIntoleranceInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave("foodPreferences", formData);
    onNext();
  };

  return (
    <form id="form-food_preferences" onSubmit={handleSubmit} className="space-y-6">
      {/* Liked Foods */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Foods you enjoy eating (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_FOODS.map((food) => (
            <button
              key={food}
              type="button"
              onClick={() => handleArrayToggle("likedFoods", food)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.likedFoods.includes(food)
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-green-300"
              }`}
            >
              {food}
            </button>
          ))}
        </div>
      </div>

      {/* Disliked Foods */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Foods you dislike or avoid (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_FOODS.map((food) => (
            <button
              key={food}
              type="button"
              onClick={() => handleArrayToggle("dislikedFoods", food)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.dislikedFoods.includes(food)
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-red-300"
              }`}
            >
              {food}
            </button>
          ))}
        </div>
      </div>

      {/* Food Allergies */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Food allergies (severe reactions)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map((allergy) => (
            <button
              key={allergy}
              type="button"
              onClick={() => handleArrayToggle("foodAllergies", allergy)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.foodAllergies.includes(allergy)
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-red-300"
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      {/* Food Intolerances */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Food intolerances (cause discomfort but not severe)
        </label>
        <div className="flex gap-2">
          <input
            value={intoleranceInput}
            onChange={(e) => setIntoleranceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIntolerance())}
            placeholder="e.g., Lactose"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addIntolerance}
            className="px-4 py-2.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-foreground hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            Add
          </button>
        </div>
        {formData.foodIntolerances.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.foodIntolerances.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    foodIntolerances: prev.foodIntolerances.filter((_, i) => i !== index),
                  }))}
                  className="hover:text-yellow-900"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Religious Restrictions */}
      <div>
        <label htmlFor="religiousRestrictions" className="block text-sm font-medium text-foreground mb-1">
          Any religious or cultural food restrictions?
        </label>
        <input
          id="religiousRestrictions"
          name="religiousRestrictions"
          type="text"
          value={formData.religiousRestrictions || ""}
          onChange={handleChange}
          placeholder="e.g., Halal only, No beef, Jain diet"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Cuisine Preferences */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Preferred cuisines
        </label>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              onClick={() => handleArrayToggle("cuisinePreferences", cuisine)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.cuisinePreferences.includes(cuisine)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Spice Tolerance */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Spice tolerance level
        </label>
        <div className="flex flex-wrap gap-2">
          {SPICE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, spiceToleranceLevel: level.value }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.spiceToleranceLevel === level.value
                  ? "bg-brown-500 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
