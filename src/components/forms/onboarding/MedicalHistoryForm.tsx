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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.otherConditions?.trim()) {
      newErrors.otherConditions = "Please describe any other medical conditions (or write 'None')";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("medicalHistory", formData);
      onNext();
    }
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
        <div className="p-4 rounded-lg bg-brown-50 dark:bg-brown-900/20 border border-brown-200 dark:border-brown-700">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-brown-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-brown-700 dark:text-brown-200">
                Medical Clearance May Be Required
              </p>
              <p className="text-sm text-brown-600 dark:text-brown-300 mt-1">
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
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="hasHeartCondition" className="text-sm font-medium text-foreground">
            I have a heart condition
          </label>
        </div>
        {formData.hasHeartCondition && (
          <input
            name="heartConditionDetails"
            value={formData.heartConditionDetails || ""}
            onChange={handleChange}
            placeholder="Please describe your heart condition"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="hasDiabetes" className="text-sm font-medium text-foreground">
            I have diabetes
          </label>
        </div>
        {formData.hasDiabetes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              name="diabetesType"
              value={formData.diabetesType || ""}
              onChange={handleChange}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
              />
              <label htmlFor="diabetesControlled" className="text-sm text-muted-foreground">
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
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="hasHypertension" className="text-sm font-medium text-foreground">
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
              className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
            />
            <label htmlFor="hypertensionControlled" className="text-sm text-muted-foreground">
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
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="hasThyroidCondition" className="text-sm font-medium text-foreground">
            I have a thyroid condition
          </label>
        </div>
        {formData.hasThyroidCondition && (
          <select
            name="thyroidType"
            value={formData.thyroidType || ""}
            onChange={handleChange}
            className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
          className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
        />
        <label htmlFor="hasPCOS" className="text-sm font-medium text-foreground">
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
          className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
        />
        <label htmlFor="hasEatingDisorderHistory" className="text-sm font-medium text-foreground">
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
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="recentSurgery" className="text-sm font-medium text-foreground">
            I&apos;ve had surgery in the last 6 months
          </label>
        </div>
        {formData.recentSurgery && (
          <input
            name="surgeryDetails"
            value={formData.surgeryDetails || ""}
            onChange={handleChange}
            placeholder="What surgery and when?"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="isPregnant" className="text-sm font-medium text-foreground">
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
            className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
      </div>

      {/* Current Medications */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Current Medications
        </label>
        <div className="flex gap-2">
          <input
            value={medicationInput}
            onChange={(e) => setMedicationInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMedication())}
            placeholder="Enter medication name"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={formData.currentMedications.includes("None")}
          />
          <button
            type="button"
            onClick={addMedication}
            disabled={formData.currentMedications.includes("None")}
            className="px-4 py-2.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-foreground hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({
              ...prev,
              currentMedications: prev.currentMedications.includes("None") ? [] : ["None"]
            }))}
            className={`px-4 py-2.5 rounded-lg transition-colors ${
              formData.currentMedications.includes("None")
                ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
            }`}
          >
            None
          </button>
        </div>
        {formData.currentMedications.length > 0 && !formData.currentMedications.includes("None") && (
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
        <label className="block text-sm font-medium text-foreground">
          Allergies (medications, foods, environmental)
        </label>
        <div className="flex gap-2">
          <input
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
            placeholder="Enter allergy"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={formData.allergies.includes("None")}
          />
          <button
            type="button"
            onClick={addAllergy}
            disabled={formData.allergies.includes("None")}
            className="px-4 py-2.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-foreground hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({
              ...prev,
              allergies: prev.allergies.includes("None") ? [] : ["None"]
            }))}
            className={`px-4 py-2.5 rounded-lg transition-colors ${
              formData.allergies.includes("None")
                ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
            }`}
          >
            None
          </button>
        </div>
        {formData.allergies.length > 0 && !formData.allergies.includes("None") && (
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
          className="block text-sm font-medium text-foreground mb-1"
        >
          Any other medical conditions we should know about?
        </label>
        <textarea
          id="otherConditions"
          name="otherConditions"
          value={formData.otherConditions || ""}
          onChange={handleChange}
          rows={3}
          placeholder="Describe any other conditions (or write 'None')..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.otherConditions ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.otherConditions && (
          <p className="mt-1 text-sm text-red-500">{errors.otherConditions}</p>
        )}
      </div>
    </form>
  );
}
