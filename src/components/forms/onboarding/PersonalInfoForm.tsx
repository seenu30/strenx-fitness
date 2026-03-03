"use client";

import { useState, useCallback } from "react";
import type { AssessmentData, PersonalInfoData } from "@/types/onboarding";
import { calculateBMI, getBMICategory } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

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

// Validation helpers
const validateName = (name: string): string | null => {
  if (!name.trim()) return "This field is required";
  if (name.trim().length < 2) return "Must be at least 2 characters";
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return "Only letters, spaces, hyphens, and apostrophes allowed";
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone?.trim()) return "Phone number is required";
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) return "Enter a valid phone number (10-15 digits)";
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address";
  return null;
};

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time validation on blur
  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate specific field
    let error: string | null = null;

    switch (field) {
      case 'firstName':
        error = validateName(formData.firstName);
        break;
      case 'lastName':
        error = validateName(formData.lastName);
        break;
      case 'phone':
        error = validatePhone(formData.phone || '');
        break;
      case 'dateOfBirth':
        if (!formData.dateOfBirth) {
          error = "Date of birth is required";
        } else {
          const dob = new Date(formData.dateOfBirth);
          const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 18) error = "You must be at least 18 years old";
        }
        break;
      case 'heightCm':
        if (formData.heightCm < 100 || formData.heightCm > 250) {
          error = "Enter a valid height (100-250 cm)";
        }
        break;
      case 'weightKg':
        if (formData.weightKg < 30 || formData.weightKg > 300) {
          error = "Enter a valid weight (30-300 kg)";
        }
        break;
      case 'occupation':
        if (!formData.occupation.trim()) error = "Occupation is required";
        break;
      case 'city':
        if (!formData.city.trim()) error = "City is required";
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  }, [formData]);

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

    const firstNameError = validateName(formData.firstName);
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;

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

    const phoneError = validatePhone(formData.phone || '');
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    // Mark all fields as touched on submit attempt
    setTouched({
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      heightCm: true,
      weightKg: true,
      occupation: true,
      city: true,
      phone: true,
    });
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

  // Helper for validation status icon
  const getFieldStatus = (field: string) => {
    if (!touched[field]) return null;
    if (errors[field]) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  return (
    <form id="form-personal_info" onSubmit={handleSubmit} className="space-y-6">
      {/* Info banner */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Your personal information helps us create a customized fitness and nutrition
          plan. All data is encrypted and kept confidential.
        </p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-foreground mb-1"
          >
            First Name *
          </label>
          <div className="relative">
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={() => handleBlur('firstName')}
              placeholder="Enter your first name"
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.firstName && errors.firstName
                  ? "border-red-500 focus:ring-red-500"
                  : touched.firstName && !errors.firstName && formData.firstName
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('firstName')}
            </div>
          </div>
          {touched.firstName && errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
          <FieldHint>Your legal first name as it appears on ID</FieldHint>
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Last Name *
          </label>
          <div className="relative">
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={() => handleBlur('lastName')}
              placeholder="Enter your last name"
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.lastName && errors.lastName
                  ? "border-red-500 focus:ring-red-500"
                  : touched.lastName && !errors.lastName && formData.lastName
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('lastName')}
            </div>
          </div>
          {touched.lastName && errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
          <FieldHint>Your legal last name/surname</FieldHint>
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
          <div className="relative">
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={() => handleBlur('dateOfBirth')}
              max={MIN_AGE_DATE}
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.dateOfBirth && errors.dateOfBirth
                  ? "border-red-500 focus:ring-red-500"
                  : touched.dateOfBirth && !errors.dateOfBirth && formData.dateOfBirth
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('dateOfBirth')}
            </div>
          </div>
          {touched.dateOfBirth && errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
          )}
          <FieldHint>You must be 18 years or older to apply</FieldHint>
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
          <FieldHint>Used for personalized nutrition recommendations</FieldHint>
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
          <div className="relative">
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              value={formData.heightCm || ""}
              onChange={handleChange}
              onBlur={() => handleBlur('heightCm')}
              min="100"
              max="250"
              placeholder="e.g., 170"
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.heightCm && errors.heightCm
                  ? "border-red-500 focus:ring-red-500"
                  : touched.heightCm && !errors.heightCm && formData.heightCm > 0
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('heightCm')}
            </div>
          </div>
          {touched.heightCm && errors.heightCm && (
            <p className="mt-1 text-sm text-red-500">{errors.heightCm}</p>
          )}
          <FieldHint>5&apos;7&quot; = 170cm, 6&apos;0&quot; = 183cm</FieldHint>
        </div>

        <div>
          <label
            htmlFor="weightKg"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Weight (kg) *
          </label>
          <div className="relative">
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              value={formData.weightKg || ""}
              onChange={handleChange}
              onBlur={() => handleBlur('weightKg')}
              min="30"
              max="300"
              step="0.1"
              placeholder="e.g., 70"
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.weightKg && errors.weightKg
                  ? "border-red-500 focus:ring-red-500"
                  : touched.weightKg && !errors.weightKg && formData.weightKg > 0
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('weightKg')}
            </div>
          </div>
          {touched.weightKg && errors.weightKg && (
            <p className="mt-1 text-sm text-red-500">{errors.weightKg}</p>
          )}
          <FieldHint>Your current body weight in kilograms</FieldHint>
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
            <div>
              <span className="text-sm font-medium text-foreground">
                Your BMI
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Body Mass Index - a general health indicator
              </p>
            </div>
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
          <div className="relative">
            <input
              id="occupation"
              name="occupation"
              type="text"
              value={formData.occupation}
              onChange={handleChange}
              onBlur={() => handleBlur('occupation')}
              placeholder="e.g., Software Engineer"
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.occupation && errors.occupation
                  ? "border-red-500 focus:ring-red-500"
                  : touched.occupation && !errors.occupation && formData.occupation
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('occupation')}
            </div>
          </div>
          {touched.occupation && errors.occupation && (
            <p className="mt-1 text-sm text-red-500">{errors.occupation}</p>
          )}
          <FieldHint>Helps us understand your daily activity level</FieldHint>
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-foreground mb-1"
          >
            City *
          </label>
          <div className="relative">
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              onBlur={() => handleBlur('city')}
              placeholder="e.g., Mumbai"
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                touched.city && errors.city
                  ? "border-red-500 focus:ring-red-500"
                  : touched.city && !errors.city && formData.city
                  ? "border-green-500 focus:ring-green-500"
                  : "border-border"
              } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getFieldStatus('city')}
            </div>
          </div>
          {touched.city && errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city}</p>
          )}
          <FieldHint>Where you currently reside</FieldHint>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Phone Number *
        </label>
        <div className="relative">
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={handleChange}
            onBlur={() => handleBlur('phone')}
            placeholder="+91 98765 43210"
            className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
              touched.phone && errors.phone
                ? "border-red-500 focus:ring-red-500"
                : touched.phone && !errors.phone && formData.phone
                ? "border-green-500 focus:ring-green-500"
                : "border-border"
            } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getFieldStatus('phone')}
          </div>
        </div>
        {touched.phone && errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
        <FieldHint>For WhatsApp communication with your coach</FieldHint>
      </div>
    </form>
  );
}

// Helper component for field hints - defined outside component to prevent re-creation
const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
    <Info className="w-3 h-3" />
    {children}
  </p>
);

// Export validation helpers for use in other components
export { validateName, validatePhone, validateEmail };
