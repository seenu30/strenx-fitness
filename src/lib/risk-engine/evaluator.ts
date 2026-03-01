/**
 * Risk Engine Evaluator
 *
 * Evaluates client assessment data and generates risk flags based on
 * medical conditions, blood values, lifestyle factors, and age.
 */

import {
  RiskSeverity,
  RiskRule,
  MEDICAL_CONDITION_RULES,
  BLOOD_VALUE_RULES,
  LIFESTYLE_RULES,
  AGE_RULES,
} from "./rules";

export interface RiskFlag {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: RiskSeverity;
  description: string;
  restrictions: string[];
  recommendations: string[];
  requiresAcknowledgment: boolean;
  requiresMedicalClearance: boolean;
  triggeredBy: string; // What triggered this flag
  triggeredAt: Date;
}

export interface AssessmentData {
  // Personal info
  dateOfBirth?: string;
  age?: number;

  // Medical conditions (can be array or comma-separated string)
  medicalConditions?: string[] | string;
  surgeries?: string[] | string;
  medications?: string[] | string;

  // Blood values
  bloodValues?: Record<string, number>;

  // Lifestyle
  smokingStatus?: string;
  alcoholFrequency?: string;
  activityLevel?: string;
  stressLevel?: number;
  sleepHours?: number;

  // Additional context
  pregnancyStatus?: boolean;
  recentSurgeryDate?: string;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Normalize conditions to array of lowercase strings
 */
function normalizeConditions(conditions: string[] | string | undefined): string[] {
  if (!conditions) return [];
  if (Array.isArray(conditions)) {
    return conditions.map((c) => c.toLowerCase().trim());
  }
  return conditions
    .split(/[,;]/)
    .map((c) => c.toLowerCase().trim())
    .filter((c) => c.length > 0);
}

/**
 * Check if any condition matches any keyword
 */
function matchesCondition(
  conditions: string[],
  ruleConditions: string[],
  ruleKeywords: string[]
): { matches: boolean; matchedTerm: string } {
  for (const condition of conditions) {
    // Check direct condition matches
    for (const ruleCondition of ruleConditions) {
      if (condition.includes(ruleCondition)) {
        return { matches: true, matchedTerm: condition };
      }
    }
    // Check keyword matches
    for (const keyword of ruleKeywords) {
      if (condition.includes(keyword)) {
        return { matches: true, matchedTerm: condition };
      }
    }
  }
  return { matches: false, matchedTerm: "" };
}

/**
 * Evaluate medical conditions against rules
 */
function evaluateMedicalConditions(data: AssessmentData): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const conditions = [
    ...normalizeConditions(data.medicalConditions),
    ...normalizeConditions(data.surgeries),
    ...normalizeConditions(data.medications),
  ];

  if (conditions.length === 0) return flags;

  for (const rule of MEDICAL_CONDITION_RULES) {
    const match = matchesCondition(conditions, rule.conditions, rule.keywords);
    if (match.matches) {
      flags.push(createFlag(rule, `Medical condition: ${match.matchedTerm}`));
    }
  }

  // Check for recent surgery (within 6 months)
  if (data.recentSurgeryDate) {
    const surgeryDate = new Date(data.recentSurgeryDate);
    const monthsSinceSurgery =
      (new Date().getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceSurgery < 6) {
      const surgeryRule = MEDICAL_CONDITION_RULES.find((r) => r.id === "recent_surgery");
      if (surgeryRule) {
        flags.push(
          createFlag(surgeryRule, `Surgery within ${Math.round(monthsSinceSurgery)} months`)
        );
      }
    }
  }

  // Check pregnancy status
  if (data.pregnancyStatus) {
    const pregnancyRule = MEDICAL_CONDITION_RULES.find((r) => r.id === "pregnancy");
    if (pregnancyRule) {
      flags.push(createFlag(pregnancyRule, "Client is pregnant"));
    }
  }

  return flags;
}

/**
 * Evaluate blood values against rules
 */
function evaluateBloodValues(data: AssessmentData): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (!data.bloodValues) return flags;

  for (const rule of BLOOD_VALUE_RULES) {
    const value = data.bloodValues[rule.marker];
    if (value === undefined || value === null) continue;

    let triggered = false;
    let triggerReason = "";

    // Check critical low
    if (rule.criticalLow !== undefined && value < rule.criticalLow) {
      triggered = true;
      triggerReason = `${rule.name}: ${value} ${rule.unit} (critically low, below ${rule.criticalLow})`;
    }
    // Check warning low
    else if (rule.warningLow !== undefined && value < rule.warningLow) {
      triggered = true;
      triggerReason = `${rule.name}: ${value} ${rule.unit} (low, below ${rule.warningLow})`;
    }
    // Check critical high
    else if (rule.criticalHigh !== undefined && value > rule.criticalHigh) {
      triggered = true;
      triggerReason = `${rule.name}: ${value} ${rule.unit} (critically high, above ${rule.criticalHigh})`;
    }
    // Check warning high
    else if (rule.warningHigh !== undefined && value > rule.warningHigh) {
      triggered = true;
      triggerReason = `${rule.name}: ${value} ${rule.unit} (elevated, above ${rule.warningHigh})`;
    }

    if (triggered) {
      flags.push(createFlag(rule, triggerReason));
    }
  }

  return flags;
}

