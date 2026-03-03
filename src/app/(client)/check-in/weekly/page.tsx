"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Camera,
  Ruler,
  MessageSquare,
  CheckCircle2,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";

interface ProgressPhoto {
  id: string;
  file: File;
  preview: string;
  angle: "front" | "side" | "back";
}

interface WeeklyCheckinData {
  weekNumber: number;
  progressPhotos: ProgressPhoto[];
  measurements: {
    chest: number | null;
    waist: number | null;
    hips: number | null;
    leftArm: number | null;
    rightArm: number | null;
    leftThigh: number | null;
    rightThigh: number | null;
  };
  weeklyReflection: string;
  challenges: string;
  wins: string;
  questionsForCoach: string;
}

const PHOTO_ANGLES: Array<{ id: "front" | "side" | "back"; label: string; description: string }> = [
  { id: "front", label: "Front View", description: "Face the camera directly" },
  { id: "side", label: "Side View", description: "Turn 90 degrees to the left" },
  { id: "back", label: "Back View", description: "Face away from the camera" },
];

const MEASUREMENTS = [
  { id: "chest", label: "Chest", unit: "cm" },
  { id: "waist", label: "Waist", unit: "cm" },
  { id: "hips", label: "Hips", unit: "cm" },
  { id: "leftArm", label: "Left Arm", unit: "cm" },
  { id: "rightArm", label: "Right Arm", unit: "cm" },
  { id: "leftThigh", label: "Left Thigh", unit: "cm" },
  { id: "rightThigh", label: "Right Thigh", unit: "cm" },
];

