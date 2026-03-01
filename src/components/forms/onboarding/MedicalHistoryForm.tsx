"use client";

import { useState } from "react";
import type { AssessmentData, MedicalHistoryData } from "@/types/onboarding";
import { AlertTriangle } from "lucide-react";

interface MedicalHistoryFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export default function MedicalHistoryForm({
  data,
  onSave,
  onNext,
}: MedicalHistoryFormProps) {
  const initialData = data.medicalHistory || {
    hasHeartCondition: false,
    heartConditionDetails: "",
    hasDiabetes: false,
    diabetesType: "",
    diabetesControlled: false,
    hasHypertension: false,
    hypertensionControlled: false,
    hasThyroidCondition: false,
    thyroidType: "",
    hasPCOS: false,
    hasEatingDisorderHistory: false,
    recentSurgery: false,
    surgeryDetails: "",
    isPregnant: false,
    pregnancyWeeks: undefined,
    currentMedications: [],
    allergies: [],
    otherConditions: "",
  };

  const [formData, setFormData] = useState<MedicalHistoryData>(initialData);
  const [medicationInput, setMedicationInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");

  const handleCheckboxChange = (name: keyof MedicalHistoryData) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || undefined : value,
    }));
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        currentMedications: [...prev.currentMedications, medicationInput.trim()],
      }));
      setMedicationInput("");
    }
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index),
    }));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()],
      }));
      setAllergyInput("");
    }
  };

  const removeAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave("medicalHistory", formData);
    onNext();
  };

  // Check for critical conditions that need medical clearance
  const hasCriticalCondition =
    formData.hasHeartCondition ||
    formData.recentSurgery ||
    formData.isPregnant ||
    formData.hasEatingDisorderHistory;

  return (
    <form id="form-medical_history" onSubmit={handleSubmit} className="space-y-6">
      {/* Warning for critical conditions */}
      {hasCriticalCondition && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Medical Clearance May Be Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Based on your responses, your coach may request medical clearance
                before designing your program. This is for your safety.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Heart Condition */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasHeartCondition"
            checked={formData.hasHeartCondition}
            onChange={() => handleCheckboxChange("hasHeartCondition")}
            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="hasHeartCondition" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            I have a heart condition
          </label>
        </div>
        {formData.hasHeartCondition && (
          <input
            name="heartConditionDetails"
            value={formData.heartConditionDetails || ""}
            onChange={handleChange}
            placeholder="Please describe your heart condition"
            className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        )}
      </div>

      {/* Diabetes */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasDiabetes"
            checked={formData.hasDiabetes}
            onChange={() => handleCheckboxChange("hasDiabetes")}
            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="hasDiabetes" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            I have diabetes
          </label>
        </div>
        {formData.hasDiabetes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              name="diabetesType"
              value={formData.diabetesType || ""}
              onChange={handleChange}
              className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select type</option>
              <option value="type1">Type 1</option>
              <option value="type2">Type 2</option>
              <option value="prediabetes">Pre-diabetes</option>
              <option value="gestational">Gestational</option>
            </select>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="diabetesControlled"
                checked={formData.diabetesControlled}
                onChange={() => handleCheckboxChange("diabetesControlled")}
                className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="diabetesControlled" className="text-sm text-stone-600 dark:text-stone-400">
                Well controlled with medication
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Hypertension */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasHypertension"
            checked={formData.hasHypertension}
            onChange={() => handleCheckboxChange("hasHypertension")}
            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="hasHypertension" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            I have high blood pressure (hypertension)
          </label>
        </div>
        {formData.hasHypertension && (
          <div className="flex items-center gap-3 ml-8">
            <input
              type="checkbox"
              id="hypertensionControlled"
              checked={formData.hypertensionControlled}
              onChange={() => handleCheckboxChange("hypertensionControlled")}
              className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="hypertensionControlled" className="text-sm text-stone-600 dark:text-stone-400">
              Well controlled with medication
            </label>
          </div>
        )}
      </div>

      {/* Thyroid */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasThyroidCondition"
            checked={formData.hasThyroidCondition}
            onChange={() => handleCheckboxChange("hasThyroidCondition")}
            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="hasThyroidCondition" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            I have a thyroid condition
          </label>
        </div>
        {formData.hasThyroidCondition && (
          <select
            name="thyroidType"
            value={formData.thyroidType || ""}
            onChange={handleChange}
            className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Select type</option>
            <option value="hypothyroid">Hypothyroidism (underactive)</option>
            <option value="hyperthyroid">Hyperthyroidism (overactive)</option>
            <option value="hashimotos">Hashimoto&apos;s</option>
            <option value="graves">Graves&apos; Disease</option>
          </select>
        )}
      </div>

      {/* PCOS */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="hasPCOS"
          checked={formData.hasPCOS}
          onChange={() => handleCheckboxChange("hasPCOS")}
          className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="hasPCOS" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          I have PCOS (Polycystic Ovary Syndrome)
        </label>
      </div>

      {/* Eating Disorder History */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="hasEatingDisorderHistory"
          checked={formData.hasEatingDisorderHistory}
          onChange={() => handleCheckboxChange("hasEatingDisorderHistory")}
          className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="hasEatingDisorderHistory" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          I have a history of eating disorders
        </label>
      </div>

      {/* Recent Surgery */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="recentSurgery"
            checked={formData.recentSurgery}
            onChange={() => handleCheckboxChange("recentSurgery")}
            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="recentSurgery" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            I&apos;ve had surgery in the last 6 months
          </label>
        </div>
        {formData.recentSurgery && (
          <input
            name="surgeryDetails"
            value={formData.surgeryDetails || ""}
            onChange={handleChange}
            placeholder="What surgery and when?"
            className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        )}
      </div>

      {/* Pregnancy */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPregnant"
            checked={formData.isPregnant}
            onChange={() => handleCheckboxChange("isPregnant")}
            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="isPregnant" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            I am currently pregnant
          </label>
        </div>
        {formData.isPregnant && (
          <input
            name="pregnancyWeeks"
            type="number"
            value={formData.pregnancyWeeks || ""}
            onChange={handleChange}
            placeholder="How many weeks?"
            min="1"
            max="42"
            className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        )}
      </div>

      {/* Current Medications */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Current Medications
        </label>
        <div className="flex gap-2">
          <input
            value={medicationInput}
            onChange={(e) => setMedicationInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMedication())}
            placeholder="Enter medication name"
            className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={addMedication}
            className="px-4 py-2.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            Add
          </button>
        </div>
        {formData.currentMedications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.currentMedications.map((med, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm"
              >
                {med}
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="hover:text-blue-900 dark:hover:text-blue-200"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Allergies (medications, foods, environmental)
        </label>
        <div className="flex gap-2">
          <input
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
            placeholder="Enter allergy"
            className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={addAllergy}
            className="px-4 py-2.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            Add
          </button>
        </div>
        {formData.allergies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.allergies.map((allergy, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(index)}
                  className="hover:text-red-900 dark:hover:text-red-200"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Other Conditions */}
      <div>
        <label
          htmlFor="otherConditions"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
        >
          Any other medical conditions we should know about?
        </label>
        <textarea
          id="otherConditions"
          name="otherConditions"
          value={formData.otherConditions || ""}
          onChange={handleChange}
          rows={3}
          placeholder="Describe any other conditions..."
          className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>
    </form>
  );
}