/**
 * Evaluate lifestyle factors against rules
 */
function evaluateLifestyle(data: AssessmentData): RiskFlag[] {
  const flags: RiskFlag[] = [];

  for (const rule of LIFESTYLE_RULES) {
    let value: string | number | undefined;

    switch (rule.factor) {
      case "smoking_status":
        value = data.smokingStatus;
        break;
      case "alcohol_frequency":
        value = data.alcoholFrequency;
        break;
      case "activity_level":
        value = data.activityLevel;
        break;
      case "stress_level":
        value = data.stressLevel;
        break;
      case "sleep_hours":
        value = data.sleepHours;
        break;
    }

    if (value === undefined || value === null) continue;

    let triggered = false;

    switch (rule.comparison) {
      case "equals":
        triggered = String(value).toLowerCase() === String(rule.threshold).toLowerCase();
        break;
      case "greater_than":
        triggered = Number(value) > Number(rule.threshold);
        break;
      case "less_than":
        triggered = Number(value) < Number(rule.threshold);
        break;
      case "contains":
        triggered = String(value).toLowerCase().includes(String(rule.threshold).toLowerCase());
        break;
    }

    if (triggered) {
      flags.push(createFlag(rule, `${rule.factor}: ${value}`));
    }
  }

  return flags;
}

/**
 * Evaluate age-related risks
 */
function evaluateAge(data: AssessmentData): RiskFlag[] {
  const flags: RiskFlag[] = [];

  let age = data.age;
  if (!age && data.dateOfBirth) {
    age = calculateAge(data.dateOfBirth);
  }

  if (!age) return flags;

  if (age >= 65) {
    const rule = AGE_RULES.find((r) => r.id === "over_65");
    if (rule) {
      flags.push(createFlag(rule, `Age: ${age} years`));
    }
  } else if (age >= 50) {
    const rule = AGE_RULES.find((r) => r.id === "over_50");
    if (rule) {
      flags.push(createFlag(rule, `Age: ${age} years`));
    }
  }

  return flags;
}

/**
 * Create a risk flag from a rule
 */
function createFlag(rule: RiskRule, triggeredBy: string): RiskFlag {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    category: rule.category,
    severity: rule.severity,
    description: rule.description,
    restrictions: [...rule.restrictions],
    recommendations: [...rule.recommendations],
    requiresAcknowledgment: rule.requiresAcknowledgment,
    requiresMedicalClearance: rule.requiresMedicalClearance,
    triggeredBy,
    triggeredAt: new Date(),
  };
}

/**
 * Main evaluation function - evaluates all risk factors
 */
export function evaluateRisks(data: AssessmentData): RiskFlag[] {
  const flags: RiskFlag[] = [
    ...evaluateMedicalConditions(data),
    ...evaluateBloodValues(data),
    ...evaluateLifestyle(data),
    ...evaluateAge(data),
  ];

  // Sort by severity (critical > high > medium > low)
  const severityOrder: Record<RiskSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return flags;
}

/**
 * Get summary of risk flags
 */
export function getRiskSummary(flags: RiskFlag[]): {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  requiresAcknowledgment: number;
  requiresMedicalClearance: number;
  categories: string[];
} {
  const summary = {
    total: flags.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    requiresAcknowledgment: 0,
    requiresMedicalClearance: 0,
    categories: [] as string[],
  };

  const categories = new Set<string>();

  for (const flag of flags) {
    summary[flag.severity]++;
    if (flag.requiresAcknowledgment) summary.requiresAcknowledgment++;
    if (flag.requiresMedicalClearance) summary.requiresMedicalClearance++;
    categories.add(flag.category);
  }

  summary.categories = Array.from(categories);

  return summary;
}

/**
 * Check if client can proceed with program
 */
export function canProceed(flags: RiskFlag[]): {
  canProceed: boolean;
  blockingFlags: RiskFlag[];
  reason: string;
} {
  const blockingFlags = flags.filter(
    (f) => f.requiresMedicalClearance && f.severity === "critical"
  );

  if (blockingFlags.length > 0) {
    return {
      canProceed: false,
      blockingFlags,
      reason:
        "Medical clearance required for critical conditions before program can begin",
    };
  }

  return {
    canProceed: true,
    blockingFlags: [],
    reason: "Client can proceed with appropriate precautions",
  };
}

/**
 * Get all restrictions from flags
 */
export function getAllRestrictions(flags: RiskFlag[]): string[] {
  const restrictions = new Set<string>();
  for (const flag of flags) {
    for (const restriction of flag.restrictions) {
      restrictions.add(restriction);
    }
  }
  return Array.from(restrictions);
}

/**
 * Get all recommendations from flags
 */
export function getAllRecommendations(flags: RiskFlag[]): string[] {
  const recommendations = new Set<string>();
  for (const flag of flags) {
    for (const recommendation of flag.recommendations) {
      recommendations.add(recommendation);
    }
  }
  return Array.from(recommendations);
}
