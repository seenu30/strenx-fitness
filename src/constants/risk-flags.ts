/**
 * Risk flag types and their severity configurations
 */
export const RISK_FLAG_TYPES = {
  // Medical conditions
  HEART_DISEASE: 'heart_disease',
  UNCONTROLLED_DIABETES: 'uncontrolled_diabetes',
  HYPERTENSION: 'hypertension',
  RECENT_SURGERY: 'recent_surgery',
  PREGNANCY: 'pregnancy',

  // Other conditions
  THYROID: 'thyroid',
  PCOS: 'pcos',
  EATING_DISORDER_HISTORY: 'eating_disorder_history',

  // BMI extremes
  BMI_EXTREME_LOW: 'bmi_extreme_low',
  BMI_EXTREME_HIGH: 'bmi_extreme_high',
} as const;

export type RiskFlagType = (typeof RISK_FLAG_TYPES)[keyof typeof RISK_FLAG_TYPES];

/**
 * Risk severity levels
 */
export const RISK_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RiskSeverity = (typeof RISK_SEVERITY)[keyof typeof RISK_SEVERITY];

/**
 * Risk flag configurations
 */
export const RISK_FLAG_CONFIG: Record<
  RiskFlagType,
  {
    severity: RiskSeverity;
    displayName: string;
    description: string;
    requiresMedicalClearance: boolean;
    restrictions: string[];
    recommendations: string[];
  }
> = {
  [RISK_FLAG_TYPES.HEART_DISEASE]: {
    severity: 'critical',
    displayName: 'Heart Disease',
    description: 'Client has a heart condition that requires special consideration.',
    requiresMedicalClearance: true,
    restrictions: ['high_intensity_cardio', 'heavy_lifting', 'hiit', 'extreme_exertion'],
    recommendations: [
      'Obtain medical clearance before starting program',
      'Start with low-intensity activities',
      'Monitor heart rate during exercise',
      'Avoid holding breath during lifts',
    ],
  },
  [RISK_FLAG_TYPES.UNCONTROLLED_DIABETES]: {
    severity: 'high',
    displayName: 'Uncontrolled Diabetes',
    description: 'Blood sugar levels need to be monitored carefully.',
    requiresMedicalClearance: true,
    restrictions: ['fasting_protocols', 'extreme_calorie_deficit'],
    recommendations: [
      'Monitor blood sugar before and after workouts',
      'Keep fast-acting carbs available',
      'Avoid very low carb diets without medical supervision',
      'Schedule meals around workouts',
    ],
  },
  [RISK_FLAG_TYPES.HYPERTENSION]: {
    severity: 'high',
    displayName: 'High Blood Pressure',
    description: 'Blood pressure needs to be considered in program design.',
    requiresMedicalClearance: true,
    restrictions: ['isometric_holds', 'valsalva_maneuver', 'heavy_overhead_lifts'],
    recommendations: [
      'Avoid holding breath during exercises',
      'Focus on controlled breathing',
      'Monitor blood pressure regularly',
      'Limit sodium in diet',
    ],
  },
  [RISK_FLAG_TYPES.RECENT_SURGERY]: {
    severity: 'critical',
    displayName: 'Recent Surgery',
    description: 'Client has had surgery within the last 3 months.',
    requiresMedicalClearance: true,
    restrictions: ['all_training'],
    recommendations: [
      'Wait for complete medical clearance',
      'Start with physical therapy if prescribed',
      'Gradual return to activity as approved',
    ],
  },
  [RISK_FLAG_TYPES.PREGNANCY]: {
    severity: 'critical',
    displayName: 'Pregnancy',
    description: 'Special prenatal considerations required.',
    requiresMedicalClearance: true,
    restrictions: ['high_impact', 'supine_exercises', 'contact_sports', 'overheating'],
    recommendations: [
      'Consult with OB-GYN before starting',
      'Modify exercises as pregnancy progresses',
      'Focus on pelvic floor and core stability',
      'Stay hydrated and avoid overheating',
    ],
  },
  [RISK_FLAG_TYPES.THYROID]: {
    severity: 'medium',
    displayName: 'Thyroid Condition',
    description: 'Thyroid may affect metabolism and energy levels.',
    requiresMedicalClearance: false,
    restrictions: [],
    recommendations: [
      'Monitor energy levels closely',
      'Adjust caloric intake based on thyroid medication',
      'Be patient with weight changes',
      'Regular thyroid panel checks',
    ],
  },
  [RISK_FLAG_TYPES.PCOS]: {
    severity: 'medium',
    displayName: 'PCOS',
    description: 'Hormonal considerations for nutrition and training.',
    requiresMedicalClearance: false,
    restrictions: [],
    recommendations: [
      'Focus on insulin sensitivity through exercise',
      'Consider lower glycemic index foods',
      'Strength training can help hormone balance',
      'Monitor stress levels',
    ],
  },
  [RISK_FLAG_TYPES.EATING_DISORDER_HISTORY]: {
    severity: 'critical',
    displayName: 'Eating Disorder History',
    description: 'Requires sensitive approach to nutrition coaching.',
    requiresMedicalClearance: true,
    restrictions: ['strict_calorie_counting', 'rigid_meal_plans', 'food_restriction'],
    recommendations: [
      'Focus on intuitive eating principles',
      'Avoid triggering language about food',
      'Consider involvement of mental health professional',
      'Flexible, non-restrictive approach only',
    ],
  },
  [RISK_FLAG_TYPES.BMI_EXTREME_LOW]: {
    severity: 'high',
    displayName: 'Severely Underweight',
    description: 'BMI below 16 indicates potential health risks.',
    requiresMedicalClearance: true,
    restrictions: ['calorie_deficit', 'excessive_cardio', 'intense_training'],
    recommendations: [
      'Focus on gradual weight gain',
      'Caloric surplus required',
      'Strength training to build muscle',
      'Medical supervision recommended',
    ],
  },
  [RISK_FLAG_TYPES.BMI_EXTREME_HIGH]: {
    severity: 'high',
    displayName: 'Class III Obesity',
    description: 'BMI above 40 requires modified approach.',
    requiresMedicalClearance: true,
    restrictions: ['high_impact_cardio', 'unsupported_compound_lifts', 'floor_exercises'],
    recommendations: [
      'Start with low-impact activities',
      'Focus on walking and water exercises',
      'Use machines for support',
      'Gradual progression of intensity',
    ],
  },
};

/**
 * Get risk flag configuration by type
 */
export function getRiskFlagConfig(type: RiskFlagType) {
  return RISK_FLAG_CONFIG[type];
}

/**
 * Get severity color class
 */
export function getSeverityColorClass(severity: RiskSeverity): string {
  const classes: Record<RiskSeverity, string> = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    critical: 'risk-critical',
  };
  return classes[severity];
}
