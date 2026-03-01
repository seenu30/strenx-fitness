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

  const handleArrayToggle = (field: keyof SkinHairData, value: string) => {
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
    onSave("skinHair", formData);
    onNext();
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
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 hover:border-amber-500"
              }`}
            >
              <div className={`font-medium ${formData.skinType === type.value ? "text-white" : "text-stone-800 dark:text-stone-200"}`}>
                {type.label}
              </div>
              <div className={`text-xs mt-1 ${formData.skinType === type.value ? "text-amber-100" : "text-stone-500 dark:text-stone-400"}`}>
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Skin Concerns */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      </div>

      {/* Hair Concerns */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      </div>

      {/* Nail Concerns */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      </div>

      {/* Recovery Issues */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {issue}
            </button>
          ))}
        </div>
      </div>

      {/* Digestive Issues */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {issue}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
