/**
 * Risk Engine Rules
 *
 * Defines the conditions that trigger risk flags based on medical history,
 * blood reports, and other health indicators.
 */

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskCategory =
  | "cardiovascular"
  | "metabolic"
  | "musculoskeletal"
  | "mental_health"
  | "nutritional"
  | "hormonal"
  | "respiratory"
  | "general";

export interface RiskRule {
  id: string;
  name: string;
  category: RiskCategory;
  severity: RiskSeverity;
  description: string;
  restrictions: string[];
  recommendations: string[];
  requiresAcknowledgment: boolean;
  requiresMedicalClearance: boolean;
}

export interface MedicalConditionRule extends RiskRule {
  conditions: string[]; // Medical conditions that trigger this rule
  keywords: string[]; // Additional keywords to match
}

export interface BloodValueRule extends RiskRule {
  marker: string;
  unit: string;
  criticalLow?: number;
  warningLow?: number;
  warningHigh?: number;
  criticalHigh?: number;
}

export interface LifestyleRule extends RiskRule {
  factor: string;
  threshold: string | number;
  comparison: "equals" | "greater_than" | "less_than" | "contains";
}

/**
 * Medical Condition Risk Rules
 */
export const MEDICAL_CONDITION_RULES: MedicalConditionRule[] = [
  {
    id: "heart_disease",
    name: "Cardiovascular Disease",
    category: "cardiovascular",
    severity: "critical",
    conditions: [
      "heart disease",
      "heart attack",
      "myocardial infarction",
      "coronary artery disease",
      "heart failure",
      "arrhythmia",
      "atrial fibrillation",
    ],
    keywords: ["cardiac", "coronary", "angina", "stent", "bypass"],
    description: "Client has history of cardiovascular disease",
    restrictions: [
      "Avoid high-intensity interval training without medical clearance",
      "No isometric exercises without supervision",
      "Avoid exercises that cause chest pain or shortness of breath",
      "Limit caffeine intake",
    ],
    recommendations: [
      "Require current cardiologist clearance before starting program",
      "Start with low-intensity aerobic exercise",
      "Monitor heart rate during all sessions",
      "Have emergency contact information readily available",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: true,
  },
  {
    id: "hypertension",
    name: "Hypertension",
    category: "cardiovascular",
    severity: "high",
    conditions: ["hypertension", "high blood pressure"],
    keywords: ["bp", "blood pressure"],
    description: "Client has hypertension",
    restrictions: [
      "Avoid heavy lifting with breath holding (Valsalva maneuver)",
      "Avoid inverted positions",
      "Limit sodium intake",
    ],
    recommendations: [
      "Focus on moderate-intensity aerobic exercise",
      "Include stress management techniques",
      "Monitor blood pressure regularly",
      "Ensure medication compliance",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: false,
  },
  {
    id: "diabetes_uncontrolled",
    name: "Uncontrolled Diabetes",
    category: "metabolic",
    severity: "high",
    conditions: ["diabetes", "type 1 diabetes", "type 2 diabetes"],
    keywords: ["diabetic", "blood sugar", "insulin", "a1c"],
    description: "Client has diabetes requiring careful management",
    restrictions: [
      "Avoid exercise when blood glucose is above 250 mg/dL with ketones",
      "Avoid exercise when blood glucose is below 100 mg/dL without carb intake",
      "Monitor blood sugar before, during, and after exercise",
    ],
    recommendations: [
      "Have fast-acting glucose readily available",
      "Schedule exercise consistently",
      "Adjust carb intake around workouts",
      "Regular HbA1c monitoring",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: false,
  },
  {
    id: "recent_surgery",
    name: "Recent Surgery",
    category: "musculoskeletal",
    severity: "high",
    conditions: ["surgery", "operation"],
    keywords: ["surgical", "post-op", "recovery"],
    description: "Client has had recent surgery",
    restrictions: [
      "No exercise affecting surgical area without medical clearance",
      "Follow surgeon's specific activity restrictions",
      "Avoid heavy lifting until cleared",
    ],
    recommendations: [
      "Obtain written clearance from surgeon",
      "Start with gentle mobility work",
      "Progress slowly based on healing",
      "Watch for signs of complications",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: true,
  },
  {
    id: "pregnancy",
    name: "Pregnancy",
    category: "general",
    severity: "high",
    conditions: ["pregnant", "pregnancy"],
    keywords: ["expecting", "prenatal"],
    description: "Client is pregnant",
    restrictions: [
      "Avoid lying flat on back after first trimester",
      "Avoid contact sports and high fall risk activities",
      "Avoid overheating",
      "Avoid exercises that increase abdominal pressure excessively",
    ],
    recommendations: [
      "Obtain OB/GYN clearance",
      "Focus on prenatal-safe exercises",
      "Maintain moderate intensity (talk test)",
      "Stay hydrated",
      "Monitor for warning signs",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: true,
  },
  {
    id: "eating_disorder",
    name: "Eating Disorder History",
    category: "mental_health",
    severity: "high",
    conditions: [
      "anorexia",
      "bulimia",
      "eating disorder",
      "binge eating",
      "orthorexia",
    ],
    keywords: ["ed", "disordered eating"],
    description: "Client has history of eating disorders",
    restrictions: [
      "Avoid strict calorie counting approaches",
      "Avoid extreme restriction diets",
      "Do not use weight as primary progress metric",
    ],
    recommendations: [
      "Use flexible, intuitive eating approaches",
      "Focus on performance and energy metrics",
      "Coordinate with mental health professional",
      "Monitor for relapse signs",
      "Emphasize nourishment over restriction",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: false,
  },
  {
    id: "thyroid_disorder",
    name: "Thyroid Disorder",
    category: "hormonal",
    severity: "medium",
    conditions: ["hypothyroidism", "hyperthyroidism", "thyroid"],
    keywords: ["hashimoto", "graves"],
    description: "Client has thyroid condition",
    restrictions: [],
    recommendations: [
      "Ensure thyroid medication is optimized",
      "Monitor energy levels closely",
      "Adjust expectations for metabolic changes",
      "Regular thyroid function testing",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "pcos",
    name: "PCOS",
    category: "hormonal",
    severity: "medium",
    conditions: ["pcos", "polycystic ovary syndrome"],
    keywords: ["polycystic"],
    description: "Client has PCOS",
    restrictions: [],
    recommendations: [
      "Focus on insulin sensitivity improvement",
      "Include resistance training",
      "Consider low glycemic dietary approaches",
      "Monitor for related metabolic markers",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "asthma",
    name: "Asthma",
    category: "respiratory",
    severity: "medium",
    conditions: ["asthma"],
    keywords: ["inhaler", "bronchial"],
    description: "Client has asthma",
    restrictions: [
      "Avoid exercise in extreme cold or polluted conditions",
    ],
    recommendations: [
      "Have rescue inhaler available during exercise",
      "Proper warm-up before intense activity",
      "Consider pre-exercise bronchodilator if prescribed",
      "Monitor for exercise-induced symptoms",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "joint_injury",
    name: "Joint Injury/Arthritis",
    category: "musculoskeletal",
    severity: "medium",
    conditions: ["arthritis", "joint pain", "knee injury", "back injury", "shoulder injury"],
    keywords: ["tendonitis", "bursitis", "disc", "herniated"],
    description: "Client has joint issues or injuries",
    restrictions: [
      "Avoid exercises that aggravate affected joints",
      "Modify range of motion as needed",
    ],
    recommendations: [
      "Include joint-friendly exercise modifications",
      "Prioritize proper form",
      "Include mobility and flexibility work",
      "Consider physiotherapy coordination",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
];

/**
 * Blood Value Risk Rules (reference ranges may vary by lab)
 */
export const BLOOD_VALUE_RULES: BloodValueRule[] = [
  {
    id: "glucose_fasting",
    name: "Fasting Glucose",
    category: "metabolic",
    severity: "high",
    marker: "fasting_glucose",
    unit: "mg/dL",
    criticalLow: 50,
    warningLow: 70,
    warningHigh: 100,
    criticalHigh: 126,
    description: "Abnormal fasting glucose levels",
    restrictions: [],
    recommendations: [
      "Consider diabetes screening if elevated",
      "Monitor blood sugar around exercise",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: false,
  },
  {
    id: "hba1c",
    name: "HbA1c",
    category: "metabolic",
    severity: "high",
    marker: "hba1c",
    unit: "%",
    warningHigh: 5.7,
    criticalHigh: 6.5,
    description: "Elevated HbA1c indicating diabetes or prediabetes",
    restrictions: [],
    recommendations: [
      "Diabetes management if >6.5%",
      "Lifestyle intervention for prediabetes",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: false,
  },
  {
    id: "cholesterol_total",
    name: "Total Cholesterol",
    category: "cardiovascular",
    severity: "medium",
    marker: "total_cholesterol",
    unit: "mg/dL",
    warningHigh: 200,
    criticalHigh: 240,
    description: "Elevated total cholesterol",
    restrictions: [],
    recommendations: [
      "Include cardiovascular exercise",
      "Dietary modifications",
      "Consider statin therapy discussion",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "ldl",
    name: "LDL Cholesterol",
    category: "cardiovascular",
    severity: "medium",
    marker: "ldl",
    unit: "mg/dL",
    warningHigh: 100,
    criticalHigh: 160,
    description: "Elevated LDL cholesterol",
    restrictions: [],
    recommendations: [
      "Reduce saturated fat intake",
      "Increase soluble fiber",
      "Regular cardiovascular exercise",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "tsh",
    name: "TSH",
    category: "hormonal",
    severity: "medium",
    marker: "tsh",
    unit: "mIU/L",
    criticalLow: 0.1,
    warningLow: 0.4,
    warningHigh: 4.0,
    criticalHigh: 10.0,
    description: "Abnormal thyroid function",
    restrictions: [],
    recommendations: [
      "Thyroid medication optimization",
      "Adjust training intensity based on symptoms",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "hemoglobin",
    name: "Hemoglobin",
    category: "nutritional",
    severity: "high",
    marker: "hemoglobin",
    unit: "g/dL",
    criticalLow: 8,
    warningLow: 12,
    description: "Low hemoglobin indicating anemia",
    restrictions: [
      "Avoid high-intensity exercise if severely anemic",
    ],
    recommendations: [
      "Iron supplementation if deficient",
      "Investigate cause of anemia",
      "Monitor fatigue levels",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: false,
  },
  {
    id: "vitamin_d",
    name: "Vitamin D",
    category: "nutritional",
    severity: "low",
    marker: "vitamin_d",
    unit: "ng/mL",
    criticalLow: 10,
    warningLow: 30,
    description: "Low vitamin D levels",
    restrictions: [],
    recommendations: [
      "Vitamin D supplementation",
      "Sun exposure (safely)",
      "Retest after 3 months of supplementation",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "creatinine",
    name: "Creatinine",
    category: "general",
    severity: "high",
    marker: "creatinine",
    unit: "mg/dL",
    warningHigh: 1.2,
    criticalHigh: 2.0,
    description: "Elevated creatinine indicating kidney issues",
    restrictions: [
      "Limit protein intake if advised by nephrologist",
      "Avoid nephrotoxic supplements",
    ],
    recommendations: [
      "Nephrology consultation",
      "Monitor kidney function regularly",
      "Stay well hydrated",
    ],
    requiresAcknowledgment: true,
    requiresMedicalClearance: true,
  },
];

/**
 * Lifestyle Risk Rules
 */
export const LIFESTYLE_RULES: LifestyleRule[] = [
  {
    id: "heavy_smoking",
    name: "Heavy Smoking",
    category: "respiratory",
    severity: "high",
    factor: "smoking_status",
    threshold: "heavy",
    comparison: "equals",
    description: "Client is a heavy smoker",
    restrictions: [],
    recommendations: [
      "Smoking cessation support",
      "Gradual increase in cardiovascular training",
      "Monitor respiratory symptoms",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "heavy_alcohol",
    name: "Heavy Alcohol Consumption",
    category: "nutritional",
    severity: "medium",
    factor: "alcohol_frequency",
    threshold: "daily",
    comparison: "equals",
    description: "Client consumes alcohol daily",
    restrictions: [],
    recommendations: [
      "Discuss alcohol reduction strategies",
      "Account for alcohol calories",
      "Monitor liver function if concerned",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "sedentary",
    name: "Highly Sedentary",
    category: "general",
    severity: "low",
    factor: "activity_level",
    threshold: "sedentary",
    comparison: "equals",
    description: "Client has sedentary lifestyle",
    restrictions: [],
    recommendations: [
      "Gradual introduction to exercise",
      "Start with walking and basic movements",
      "Increase NEAT (Non-Exercise Activity Thermogenesis)",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "high_stress",
    name: "High Stress",
    category: "mental_health",
    severity: "medium",
    factor: "stress_level",
    threshold: 8,
    comparison: "greater_than",
    description: "Client reports high stress levels",
    restrictions: [],
    recommendations: [
      "Include stress management in program",
      "Consider yoga or meditation",
      "Monitor for overtraining",
      "Prioritize sleep quality",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "poor_sleep",
    name: "Poor Sleep",
    category: "general",
    severity: "medium",
    factor: "sleep_hours",
    threshold: 6,
    comparison: "less_than",
    description: "Client reports insufficient sleep",
    restrictions: [],
    recommendations: [
      "Address sleep hygiene",
      "Limit evening caffeine",
      "Consider training timing impact on sleep",
      "Monitor recovery closely",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
];

/**
 * Age-related risk rules
 */
export const AGE_RULES: RiskRule[] = [
  {
    id: "over_50",
    name: "Client Over 50",
    category: "general",
    severity: "low",
    description: "Client is over 50 years old",
    restrictions: [],
    recommendations: [
      "Include proper warm-up and cool-down",
      "Focus on joint health and mobility",
      "Consider cardiovascular screening if sedentary",
      "Balance training for fall prevention",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: false,
  },
  {
    id: "over_65",
    name: "Client Over 65",
    category: "general",
    severity: "medium",
    description: "Client is over 65 years old",
    restrictions: [
      "Avoid rapid changes in position",
    ],
    recommendations: [
      "Medical clearance for new exercise program",
      "Focus on functional fitness",
      "Include balance and coordination work",
      "Monitor blood pressure response to exercise",
    ],
    requiresAcknowledgment: false,
    requiresMedicalClearance: true,
  },
];
