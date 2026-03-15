"use client";

import { useState } from "react";
import type { AssessmentData, SkinHairData } from "@/types/onboarding";

interface SkinHairFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const SKIN_TYPES = [
  { value: "dry", label: "Dry", description: "Tight, flaky, rough texture" },
  { value: "oily", label: "Oily", description: "Shiny, enlarged pores" },
  { value: "combination", label: "Combination", description: "Oily T-zone, dry cheeks" },
  { value: "normal", label: "Normal", description: "Balanced, minimal issues" },
] as const;

const SKIN_CONCERNS = [
  "Acne", "Dark circles", "Pigmentation", "Dullness",
  "Fine lines", "Redness", "Sensitivity", "Large pores",
  "Dryness", "Oiliness", "None",
];

const HAIR_CONCERNS = [
  "Hair fall", "Dandruff", "Dry/Brittle hair", "Oily scalp",
  "Premature greying", "Thinning", "Slow growth", "Split ends",
  "Frizzy hair", "None",
];

const NAIL_CONCERNS = [
  "Brittle nails", "Ridges", "Discoloration", "Slow growth",
  "Peeling", "None",
];

const RECOVERY_ISSUES = [
  "Slow muscle recovery", "Frequent muscle soreness",
  "Joint pain", "Slow wound healing",
  "Frequent fatigue", "None",
];

const DIGESTIVE_ISSUES = [
  "Bloating", "Gas", "Constipation", "Acid reflux",
  "IBS", "Food sensitivities", "Nausea", "None",
];

export default function SkinHairForm({ data, onSave, onNext }: SkinHairFormProps) {
  const initialData = data.skinHair || {
    skinType: "normal" as const,
    skinConcerns: [],
    hairConcerns: [],
    nailConcerns: [],
    recoveryIssues: [],
    digestiveIssues: [],
  };

  const [formData, setFormData] = useState<SkinHairData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleArrayToggle = (field: keyof SkinHairData, value: string) => {
    setFormData((prev) => {
      const arr = prev[field] as string[];

      // If selecting "None", clear all other selections
      if (value === "None") {
        return {
          ...prev,
          [field]: arr.includes("None") ? [] : ["None"],
        };
      }

      // If selecting any other option, remove "None" if present
      const filteredArr = arr.filter((v) => v !== "None");
      return {
        ...prev,
        [field]: filteredArr.includes(value)
          ? filteredArr.filter((v) => v !== value)
          : [...filteredArr, value],
      };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.skinConcerns.length === 0) {
      newErrors.skinConcerns = "Please select your skin concerns (or 'None')";
    }
    if (formData.hairConcerns.length === 0) {
      newErrors.hairConcerns = "Please select your hair concerns (or 'None')";
    }
    if (formData.nailConcerns.length === 0) {
      newErrors.nailConcerns = "Please select your nail concerns (or 'None')";
    }
    if (formData.recoveryIssues.length === 0) {
      newErrors.recoveryIssues = "Please select your recovery issues (or 'None')";
    }
    if (formData.digestiveIssues.length === 0) {
      newErrors.digestiveIssues = "Please select your digestive issues (or 'None')";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("skinHair", formData);
      onNext();
    }
  };

  return (
    <form id="form-skin_hair" onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Skin, hair, and recovery often reflect internal health. This helps us identify
          potential nutritional deficiencies and create a more holistic plan.
        </p>
      </div>

      {/* Skin Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What is your skin type?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SKIN_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, skinType: type.value }))}
              className={`p-3 rounded-lg border text-left transition-colors ${
                formData.skinType === type.value
                  ? "bg-brown-500 border-brown-500 text-white"
                  : "bg-card border-border hover:border-brown-500"
              }`}
            >
              <div className={`font-medium ${formData.skinType === type.value ? "text-white" : "text-foreground"}`}>
                {type.label}
              </div>
              <div className={`text-xs mt-1 ${formData.skinType === type.value ? "text-brown-100" : "text-stone-500 dark:text-stone-400"}`}>
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Skin Concerns */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Any skin concerns?
        </label>
        <div className="flex flex-wrap gap-2">
          {SKIN_CONCERNS.map((concern) => (
            <button
              key={concern}
              type="button"
              onClick={() => handleArrayToggle("skinConcerns", concern)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.skinConcerns.includes(concern)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
        {errors.skinConcerns && (
          <p className="mt-2 text-sm text-red-500">{errors.skinConcerns}</p>
        )}
      </div>

      {/* Hair Concerns */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Any hair concerns?
        </label>
        <div className="flex flex-wrap gap-2">
          {HAIR_CONCERNS.map((concern) => (
            <button
              key={concern}
              type="button"
              onClick={() => handleArrayToggle("hairConcerns", concern)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.hairConcerns.includes(concern)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
        {errors.hairConcerns && (
          <p className="mt-2 text-sm text-red-500">{errors.hairConcerns}</p>
        )}
      </div>

      {/* Nail Concerns */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Any nail concerns?
        </label>
        <div className="flex flex-wrap gap-2">
          {NAIL_CONCERNS.map((concern) => (
            <button
              key={concern}
              type="button"
              onClick={() => handleArrayToggle("nailConcerns", concern)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.nailConcerns.includes(concern)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
        {errors.nailConcerns && (
          <p className="mt-2 text-sm text-red-500">{errors.nailConcerns}</p>
        )}
      </div>

      {/* Recovery Issues */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Any recovery issues?
        </label>
        <div className="flex flex-wrap gap-2">
          {RECOVERY_ISSUES.map((issue) => (
            <button
              key={issue}
              type="button"
              onClick={() => handleArrayToggle("recoveryIssues", issue)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.recoveryIssues.includes(issue)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {issue}
            </button>
          ))}
        </div>
        {errors.recoveryIssues && (
          <p className="mt-2 text-sm text-red-500">{errors.recoveryIssues}</p>
        )}
      </div>

      {/* Digestive Issues */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Any digestive issues?
        </label>
        <div className="flex flex-wrap gap-2">
          {DIGESTIVE_ISSUES.map((issue) => (
            <button
              key={issue}
              type="button"
              onClick={() => handleArrayToggle("digestiveIssues", issue)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.digestiveIssues.includes(issue)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {issue}
            </button>
          ))}
        </div>
        {errors.digestiveIssues && (
          <p className="mt-2 text-sm text-red-500">{errors.digestiveIssues}</p>
        )}
      </div>
    </form>
  );
}
