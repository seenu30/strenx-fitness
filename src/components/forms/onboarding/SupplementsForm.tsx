"use client";

import { useState } from "react";
import type { AssessmentData, SupplementsData } from "@/types/onboarding";
import { Plus, X } from "lucide-react";

interface SupplementsFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const COMMON_SUPPLEMENTS = [
  "Whey Protein", "Creatine", "BCAA", "Multivitamin",
  "Vitamin D", "Vitamin B12", "Omega-3/Fish Oil", "Iron",
  "Calcium", "Magnesium", "Zinc", "Pre-workout",
  "Glutamine", "Collagen", "Probiotics", "Ashwagandha",
];

export default function SupplementsForm({ data, onSave, onNext }: SupplementsFormProps) {
  const initialData = data.supplements || {
    currentSupplements: [],
    pastSupplements: [],
    willingToTakeSupplements: true,
    supplementBudget: "",
  };

  const [formData, setFormData] = useState<SupplementsData>(initialData);
  const [newSupplement, setNewSupplement] = useState({ name: "", dosage: "", frequency: "" });
  const [newPastSupplement, setNewPastSupplement] = useState({ name: "", duration: "", reason_stopped: "" });

  const addCurrentSupplement = () => {
    if (newSupplement.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        currentSupplements: [...prev.currentSupplements, { ...newSupplement }],
      }));
      setNewSupplement({ name: "", dosage: "", frequency: "" });
    }
  };

  const removeCurrentSupplement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      currentSupplements: prev.currentSupplements.filter((_, i) => i !== index),
    }));
  };

  const addPastSupplement = () => {
    if (newPastSupplement.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        pastSupplements: [...prev.pastSupplements, { ...newPastSupplement }],
      }));
      setNewPastSupplement({ name: "", duration: "", reason_stopped: "" });
    }
  };

  const removePastSupplement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pastSupplements: prev.pastSupplements.filter((_, i) => i !== index),
    }));
  };

  const quickAddSupplement = (name: string) => {
    if (!formData.currentSupplements.some((s) => s.name === name)) {
      setFormData((prev) => ({
        ...prev,
        currentSupplements: [...prev.currentSupplements, { name, dosage: "", frequency: "daily" }],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave("supplements", formData);
    onNext();
  };

  return (
    <form id="form-supplements" onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This section is optional. Supplements are not required for a successful transformation,
          but knowing what you&apos;re taking helps us create a better plan.
        </p>
      </div>

      {/* Quick Add */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Quick add (click to add)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_SUPPLEMENTS.map((supp) => (
            <button
              key={supp}
              type="button"
              onClick={() => quickAddSupplement(supp)}
              disabled={formData.currentSupplements.some((s) => s.name === supp)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.currentSupplements.some((s) => s.name === supp)
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-amber-300"
              }`}
            >
              {supp}
            </button>
          ))}
        </div>
      </div>

      {/* Current Supplements */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Current Supplements
        </label>

        {formData.currentSupplements.length > 0 && (
          <div className="space-y-2">
            {formData.currentSupplements.map((supp, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-stone-800 dark:text-stone-200">{supp.name}</span>
                  {supp.dosage && (
                    <span className="text-sm text-stone-500 dark:text-stone-400 ml-2">
                      {supp.dosage}
                    </span>
                  )}
                  {supp.frequency && (
                    <span className="text-sm text-stone-500 dark:text-stone-400 ml-2">
                      ({supp.frequency})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeCurrentSupplement(index)}
                  className="p-1 text-stone-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={newSupplement.name}
            onChange={(e) => setNewSupplement((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Supplement name"
            className="sm:col-span-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
          />
          <input
            value={newSupplement.dosage}
            onChange={(e) => setNewSupplement((prev) => ({ ...prev, dosage: e.target.value }))}
            placeholder="Dosage"
            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
          />
          <button
            type="button"
            onClick={addCurrentSupplement}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Past Supplements */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Past Supplements (that you&apos;ve stopped taking)
        </label>

        {formData.pastSupplements.length > 0 && (
          <div className="space-y-2">
            {formData.pastSupplements.map((supp, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-stone-800 dark:text-stone-200">{supp.name}</span>
                  {supp.duration && (
                    <span className="text-sm text-stone-500 dark:text-stone-400 ml-2">
                      for {supp.duration}
                    </span>
                  )}
                  {supp.reason_stopped && (
                    <span className="text-sm text-stone-500 dark:text-stone-400 block">
                      Stopped because: {supp.reason_stopped}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePastSupplement(index)}
                  className="p-1 text-stone-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={newPastSupplement.name}
            onChange={(e) => setNewPastSupplement((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Supplement name"
            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
          />
          <input
            value={newPastSupplement.duration}
            onChange={(e) => setNewPastSupplement((prev) => ({ ...prev, duration: e.target.value }))}
            placeholder="Duration (e.g., 3 months)"
            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
          />
          <input
            value={newPastSupplement.reason_stopped}
            onChange={(e) => setNewPastSupplement((prev) => ({ ...prev, reason_stopped: e.target.value }))}
            placeholder="Why stopped?"
            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
          />
          <button
            type="button"
            onClick={addPastSupplement}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm hover:bg-stone-300"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Willingness */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="willingToTakeSupplements"
          checked={formData.willingToTakeSupplements}
          onChange={(e) => setFormData((prev) => ({ ...prev, willingToTakeSupplements: e.target.checked }))}
          className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="willingToTakeSupplements" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          I&apos;m open to taking supplements if recommended
        </label>
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="supplementBudget" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Monthly budget for supplements (optional)
        </label>
        <input
          id="supplementBudget"
          type="text"
          value={formData.supplementBudget || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, supplementBudget: e.target.value }))}
          placeholder="e.g., Rs. 2000-3000"
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
    </form>
  );
}
