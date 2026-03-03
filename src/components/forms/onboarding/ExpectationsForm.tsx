"use client";

import { useState } from "react";
import type { AssessmentData, ExpectationsData } from "@/types/onboarding";

interface ExpectationsFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const COMMUNICATION_OPTIONS = [
  { value: "app_only", label: "App Only", description: "Check-ins and messages through the app" },
  { value: "whatsapp", label: "WhatsApp", description: "Quick messages via WhatsApp" },
  { value: "calls", label: "Phone Calls", description: "Occasional phone calls for check-ins" },
  { value: "any", label: "Any Method", description: "Open to all communication methods" },
] as const;

export default function ExpectationsForm({ data, onSave, onNext }: ExpectationsFormProps) {
  const initialData = data.expectations || {
    expectations: "",
    previousChallenges: "",
    whatWorkedBefore: "",
    whatDidntWork: "",
    willingnessToTrack: 8,
    preferredCommunication: "app_only" as const,
    questionsForCoach: "",
  };

  const [formData, setFormData] = useState<ExpectationsData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.expectations.trim()) {
      newErrors.expectations = "Please share your expectations";
    }
    if (!formData.previousChallenges.trim()) {
      newErrors.previousChallenges = "Please share your previous challenges";
    }
    if (!formData.whatWorkedBefore?.trim()) {
      newErrors.whatWorkedBefore = "Please share what has worked for you before";
    }
    if (!formData.whatDidntWork?.trim()) {
      newErrors.whatDidntWork = "Please share what hasn't worked for you";
    }
    if (!formData.questionsForCoach?.trim()) {
      newErrors.questionsForCoach = "Please share any questions for your coach";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("expectations", formData);
      onNext();
    }
  };

  return (
    <form id="form-expectations" onSubmit={handleSubmit} className="space-y-6">
      {/* Expectations */}
      <div>
        <label
          htmlFor="expectations"
          className="block text-sm font-medium text-foreground mb-1"
        >
          What do you expect from this program? *
        </label>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
          Be specific about what results you&apos;re hoping for and what support you need.
        </p>
        <textarea
          id="expectations"
          name="expectations"
          value={formData.expectations}
          onChange={handleChange}
          rows={4}
          placeholder="I expect to lose 10kg in 3 months, get stronger, and learn how to eat healthy sustainably..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.expectations ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.expectations && (
          <p className="mt-1 text-sm text-red-500">{errors.expectations}</p>
        )}
      </div>

      {/* Previous Challenges */}
      <div>
        <label
          htmlFor="previousChallenges"
          className="block text-sm font-medium text-foreground mb-1"
        >
          What challenges have you faced in achieving your fitness goals before? *
        </label>
        <textarea
          id="previousChallenges"
          name="previousChallenges"
          value={formData.previousChallenges}
          onChange={handleChange}
          rows={3}
          placeholder="I struggle with consistency, emotional eating, lack of time..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.previousChallenges ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.previousChallenges && (
          <p className="mt-1 text-sm text-red-500">{errors.previousChallenges}</p>
        )}
      </div>

      {/* What Worked Before */}
      <div>
        <label
          htmlFor="whatWorkedBefore"
          className="block text-sm font-medium text-foreground mb-1"
        >
          What has worked for you in the past? *
        </label>
        <textarea
          id="whatWorkedBefore"
          name="whatWorkedBefore"
          value={formData.whatWorkedBefore || ""}
          onChange={handleChange}
          rows={2}
          placeholder="Meal prepping on weekends, morning workouts, having accountability..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.whatWorkedBefore ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.whatWorkedBefore && (
          <p className="mt-1 text-sm text-red-500">{errors.whatWorkedBefore}</p>
        )}
      </div>

      {/* What Didn't Work */}
      <div>
        <label
          htmlFor="whatDidntWork"
          className="block text-sm font-medium text-foreground mb-1"
        >
          What hasn&apos;t worked for you? *
        </label>
        <textarea
          id="whatDidntWork"
          name="whatDidntWork"
          value={formData.whatDidntWork || ""}
          onChange={handleChange}
          rows={2}
          placeholder="Strict diets, counting every calorie, exercising late at night..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.whatDidntWork ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.whatDidntWork && (
          <p className="mt-1 text-sm text-red-500">{errors.whatDidntWork}</p>
        )}
      </div>

      {/* Willingness to Track */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How willing are you to track your meals and workouts daily? *
        </label>
        <div className="space-y-2">
          <input
            type="range"
            name="willingnessToTrack"
            min="1"
            max="10"
            value={formData.willingnessToTrack}
            onChange={handleChange}
            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
          />
          <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
            <span>Not at all (1)</span>
            <span className="font-bold text-brown-500">{formData.willingnessToTrack}</span>
            <span>Very willing (10)</span>
          </div>
        </div>
      </div>

      {/* Preferred Communication */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Preferred communication method *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {COMMUNICATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, preferredCommunication: option.value }))}
              className={`p-3 rounded-lg border text-left transition-colors ${
                formData.preferredCommunication === option.value
                  ? "bg-brown-500 border-brown-500 text-white"
                  : "bg-card border-border hover:border-brown-500"
              }`}
            >
              <div className={`font-medium ${formData.preferredCommunication === option.value ? "text-white" : "text-foreground"}`}>
                {option.label}
              </div>
              <div className={`text-xs mt-1 ${formData.preferredCommunication === option.value ? "text-brown-100" : "text-stone-500 dark:text-stone-400"}`}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Questions for Coach */}
      <div>
        <label
          htmlFor="questionsForCoach"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Any questions for your coach? *
        </label>
        <textarea
          id="questionsForCoach"
          name="questionsForCoach"
          value={formData.questionsForCoach || ""}
          onChange={handleChange}
          rows={3}
          placeholder="Anything you'd like to know or clarify before we begin..."
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.questionsForCoach ? "border-red-500" : "border-border"
          } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
        />
        {errors.questionsForCoach && (
          <p className="mt-1 text-sm text-red-500">{errors.questionsForCoach}</p>
        )}
      </div>
    </form>
  );
}
