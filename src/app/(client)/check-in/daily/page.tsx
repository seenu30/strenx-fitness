"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Scale,
  Footprints,
  Dumbbell,
  Camera,
  Battery,
  Brain,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MealPhoto {
  id: string;
  file: File;
  preview: string;
  mealType: string;
  notes: string;
}

interface DailyCheckinData {
  date: string;
  weight: number | null;
  steps: number | null;
  trainingCompleted: boolean;
  trainingNotes: string;
  energyLevel: number;
  stressLevel: number;
  sleepHours: number;
  waterLiters: number;
  mealPhotos: MealPhoto[];
  notes: string;
}

const MEAL_TYPES = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
  "Post-Workout",
];

export default function DailyCheckinPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingCheckinId, setExistingCheckinId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<DailyCheckinData>({
    date: new Date().toISOString().split("T")[0],
    weight: null,
    steps: null,
    trainingCompleted: false,
    trainingNotes: "",
    energyLevel: 5,
    stressLevel: 5,
    sleepHours: 7,
    waterLiters: 2,
    mealPhotos: [],
    notes: "",
  });

  // Fetch client_id and check for existing check-in on mount
  useEffect(() => {
    async function fetchClientAndCheckin() {
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

        // Check for existing check-in today
        const today = new Date().toISOString().split("T")[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingCheckin } = await (supabase as any)
          .from("daily_checkins")
          .select("*")
          .eq("client_id", client.id)
          .eq("checkin_date", today)
          .single();

        if (existingCheckin) {
          setExistingCheckinId(existingCheckin.id);
          setIsEditMode(true);
          // Load existing data into form
          setFormData(prev => ({
            ...prev,
            weight: existingCheckin.morning_weight_kg,
            steps: existingCheckin.step_count,
            trainingCompleted: existingCheckin.training_completed || false,
            energyLevel: existingCheckin.energy_level || 5,
            stressLevel: existingCheckin.stress_level || 5,
            sleepHours: existingCheckin.sleep_hours || 7,
            notes: existingCheckin.client_notes || "",
          }));
        }
      }
    }
    fetchClientAndCheckin();
  }, []);

  const steps = [
    { id: "basics", title: "Weight & Steps", icon: Scale },
    { id: "training", title: "Training", icon: Dumbbell },
    { id: "meals", title: "Meal Photos", icon: Camera },
    { id: "wellness", title: "Wellness", icon: Battery },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: MealPhoto[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      mealType: "Breakfast",
      notes: "",
    }));

    setFormData((prev) => ({
      ...prev,
      mealPhotos: [...prev.mealPhotos, ...newPhotos],
    }));
  };

  const removePhoto = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      mealPhotos: prev.mealPhotos.filter((p) => p.id !== id),
    }));
  };

  const updatePhotoMealType = (id: string, mealType: string) => {
    setFormData((prev) => ({
      ...prev,
      mealPhotos: prev.mealPhotos.map((p) =>
        p.id === id ? { ...p, mealType } : p
      ),
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

      let checkin;

      if (isEditMode && existingCheckinId) {
        // Update existing check-in
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: updateError } = await (supabase as any)
          .from("daily_checkins")
          .update({
            morning_weight_kg: formData.weight,
            step_count: formData.steps,
            training_completed: formData.trainingCompleted,
            energy_level: formData.energyLevel,
            stress_level: formData.stressLevel,
            sleep_hours: formData.sleepHours,
            client_notes: formData.notes || null,
          })
          .eq("id", existingCheckinId)
          .select()
          .single();

        if (updateError) throw updateError;
        checkin = data;
      } else {
        // Insert new daily check-in (RLS handles tenant assignment)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: checkinError } = await (supabase as any)
          .from("daily_checkins")
          .insert({
            client_id: clientId,
            checkin_date: formData.date,
            morning_weight_kg: formData.weight,
            step_count: formData.steps,
            training_completed: formData.trainingCompleted,
            energy_level: formData.energyLevel,
            stress_level: formData.stressLevel,
            sleep_hours: formData.sleepHours,
            client_notes: formData.notes || null,
          })
          .select()
          .single();

        if (checkinError) throw checkinError;
        checkin = data;
      }

      // 2. Insert training data if training was completed
      if (formData.trainingCompleted && checkin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: trainingError } = await (supabase as any)
          .from("checkin_training")
          .insert({
            checkin_id: checkin.id,
            performance_notes: formData.trainingNotes || null,
          });

        if (trainingError) console.error("Training insert error:", trainingError);
      }

      // 3. Upload meal photos and insert meal records
      if (formData.mealPhotos.length > 0 && checkin) {
        for (let i = 0; i < formData.mealPhotos.length; i++) {
          const photo = formData.mealPhotos[i];
          const filePath = `${clientId}/${formData.date}/${photo.id}-${photo.file.name}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("meal-photos")
            .upload(filePath, photo.file);

          if (uploadError) {
            console.error("Photo upload error:", uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("meal-photos")
            .getPublicUrl(filePath);

          // Insert meal record
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: mealError } = await (supabase as any)
            .from("checkin_meals")
            .insert({
              checkin_id: checkin.id,
              meal_number: i + 1,
              meal_name: photo.mealType,
              photo_url: urlData.publicUrl,
              photo_path: filePath,
            });

          if (mealError) console.error("Meal insert error:", mealError);
        }
      }

      // Success - redirect to dashboard
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
      case 0: // Weight & Steps
        return (
          <div className="space-y-6">
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Morning Weight (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weight: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g., 75.5"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Weigh yourself first thing in the morning, after using the bathroom
              </p>
            </div>

            {/* Steps */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Steps Today
              </label>
              <div className="relative">
                <Footprints className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.steps || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      steps: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g., 8000"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Check your phone or fitness tracker for today&apos;s step count
              </p>
            </div>
          </div>
        );

      case 1: // Training
        return (
          <div className="space-y-6">
            {/* Training Completed */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Did you complete your training today?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, trainingCompleted: true }))
                  }
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.trainingCompleted
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-border"
                  }`}
                >
                  <CheckCircle2
                    className={`w-6 h-6 mx-auto mb-2 ${
                      formData.trainingCompleted
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      formData.trainingCompleted
                        ? "text-green-700 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    Yes, completed!
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, trainingCompleted: false }))
                  }
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    !formData.trainingCompleted
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <AlertCircle
                    className={`w-6 h-6 mx-auto mb-2 ${
                      !formData.trainingCompleted
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      !formData.trainingCompleted
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Rest day / Skipped
                  </span>
                </button>
              </div>
            </div>

            {/* Training Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {formData.trainingCompleted
                  ? "How did your workout go?"
                  : "Any reason for skipping?"}
              </label>
              <textarea
                value={formData.trainingNotes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, trainingNotes: e.target.value }))
                }
                rows={3}
                placeholder={
                  formData.trainingCompleted
                    ? "e.g., Felt strong today, increased weight on squats..."
                    : "e.g., Scheduled rest day, not feeling well..."
                }
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        );

      case 2: // Meal Photos
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Upload photos of your meals for your coach to review. This helps ensure
                you&apos;re following the plan correctly.
              </p>
            </div>

            {/* Upload Button */}
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brown-500 text-white hover:bg-brown-600 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Meal Photos</span>
                </div>
              </label>
            </div>

            {/* Uploaded Photos */}
            {formData.mealPhotos.length > 0 && (
              <div className="space-y-4">
                {formData.mealPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex gap-4 p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700"
                  >
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={photo.preview}
                        alt="Meal"
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-stone-500 mb-1">
                        Meal Type
                      </label>
                      <select
                        value={photo.mealType}
                        onChange={(e) =>
                          updatePhotoMealType(photo.id, e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
                      >
                        {MEAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.mealPhotos.length === 0 && (
              <p className="text-center text-stone-500 py-8">
                No meal photos added yet. Tap the button above to add photos.
              </p>
            )}
          </div>
        );

      case 3: // Wellness
        return (
          <div className="space-y-6">
            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  Energy Level Today
                </div>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.energyLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    energyLevel: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
              />
              <div className="flex justify-between text-sm text-stone-500 mt-1">
                <span>Low (1)</span>
                <span className="font-bold text-brown-500">
                  {formData.energyLevel}
                </span>
                <span>High (10)</span>
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Stress Level Today
                </div>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.stressLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stressLevel: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brown-500"
              />
              <div className="flex justify-between text-sm text-stone-500 mt-1">
                <span>Low (1)</span>
                <span className="font-bold text-brown-500">
                  {formData.stressLevel}
                </span>
                <span>High (10)</span>
              </div>
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Hours of Sleep Last Night
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.sleepHours}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sleepHours: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>

            {/* Water Intake */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Water Intake (liters)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.waterLiters}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    waterLiters: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Any other notes for your coach?
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                placeholder="e.g., Feeling bloated after lunch, craving sweets..."
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
          {isEditMode ? "Update Today's Check-in" : "Daily Check-in"}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {isEditMode && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brown-100 dark:bg-brown-900/30 text-brown-600 dark:text-brown-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>You already checked in today. You can update your entries below.</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

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
                className={`flex flex-col items-center gap-1 ${
                  isActive || isCompleted ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-brown-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-stone-200 dark:bg-stone-700 text-stone-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
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
                  className={`w-8 sm:w-16 h-0.5 mx-2 ${
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
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-stone-400"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update Check-in" : "Submit Check-in"}
          </button>
        )}
      </div>
    </div>
  );
}
