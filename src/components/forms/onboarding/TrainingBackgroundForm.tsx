"use client";

import { useState } from "react";
import type { AssessmentData, TrainingBackgroundData } from "@/types/onboarding";

interface TrainingBackgroundFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", description: "Less than 1 year of consistent training" },
  { value: "intermediate", label: "Intermediate", description: "1-3 years of consistent training" },
  { value: "advanced", label: "Advanced", description: "3-5 years of consistent training" },
  { value: "professional", label: "Professional", description: "5+ years with competitive experience" },
] as const;

const TRAINING_STYLES = [
  "Weight Training",
  "HIIT",
  "Cardio",
  "CrossFit",
  "Yoga",
  "Pilates",
  "Calisthenics",
  "Sports",
  "Swimming",
  "Running",
  "Martial Arts",
  "Dance",
];

const HOME_EQUIPMENT = [
  "Dumbbells",
  "Resistance Bands",
  "Pull-up Bar",
  "Kettlebells",
  "Barbell",
  "Bench",
  "Treadmill",
  "Stationary Bike",
  "Yoga Mat",
  "None",
];

const COMMON_INJURIES = [
  "Lower back pain",
  "Shoulder injury",
  "Knee problems",
  "Neck pain",
  "Wrist issues",
  "Ankle problems",
  "Hip issues",
  "None",
];

export default function TrainingBackgroundForm({
  data,
  onSave,
  onNext,
}: TrainingBackgroundFormProps) {
  const initialData = data.trainingBackground || {
    experienceLevel: "beginner" as const,
    currentTrainingFrequency: 0,
    currentTrainingStyle: [],
    preferredTrainingStyle: [],
    gymAccess: false,
    homeEquipment: [],
    injuries: [],
    physicalLimitations: "",
  };

  const [formData, setFormData] = useState<TrainingBackgroundData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleArrayToggle = (field: keyof TrainingBackgroundData, value: string) => {
    setFormData((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.experienceLevel) {
      newErrors.experienceLevel = "Please select your experience level";
    }
    if (formData.currentTrainingFrequency < 0 || formData.currentTrainingFrequency > 7) {
      newErrors.currentTrainingFrequency = "Please enter training frequency (0-7 days)";
    }
    if (formData.currentTrainingStyle.length === 0) {
      newErrors.currentTrainingStyle = "Please select at least one current training style";
    }
    if (formData.preferredTrainingStyle.length === 0) {
      newErrors.preferredTrainingStyle = "Please select at least one preferred training style";
    }
    if (formData.homeEquipment.length === 0) {
      newErrors.homeEquipment = "Please select your home equipment (or 'None')";
    }
    if (formData.injuries.length === 0) {
      newErrors.injuries = "Please select any injuries (or 'None')";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("trainingBackground", formData);
      onNext();
    }
  };

  return (
    <form id="form-training_background" onSubmit={handleSubmit} className="space-y-6">
      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What is your training experience level? *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, experienceLevel: level.value }))
              }
              className={`p-4 rounded-lg border text-left transition-colors ${
                formData.experienceLevel === level.value
                  ? "bg-brown-500 border-brown-500 text-white"
                  : "bg-card border-border hover:border-brown-500"
              }`}
            >
              <div className={`font-medium ${
                formData.experienceLevel === level.value
                  ? "text-white"
                  : "text-foreground"
              }`}>
                {level.label}
              </div>
              <div className={`text-sm mt-1 ${
                formData.experienceLevel === level.value
                  ? "text-brown-100"
                  : "text-stone-500 dark:text-stone-400"
              }`}>
                {level.description}
              </div>
            </button>
          ))}
        </div>
        {errors.experienceLevel && (
          <p className="mt-2 text-sm text-red-500">{errors.experienceLevel}</p>
        )}
      </div>

      {/* Training Frequency */}
      <div>
        <label
          htmlFor="currentTrainingFrequency"
          className="block text-sm font-medium text-foreground mb-1"
        >
          How many days per week do you currently train? *
        </label>
        <input
          id="currentTrainingFrequency"
          name="currentTrainingFrequency"
          type="number"
          value={formData.currentTrainingFrequency || ""}
          onChange={handleChange}
          min="0"
          max="7"
          placeholder="0"
          className={`w-full max-w-xs px-4 py-2.5 rounded-lg border ${
            errors.currentTrainingFrequency ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
        />
        {errors.currentTrainingFrequency && (
          <p className="mt-1 text-sm text-red-500">{errors.currentTrainingFrequency}</p>
        )}
      </div>

      {/* Current Training Style */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What type of training do you currently do? *
        </label>
        <div className="flex flex-wrap gap-2">
          {TRAINING_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => handleArrayToggle("currentTrainingStyle", style)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.currentTrainingStyle.includes(style)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
        {errors.currentTrainingStyle && (
          <p className="mt-2 text-sm text-red-500">{errors.currentTrainingStyle}</p>
        )}
      </div>

      {/* Preferred Training Style */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What type of training would you prefer? *
        </label>
        <div className="flex flex-wrap gap-2">
          {TRAINING_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => handleArrayToggle("preferredTrainingStyle", style)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.preferredTrainingStyle.includes(style)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
        {errors.preferredTrainingStyle && (
          <p className="mt-2 text-sm text-red-500">{errors.preferredTrainingStyle}</p>
        )}
      </div>

      {/* Gym Access */}
      <div className="flex items-center gap-3">
        <input
          id="gymAccess"
          name="gymAccess"
          type="checkbox"
          checked={formData.gymAccess}
          onChange={handleChange}
          className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
        />
        <label
          htmlFor="gymAccess"
          className="text-sm font-medium text-foreground"
        >
          I have access to a gym
        </label>
      </div>

      {/* Home Equipment */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What equipment do you have at home? *
        </label>
        <div className="flex flex-wrap gap-2">
          {HOME_EQUIPMENT.map((equipment) => (
            <button
              key={equipment}
              type="button"
              onClick={() => handleArrayToggle("homeEquipment", equipment)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.homeEquipment.includes(equipment)
                  ? "bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 border border-brown-300 dark:border-brown-600"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-brown-300"
              }`}
            >
              {equipment}
            </button>
          ))}
        </div>
        {errors.homeEquipment && (
          <p className="mt-2 text-sm text-red-500">{errors.homeEquipment}</p>
        )}
      </div>

      {/* Injuries */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Do you have any current injuries or pain? *
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_INJURIES.map((injury) => (
            <button
              key={injury}
              type="button"
              onClick={() => handleArrayToggle("injuries", injury)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.injuries.includes(injury)
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-red-300"
              }`}
            >
              {injury}
            </button>
          ))}
        </div>
        {errors.injuries && (
          <p className="mt-2 text-sm text-red-500">{errors.injuries}</p>
        )}
      </div>

      {/* Physical Limitations */}
      <div>
        <label
          htmlFor="physicalLimitations"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Any other physical limitations we should know about?
        </label>
        <textarea
          id="physicalLimitations"
          name="physicalLimitations"
          value={formData.physicalLimitations || ""}
          onChange={handleChange}
          rows={3}
          placeholder="Describe any limitations or concerns..."
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
    </form>
  );
}
