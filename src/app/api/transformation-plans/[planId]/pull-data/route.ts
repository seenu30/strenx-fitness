import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  HeaderSectionContent,
  BloodReportStrategySectionContent,
  DailyMacrosSectionContent,
  MealPlanSectionContent,
  TrainingProgramSectionContent,
  SupplementsSectionContent,
  CoachCredentialsSectionContent,
  PullDataResponse,
} from "@/types/transformation-plan";

/**
 * GET /api/transformation-plans/[planId]/pull-data
 * Pull data from existing sources to pre-fill the transformation plan
 *
 * Sources:
 * - Client info: clients, users, assess_personal
 * - Blood report: assess_blood_reports
 * - Macros: nutrition_plans, nutrition_plan_versions
 * - Meals: nutrition_meals, meal_items
 * - Training: training_plans, training_plan_versions
 * - Coach credentials: coaches
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a coach or admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !userProfile ||
      (userProfile.role !== "coach" && userProfile.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only coaches can pull data" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, bio, certifications, users!inner(first_name, last_name)")
      .eq("user_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Get the plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase as any)
      .from("transformation_plans")
      .select(`
        id,
        client_id,
        phase,
        duration_weeks,
        nutrition_plan_version_id,
        training_plan_version_id,
        assessment_id
      `)
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Transformation plan not found" },
        { status: 404 }
      );
    }

    // Verify this client belongs to this coach (unless admin)
    if (userProfile.role !== "admin") {
      const { data: clientCheck } = await supabase
        .from("clients")
        .select("id")
        .eq("id", plan.client_id)
        .eq("coach_id", coach.id)
        .single();

      if (!clientCheck) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const response: PullDataResponse = {};

    // 1. Pull client info for header
    const { data: clientData } = await supabase
      .from("clients")
      .select(`
        id,
        user_id,
        users!inner(first_name, last_name, email)
      `)
      .eq("id", plan.client_id)
      .single();

    // Get assessment data if available
    let assessmentData: {
      age?: number;
      heightCm?: number;
      weightKg?: number;
      goal?: string;
    } = {};

    // Assessment data is stored in assess_personal table
    {
      // Try to get from assess_personal
      const { data: personalAssess } = await supabase
        .from("assess_personal")
        .select("*")
        .eq("client_id", plan.client_id)
        .single();

      if (personalAssess) {
        assessmentData = {
          age: personalAssess.age || undefined,
          heightCm: personalAssess.height_cm || undefined,
          weightKg: personalAssess.current_weight_kg || undefined,
        };
      }

      // Try to get goal from assess_goals
      if (personalAssess?.assessment_id) {
        const { data: goalsAssess } = await supabase
          .from("assess_goals")
          .select("primary_goals")
          .eq("assessment_id", personalAssess.assessment_id)
          .single();

        if (goalsAssess?.primary_goals && Array.isArray(goalsAssess.primary_goals)) {
          assessmentData.goal = goalsAssess.primary_goals[0] || undefined;
        }
      }
    }

    if (clientData) {
      const clientUser = clientData.users as { first_name: string | null; last_name: string | null };
      const coachUser = coach.users as { first_name: string | null; last_name: string | null };

      const header: Partial<HeaderSectionContent> = {
        clientName: `${clientUser.first_name || ""} ${clientUser.last_name || ""}`.trim() || "Client",
        coachName: `${coachUser.first_name || ""} ${coachUser.last_name || ""}`.trim() || "Coach",
        phase: plan.phase || "Phase 1",
        durationWeeks: plan.duration_weeks || 4,
        ...assessmentData,
      };

      // Add coach credentials
      if (coach.certifications) {
        const certs = coach.certifications as Array<{ name: string; issuer?: string; year?: number }>;
        header.coachCredentials = certs.map((c) => c.name);
      }

      response.header = header;
    }

    // 2. Pull blood report data
    const { data: bloodReport } = await supabase
      .from("assess_blood_reports")
      .select("*")
      .eq("client_id", plan.client_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (bloodReport) {
      const bloodStrategy: Partial<BloodReportStrategySectionContent> = {
        keyObservations: [],
        primaryFocusAreas: [],
        recommendations: [],
      };

      // Extract abnormal parameters from blood report data
      if (bloodReport.abnormal_parameters && Array.isArray(bloodReport.abnormal_parameters)) {
        bloodStrategy.keyObservations = bloodReport.abnormal_parameters;
        bloodStrategy.primaryFocusAreas = bloodReport.abnormal_parameters;
      }

      response.bloodReportStrategy = bloodStrategy;
    }

    // 3. Pull nutrition plan data for macros
    if (plan.nutrition_plan_version_id) {
      const { data: nutritionVersion } = await supabase
        .from("nutrition_plan_versions")
        .select(`
          id,
          plan_id,
          plan_data,
          nutrition_plans:plan_id(
            name,
            target_calories,
            target_protein_g,
            target_carbs_g,
            target_fat_g
          )
        `)
        .eq("id", plan.nutrition_plan_version_id)
        .single();

      if (nutritionVersion) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const np = (nutritionVersion as any).nutrition_plans as {
          target_calories: number | null;
          target_protein_g: number | null;
          target_carbs_g: number | null;
          target_fat_g: number | null;
        } | null;

        if (np) {
          const macros: Partial<DailyMacrosSectionContent> = {
            targetCalories: np.target_calories || 2000,
            proteinG: np.target_protein_g || 150,
            carbsG: np.target_carbs_g || 200,
            fatG: np.target_fat_g || 60,
          };
          response.dailyMacros = macros;
        }

        // Pull meals from nutrition_meals
        const { data: meals } = await supabase
          .from("nutrition_meals")
          .select(`
            id,
            meal_number,
            meal_name,
            meal_time,
            meal_items(
              id,
              food_name,
              quantity,
              calories,
              protein_g,
              carbs_g,
              fat_g,
              preparation_notes
            )
          `)
          .eq("plan_version_id", plan.nutrition_plan_version_id)
          .order("meal_number");

        if (meals && meals.length > 0) {
          const mealPlan: Partial<MealPlanSectionContent> = {
            meals: meals.map((meal) => ({
              mealNumber: meal.meal_number,
              mealName: meal.meal_name || `Meal ${meal.meal_number}`,
              time: meal.meal_time || undefined,
              options: [
                {
                  optionLabel: "Option A",
                  items: (meal.meal_items || []).map((item) => ({
                    foodName: item.food_name,
                    quantity: String(item.quantity),
                    calories: item.calories || undefined,
                    proteinG: item.protein_g || undefined,
                    carbsG: item.carbs_g || undefined,
                    fatG: item.fat_g || undefined,
                    notes: item.preparation_notes || undefined,
                  })),
                },
              ],
            })),
          };
          response.mealPlan = mealPlan;
        }
      }
    }

    // 4. Pull training plan data
    if (plan.training_plan_version_id) {
      // Pull training days
      const { data: trainingDays } = await supabase
        .from("training_days")
        .select(`
          id,
          day_number,
          day_name,
          focus_areas,
          is_rest_day,
          training_exercises(
            id,
            exercise_name,
            sets,
            reps,
            rest_seconds,
            tempo,
            coach_notes,
            sort_order
          )
        `)
        .eq("plan_version_id", plan.training_plan_version_id)
        .order("day_number");

      if (trainingDays && trainingDays.length > 0) {
        const program: Partial<TrainingProgramSectionContent> = {
          weeklySplit: trainingDays.map((d) => d.day_name || `Day ${d.day_number}`),
          days: trainingDays.map((day) => ({
            dayNumber: day.day_number,
            dayName: day.day_name || `Day ${day.day_number}`,
            focusAreas: day.focus_areas || [],
            isRestDay: day.is_rest_day || false,
            exercises: (day.training_exercises || [])
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((ex) => ({
                name: ex.exercise_name,
                sets: ex.sets || 3,
                reps: ex.reps || "8-12",
                restSeconds: ex.rest_seconds || undefined,
                tempo: ex.tempo || undefined,
                notes: ex.coach_notes || undefined,
              })),
          })),
        };
        response.trainingProgram = program;
      }
    }

    // 5. Pull supplement recommendations from assessment
    const { data: assessSupplements } = await supabase
      .from("assess_supplements")
      .select("*")
      .eq("client_id", plan.client_id)
      .single();

    if (assessSupplements) {
      const supplements: Partial<SupplementsSectionContent> = {
        supplements: [],
      };

      // Pull from supplement library based on deficiencies
      if (response.bloodReportStrategy?.primaryFocusAreas) {
        const deficiencies = response.bloodReportStrategy.primaryFocusAreas.map((d) =>
          d.toLowerCase().replace(/\s+/g, "_")
        );

        if (deficiencies.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: recommendedSupplements } = await (supabase as any)
            .from("supplement_library")
            .select("*")
            .eq("is_active", true)
            .overlaps("target_deficiencies", deficiencies);

          if (recommendedSupplements) {
            supplements.supplements = recommendedSupplements.map((s: {
              name: string;
              default_dosage?: string;
              default_timing?: string;
              target_deficiencies?: string[];
            }) => ({
              name: s.name,
              dosage: s.default_dosage || "",
              timing: s.default_timing || "",
              targetDeficiency: s.target_deficiencies?.[0] || undefined,
            }));
          }
        }
      }

      response.supplements = supplements;
    }

    // 6. Coach credentials
    const coachUser = coach.users as { first_name: string | null; last_name: string | null };
    const credentials: Partial<CoachCredentialsSectionContent> = {
      credentials: [],
    };

    if (coach.certifications) {
      const certs = coach.certifications as Array<{ name: string; issuer?: string; year?: number }>;
      credentials.credentials = certs.map((c) => {
        let cert = c.name;
        if (c.issuer) cert += ` (${c.issuer})`;
        if (c.year) cert += ` - ${c.year}`;
        return cert;
      });
    }

    if (coach.bio) {
      credentials.credentials?.unshift(
        `${coachUser.first_name || ""} ${coachUser.last_name || ""} - ${coach.bio}`.trim()
      );
    }

    response.coachCredentials = credentials;

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error in pull-data API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
