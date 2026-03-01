"use client";

import { useState } from "react";
import type { AssessmentData, PersonalInfoData } from "@/types/onboarding";
import { calculateBMI, getBMICategory } from "@/lib/utils";

interface PersonalInfoFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const MIN_AGE_DATE = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

export default function PersonalInfoForm({
  data,
  onSave,
  onNext,
}: PersonalInfoFormProps) {
  const initialData = data.personalInfo || {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male" as const,
    heightCm: 0,
    weightKg: 0,
    occupation: "",
    city: "",
    phone: "",
  };

  const [formData, setFormData] = useState<PersonalInfoData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const age = Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    if (formData.heightCm < 100 || formData.heightCm > 250) {
      newErrors.heightCm = "Please enter a valid height (100-250 cm)";
    }
    if (formData.weightKg < 30 || formData.weightKg > 300) {
      newErrors.weightKg = "Please enter a valid weight (30-300 kg)";
    }
    if (!formData.occupation.trim()) {
      newErrors.occupation = "Occupation is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("personalInfo", formData);
      onNext();
    }
  };

  // Calculate BMI if height and weight are available
  const bmi =
    formData.heightCm > 0 && formData.weightKg > 0
      ? calculateBMI(formData.heightCm, formData.weightKg)
      : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <form id="form-personal_info" onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-foreground mb-1"
          >
            First Name *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.firstName
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Last Name *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.lastName
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Date of Birth & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Date of Birth *
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            max={MIN_AGE_DATE}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.dateOfBirth
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Gender *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.gender
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
          )}
        </div>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="heightCm"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Height (cm) *
          </label>
          <input
            id="heightCm"
            name="heightCm"
            type="number"
            value={formData.heightCm || ""}
            onChange={handleChange}
            min="100"
            max="250"
            placeholder="e.g., 170"
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.heightCm
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.heightCm && (
            <p className="mt-1 text-sm text-red-500">{errors.heightCm}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="weightKg"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Weight (kg) *
          </label>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            value={formData.weightKg || ""}
            onChange={handleChange}
            min="30"
            max="300"
            step="0.1"
            placeholder="e.g., 70"
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.weightKg
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.weightKg && (
            <p className="mt-1 text-sm text-red-500">{errors.weightKg}</p>
          )}
        </div>
      </div>

      {/* BMI Display */}
      {bmi && (
        <div
          className={`p-4 rounded-lg ${
            bmiCategory === "Normal"
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : bmiCategory === "Underweight" || bmiCategory === "Overweight"
              ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Your BMI
            </span>
            <span
              className={`text-lg font-bold ${
                bmiCategory === "Normal"
                  ? "text-green-700 dark:text-green-400"
                  : bmiCategory === "Underweight" || bmiCategory === "Overweight"
                  ? "text-yellow-700 dark:text-yellow-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {bmi} ({bmiCategory})
            </span>
          </div>
        </div>
      )}

      {/* Occupation & City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="occupation"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Occupation *
          </label>
          <input
            id="occupation"
            name="occupation"
            type="text"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="e.g., Software Engineer"
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.occupation
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.occupation && (
            <p className="mt-1 text-sm text-red-500">{errors.occupation}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-foreground mb-1"
          >
            City *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g., Mumbai"
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.city
                ? "border-red-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city}</p>
          )}
        </div>
      </div>

      {/* Phone (optional) */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Phone Number (optional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone || ""}
          onChange={handleChange}
          placeholder="+91 XXXXX XXXXX"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </form>
  );
}