export default function WeeklyCheckinPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WeeklyCheckinData>({
    weekNumber: Math.ceil((Date.now() - new Date("2026-01-01").getTime()) / (7 * 24 * 60 * 60 * 1000)),
    progressPhotos: [],
    measurements: {
      chest: null,
      waist: null,
      hips: null,
      leftArm: null,
      rightArm: null,
      leftThigh: null,
      rightThigh: null,
    },
    weeklyReflection: "",
    challenges: "",
    wins: "",
    questionsForCoach: "",
  });

  const steps = [
    { id: "photos", title: "Progress Photos", icon: Camera },
    { id: "measurements", title: "Measurements", icon: Ruler },
    { id: "reflection", title: "Weekly Reflection", icon: MessageSquare },
  ];

  // Load client ID on mount
  useEffect(() => {
    async function loadClientInfo() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (client) {
        setClientId(client.id);
      }
    }

    loadClientInfo();
  }, []);

  const handlePhotoUpload = (angle: "front" | "side" | "back", e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newPhoto: ProgressPhoto = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      angle,
    };

    setFormData((prev) => ({
      ...prev,
      progressPhotos: [
        ...prev.progressPhotos.filter((p) => p.angle !== angle),
        newPhoto,
      ],
    }));
  };

  const removePhoto = (angle: "front" | "side" | "back") => {
    setFormData((prev) => ({
      ...prev,
      progressPhotos: prev.progressPhotos.filter((p) => p.angle !== angle),
    }));
  };

  const getPhotoByAngle = (angle: "front" | "side" | "back") => {
    return formData.progressPhotos.find((p) => p.angle === angle);
  };

  const updateMeasurement = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [id]: value ? parseFloat(value) : null,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!clientId) {
        throw new Error("Unable to submit. Please try again.");
      }

      // Calculate week start date (Monday of current week)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + mondayOffset);
      const weekStartDate = weekStart.toISOString().split('T')[0];

      // 1. Insert weekly check-in (RLS handles tenant assignment)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: checkin, error: checkinError } = await (supabase as any)
        .from("weekly_checkins")
        .insert({
          client_id: clientId,
          week_start_date: weekStartDate,
          week_number: formData.weekNumber,
          weekly_summary: formData.weeklyReflection,
          challenges: formData.challenges || null,
          wins: formData.wins || null,
          questions_for_coach: formData.questionsForCoach || null,
        })
        .select()
        .single();

      if (checkinError) {
        throw new Error(checkinError.message);
      }

      // 2. Insert measurements if any are provided (RLS handles tenant assignment)
      const hasMeasurements = Object.values(formData.measurements).some(v => v !== null);
      if (hasMeasurements) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: measurementError } = await (supabase as any)
          .from("measurements")
          .insert({
            client_id: clientId,
            measurement_date: weekStartDate,
            chest_cm: formData.measurements.chest,
            waist_cm: formData.measurements.waist,
            hips_cm: formData.measurements.hips,
            left_arm_cm: formData.measurements.leftArm,
            right_arm_cm: formData.measurements.rightArm,
            left_thigh_cm: formData.measurements.leftThigh,
            right_thigh_cm: formData.measurements.rightThigh,
            weekly_checkin_id: checkin.id,
          });

        if (measurementError) {
          console.error("Error saving measurements:", measurementError);
        }
      }

      // 3. Upload progress photos and save to database
      for (const photo of formData.progressPhotos) {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${clientId}/${checkin.id}/${photo.angle}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("progress-photos")
          .upload(fileName, photo.file);

        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          continue;
        }

        // Save photo record (RLS handles tenant assignment)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: photoError } = await (supabase as any)
          .from("progress_photos")
          .insert({
            client_id: clientId,
            photo_date: weekStartDate,
            photo_type: photo.angle,
            weekly_checkin_id: checkin.id,
            notes: `Weekly check-in ${photo.angle} photo`,
          });

        if (photoError) {
          console.error("Error saving photo record:", photoError);
        }
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error submitting check-in:", err);
      setError(err instanceof Error ? err.message : "Failed to submit check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Progress Photos
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tips for good progress photos:</strong>
              </p>
              <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                <li>Use the same location and lighting each week</li>
                <li>Wear similar fitting clothes (or swimwear)</li>
                <li>Stand in the same position each time</li>
                <li>Take photos at the same time of day</li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {PHOTO_ANGLES.map((angle) => {
                const photo = getPhotoByAngle(angle.id);
                return (
                  <div key={angle.id} className="space-y-2">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                      {angle.label}
                    </label>
                    {photo ? (
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
                        <Image
                          src={photo.preview}
                          alt={angle.label}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(angle.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(angle.id, e)}
                          className="hidden"
                        />
                        <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600 flex flex-col items-center justify-center gap-2 hover:border-brown-500 transition-colors">
                          <Plus className="w-8 h-8 text-stone-400" />
                          <span className="text-sm text-stone-500">
                            {angle.description}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            {formData.progressPhotos.length < 3 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-brown-50 dark:bg-brown-900/20 border border-brown-200 dark:border-brown-700">
                <AlertTriangle className="w-5 h-5 text-brown-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brown-600 dark:text-brown-300">
                  Please upload all 3 photos for accurate progress tracking.
                </p>
              </div>
            )}
          </div>
        );

      case 1: // Measurements
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Take measurements first thing in the morning for consistency.
                Use a soft tape measure and keep it snug but not tight.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {MEASUREMENTS.map((measurement) => (
                <div key={measurement.id}>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {measurement.label} ({measurement.unit})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.measurements[measurement.id as keyof typeof formData.measurements] || ""}
                    onChange={(e) => updateMeasurement(measurement.id, e.target.value)}
                    placeholder={`e.g., 90`}
                    className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 2: // Reflection
        return (
          <div className="space-y-6">
            {/* Weekly Reflection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                How was your week overall? *
              </label>
              <textarea
                value={formData.weeklyReflection}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weeklyReflection: e.target.value }))
                }
                rows={4}
                placeholder="Reflect on your nutrition, training, sleep, stress levels..."
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500 resize-none"
              />
            </div>

            {/* Wins */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                What were your wins this week?
              </label>
              <textarea
                value={formData.wins}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, wins: e.target.value }))
                }
                rows={3}
                placeholder="e.g., Hit all my protein targets, completed every workout, slept 8 hours every night..."
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500 resize-none"
              />
            </div>

            {/* Challenges */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                What challenges did you face?
              </label>
              <textarea
                value={formData.challenges}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, challenges: e.target.value }))
                }
                rows={3}
                placeholder="e.g., Struggled with cravings, missed one workout due to work, stress eating..."
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500 resize-none"
              />
            </div>

            {/* Questions for Coach */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Any questions for your coach?
              </label>
              <textarea
                value={formData.questionsForCoach}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, questionsForCoach: e.target.value }))
                }
                rows={3}
                placeholder="Anything you'd like to discuss or clarify..."
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500 resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Weekly Check-in
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Week {formData.weekNumber} Progress Update
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(index)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-brown-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-stone-200 dark:bg-stone-700 text-stone-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? "text-brown-500"
                      : isCompleted
                      ? "text-green-600"
                      : "text-stone-500"
                  }`}
                >
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-0.5 mx-2 ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-stone-200 dark:bg-stone-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        {renderStepContent()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentStep === 0
              ? "bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed"
              : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
          }`}
        >
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="px-6 py-3 rounded-lg font-medium bg-brown-500 text-white hover:bg-brown-600 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.weeklyReflection.trim()}
            className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-stone-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Weekly Check-in"}
          </button>
        )}
      </div>
    </div>
  );
}
