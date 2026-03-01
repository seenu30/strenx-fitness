"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ChevronLeft,
  User,
  Activity,
  ClipboardList,
  TrendingUp,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Edit,
  MoreVertical,
  Camera,
  Weight,
  Target,
  Heart,
  Utensils,
  Dumbbell,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  status: string;
  plan: string | null;
  startDate: string | null;
  endDate: string | null;
  compliance: number;
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
}

interface Assessment {
  goals: {
    primary: string;
    secondary: string;
    timeline: string;
    motivation: string;
  };
  training: {
    experience: string;
    frequency: string;
    style: string[];
    injuries: string;
  };
  lifestyle: {
    sleepHours: string;
    stressLevel: string;
    activityLevel: string;
    occupation: string;
  };
  diet: {
    preference: string;
    mealsPerDay: number;
    waterIntake: string;
    alcohol: string;
  };
}

interface CheckIn {
  id: string;
  date: string;
  type: "daily" | "weekly";
  weight: number | null;
  steps: number | null;
  training: boolean;
  compliance: number;
  notes: string | null;
}

interface NutritionPlan {
  id: string;
  name: string;
  calories: number;
  protein: number;
  updated_at: string;
}

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  updated_at: string;
}

type TabType = "overview" | "assessment" | "checkins" | "progress" | "plans" | "messages";

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.clientId;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [client, setClient] = useState<Client | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [weightData, setWeightData] = useState<number[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  async function loadClientData() {
    try {
      // Get client basic info
      const { data: clientData } = await (supabase as any)
        .from("clients")
        .select(`
          id,
          status,
          start_date,
          end_date,
          target_weight_kg,
          users!inner(
            id,
            email,
            full_name
          )
        `)
        .eq("id", clientId)
        .single();

      if (!clientData) {
        setLoading(false);
        return;
      }

      // Get personal assessment data
      const { data: personalData } = await (supabase as any)
        .from("assess_personal")
        .select("*")
        .eq("client_id", clientId)
        .single();

      // Get goals assessment
      const { data: goalsData } = await (supabase as any)
        .from("assess_goals")
        .select("*")
        .eq("client_id", clientId)
        .single();

      // Get training assessment
      const { data: trainingData } = await (supabase as any)
        .from("assess_training")
        .select("*")
        .eq("client_id", clientId)
        .single();

      // Get lifestyle assessment
      const { data: lifestyleData } = await (supabase as any)
        .from("assess_lifestyle")
        .select("*")
        .eq("client_id", clientId)
        .single();

      // Get diet assessment
      const { data: dietData } = await (supabase as any)
        .from("assess_diet")
        .select("*")
        .eq("client_id", clientId)
        .single();

      // Get daily check-ins
      const { data: dailyCheckins } = await (supabase as any)
        .from("daily_checkins")
        .select("*")
        .eq("client_id", clientId)
        .order("check_in_date", { ascending: false })
        .limit(20);

      // Get weekly check-ins
      const { data: weeklyCheckins } = await (supabase as any)
        .from("weekly_checkins")
        .select("*")
        .eq("client_id", clientId)
        .order("check_in_date", { ascending: false })
        .limit(10);

      // Get assigned nutrition plan
      const { data: nutritionAssignment } = await (supabase as any)
        .from("client_nutrition_plans")
        .select(`
          nutrition_plan_id,
          nutrition_plans(id, name, daily_calories, daily_protein_g, updated_at)
        `)
        .eq("client_id", clientId)
        .eq("is_active", true)
        .single();

      // Get assigned training plan
      const { data: trainingAssignment } = await (supabase as any)
        .from("client_training_plans")
        .select(`
          training_plan_id,
          training_plans(id, name, description, updated_at)
        `)
        .eq("client_id", clientId)
        .eq("is_active", true)
        .single();

      // Calculate client info
      const allCheckins = [
        ...(dailyCheckins || []).map((c: any) => ({ ...c, type: "daily" as const })),
        ...(weeklyCheckins || []).map((c: any) => ({ ...c, type: "weekly" as const })),
      ].sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime());

      // Get weights from check-ins for chart
      const weights: number[] = [];
      const checkinWithWeights = allCheckins.filter(c => c.weight_kg && c.weight_kg > 0);
      checkinWithWeights.slice(0, 10).reverse().forEach((c: any) => {
        if (c.weight_kg) weights.push(c.weight_kg);
      });

      // Calculate start weight (first recorded weight)
      const startWeight = checkinWithWeights.length > 0
        ? checkinWithWeights[checkinWithWeights.length - 1].weight_kg
        : personalData?.weight_kg || 0;

      // Current weight (most recent)
      const currentWeight = checkinWithWeights.length > 0
        ? checkinWithWeights[0].weight_kg
        : personalData?.weight_kg || 0;

      // Target weight
      const targetWeight = clientData.target_weight_kg || goalsData?.target_weight || currentWeight;

      // Calculate age from DOB
      let age = null;
      if (personalData?.date_of_birth) {
        const dob = new Date(personalData.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }

      // Calculate compliance
      const last7Days = (dailyCheckins || []).slice(0, 7);
      const compliance = last7Days.length > 0
        ? Math.round((last7Days.length / 7) * 100)
        : 0;

      // Get training days per week
      let daysPerWeek = 0;
      if (trainingAssignment?.training_plans) {
        const { data: trainingDays } = await (supabase as any)
          .from("training_plan_days")
          .select("id")
          .eq("training_plan_id", trainingAssignment.training_plans.id);
        daysPerWeek = trainingDays?.length || 0;
      }

      setClient({
        id: clientData.id,
        name: clientData.users?.full_name || "Unknown",
        email: clientData.users?.email || "",
        phone: personalData?.phone || null,
        city: personalData?.city || null,
        age,
        gender: personalData?.gender || null,
        height: personalData?.height_cm || null,
        status: clientData.status || "active",
        plan: nutritionAssignment?.nutrition_plans?.name || trainingAssignment?.training_plans?.name || null,
        startDate: clientData.start_date,
        endDate: clientData.end_date,
        compliance,
        currentWeight,
        startWeight,
        targetWeight,
      });

      // Format assessment data
      if (goalsData || trainingData || lifestyleData || dietData) {
        setAssessment({
          goals: {
            primary: goalsData?.primary_goal || "Not specified",
            secondary: goalsData?.secondary_goal || "Not specified",
            timeline: goalsData?.timeline || "Not specified",
            motivation: goalsData?.motivation || "Not specified",
          },
          training: {
            experience: trainingData?.experience_level || "Not specified",
            frequency: trainingData?.current_frequency || "Not specified",
            style: trainingData?.preferred_style ? [trainingData.preferred_style] : [],
            injuries: trainingData?.injuries_limitations || "None reported",
          },
          lifestyle: {
            sleepHours: lifestyleData?.sleep_hours ? `${lifestyleData.sleep_hours} hours` : "Not specified",
            stressLevel: lifestyleData?.stress_level || "Not specified",
            activityLevel: lifestyleData?.activity_level || "Not specified",
            occupation: lifestyleData?.occupation || "Not specified",
          },
          diet: {
            preference: dietData?.diet_preference || "Not specified",
            mealsPerDay: dietData?.meals_per_day || 3,
            waterIntake: dietData?.water_intake || "Not specified",
            alcohol: dietData?.alcohol_consumption || "Not specified",
          },
        });
      }

      // Format check-ins
      const formattedCheckins: CheckIn[] = allCheckins.slice(0, 10).map((c: any) => ({
        id: c.id,
        date: c.check_in_date,
        type: c.type,
        weight: c.weight_kg || null,
        steps: c.steps || null,
        training: c.did_training || false,
        compliance: c.type === "weekly" ? (c.overall_compliance || 0) : (c.diet_compliance || 100),
        notes: c.notes || c.highlights || null,
      }));

      setCheckins(formattedCheckins);
      setWeightData(weights);

      if (nutritionAssignment?.nutrition_plans) {
        setNutritionPlan({
          id: nutritionAssignment.nutrition_plans.id,
          name: nutritionAssignment.nutrition_plans.name,
          calories: nutritionAssignment.nutrition_plans.daily_calories || 0,
          protein: nutritionAssignment.nutrition_plans.daily_protein_g || 0,
          updated_at: nutritionAssignment.nutrition_plans.updated_at,
        });
      }

      if (trainingAssignment?.training_plans) {
        setTrainingPlan({
          id: trainingAssignment.training_plans.id,
          name: trainingAssignment.training_plans.name,
          description: trainingAssignment.training_plans.description,
          days_per_week: daysPerWeek,
          updated_at: trainingAssignment.training_plans.updated_at,
        });
      }

    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressPercent = () => {
    if (!client || client.startWeight === client.targetWeight) return 0;
    const total = client.startWeight - client.targetWeight;
    const current = client.startWeight - client.currentWeight;
    return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  };

  const getDaysRemaining = () => {
    if (!client?.endDate) return 0;
    const end = new Date(client.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "assessment", label: "Assessment", icon: ClipboardList },
    { id: "checkins", label: "Check-ins", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "plans", label: "Plans", icon: Activity },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">
            Client Not Found
          </h3>
          <p className="text-stone-500">
            The client you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                {client.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {client.name}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-stone-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {client.phone}
                  </span>
                )}
                {client.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {client.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button className="p-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-500">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className={`w-5 h-5 ${client.status === "active" ? "text-green-500" : "text-stone-400"}`} />
            <span className={`font-semibold capitalize ${client.status === "active" ? "text-green-600" : "text-stone-500"}`}>
              {client.status}
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-500">Compliance</p>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">
            {client.compliance}%
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-500">Weight Change</p>
          <p className={`text-2xl font-bold mt-1 ${
            client.startWeight - client.currentWeight > 0 ? "text-green-600" :
            client.startWeight - client.currentWeight < 0 ? "text-red-600" : "text-stone-600"
          }`}>
            {client.startWeight - client.currentWeight > 0 ? "-" : ""}
            {Math.abs(client.startWeight - client.currentWeight).toFixed(1)} kg
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-500">Goal Progress</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {getProgressPercent()}%
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-500">Days Left</p>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">
            {client.endDate ? getDaysRemaining() : "—"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        {activeTab === "overview" && (
          <div className="p-6 space-y-6">
            {/* Program Info */}
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                Current Program
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <p className="text-sm text-stone-500">Plan</p>
                  <p className="font-medium text-stone-800 dark:text-stone-200">
                    {client.plan || "No plan assigned"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <p className="text-sm text-stone-500">Start Date</p>
                  <p className="font-medium text-stone-800 dark:text-stone-200">
                    {client.startDate ? formatDate(client.startDate) : "Not set"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <p className="text-sm text-stone-500">End Date</p>
                  <p className="font-medium text-stone-800 dark:text-stone-200">
                    {client.endDate ? formatDate(client.endDate) : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Weight Progress */}
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                Weight Progress
              </h3>
              {weightData.length > 1 ? (
                <>
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                      {(() => {
                        const minW = Math.min(...weightData);
                        const maxW = Math.max(...weightData);
                        const range = maxW - minW || 1;
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2"
                              points={weightData.map((w, i) => {
                                const x = (i / (weightData.length - 1)) * 380 + 10;
                                const y = 110 - ((w - minW) / range) * 90;
                                return `${x},${y}`;
                              }).join(" ")}
                            />
                            {weightData.map((w, i) => {
                              const x = (i / (weightData.length - 1)) * 380 + 10;
                              const y = 110 - ((w - minW) / range) * 90;
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#f59e0b"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-stone-500 px-2">
                      <span>Week 1</span>
                      <span>Current</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-sm">
                    <div>
                      <span className="text-stone-500">Start: </span>
                      <span className="font-medium text-stone-800 dark:text-stone-200">
                        {client.startWeight} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500">Current: </span>
                      <span className="font-medium text-amber-600">
                        {client.currentWeight} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500">Target: </span>
                      <span className="font-medium text-green-600">
                        {client.targetWeight} kg
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  Not enough weight data yet. Weights are recorded during check-ins.
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                Recent Check-ins
              </h3>
              {checkins.length > 0 ? (
                <div className="space-y-3">
                  {checkins.slice(0, 3).map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            checkin.type === "weekly"
                              ? "bg-purple-100 dark:bg-purple-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          <Calendar
                            className={`w-4 h-4 ${
                              checkin.type === "weekly"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-200 capitalize">
                            {checkin.type} Check-in
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatDate(checkin.date)} {checkin.weight && `• ${checkin.weight} kg`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          checkin.compliance >= 90
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : checkin.compliance >= 70
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {checkin.compliance}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  No check-ins recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "assessment" && (
          <div className="p-6 space-y-6">
            {assessment ? (
              <>
                {/* Goals */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                      Goals
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Primary Goal</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.goals.primary}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Secondary Goal</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.goals.secondary}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Timeline</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.goals.timeline}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Motivation</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.goals.motivation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Training Background */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Dumbbell className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                      Training Background
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Experience Level</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.training.experience}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Frequency</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.training.frequency}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Training Style</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.training.style.length > 0 ? assessment.training.style.join(", ") : "Not specified"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-700 dark:text-amber-400">Injuries/Limitations</p>
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        {assessment.training.injuries}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lifestyle */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                      Lifestyle
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Sleep</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.lifestyle.sleepHours}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Stress Level</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.lifestyle.stressLevel}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Activity Level</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.lifestyle.activityLevel}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Occupation</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.lifestyle.occupation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diet */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                      Diet Preferences
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Diet Type</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.diet.preference}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Meals Per Day</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.diet.mealsPerDay}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Water Intake</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.diet.waterIntake}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <p className="text-sm text-stone-500">Alcohol</p>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {assessment.diet.alcohol}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">
                  No Assessment Data
                </h3>
                <p className="text-stone-500">
                  This client hasn&apos;t completed their onboarding assessment yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "checkins" && (
          <div className="p-6">
            {checkins.length > 0 ? (
              <div className="space-y-4">
                {checkins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="p-4 rounded-lg border border-stone-200 dark:border-stone-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            checkin.type === "weekly"
                              ? "bg-purple-100 dark:bg-purple-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          <Calendar
                            className={`w-5 h-5 ${
                              checkin.type === "weekly"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-200 capitalize">
                            {checkin.type} Check-in
                          </p>
                          <p className="text-sm text-stone-500">
                            {formatDate(checkin.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          checkin.compliance >= 90
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : checkin.compliance >= 70
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {checkin.compliance}% Compliance
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                          {checkin.weight ? `${checkin.weight} kg` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                          {checkin.steps ? `${checkin.steps.toLocaleString()} steps` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                          {checkin.training ? "Trained" : "Rest Day"}
                        </span>
                      </div>
                    </div>

                    {checkin.notes && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 p-3 rounded-lg">
                        {checkin.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">
                  No Check-ins Yet
                </h3>
                <p className="text-stone-500">
                  This client hasn&apos;t submitted any check-ins yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "progress" && (
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">Weight Change</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  {(client.startWeight - client.currentWeight).toFixed(1)} kg
                </p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">To Goal</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                  {(client.currentWeight - client.targetWeight).toFixed(1)} kg
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">Avg Weekly Change</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                  {weightData.length > 1
                    ? ((weightData[weightData.length - 1] - weightData[0]) / weightData.length).toFixed(2)
                    : "0"} kg
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                Progress Photos
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {["Front", "Side", "Back"].map((angle) => (
                  <div key={angle} className="space-y-2">
                    <p className="text-sm text-stone-500 text-center">{angle}</p>
                    <div className="aspect-[3/4] bg-stone-200 dark:bg-stone-700 rounded-lg flex items-center justify-center">
                      <Camera className="w-8 h-8 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-stone-500 text-center mt-4">
                Progress photos are uploaded during weekly check-ins
              </p>
            </div>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Utensils className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      Nutrition Plan
                    </p>
                    <p className="text-sm text-stone-500">
                      {nutritionPlan?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                {nutritionPlan ? (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Calories</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {nutritionPlan.calories.toLocaleString()} kcal
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Protein</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {nutritionPlan.protein}g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Last Updated</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {formatDate(nutritionPlan.updated_at)}
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      Edit Plan
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-stone-500 mt-2">
                    No nutrition plan has been assigned to this client.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Dumbbell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      Training Plan
                    </p>
                    <p className="text-sm text-stone-500">
                      {trainingPlan?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                {trainingPlan ? (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Days/Week</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {trainingPlan.days_per_week} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Focus</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {trainingPlan.description || "General fitness"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Last Updated</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {formatDate(trainingPlan.updated_at)}
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      Edit Plan
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-stone-500 mt-2">
                    No training plan has been assigned to this client.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="p-6">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">Message history with client</p>
              <Link
                href={`/admin/messages?client=${client.id}`}
                className="inline-block mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Open Chat
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
