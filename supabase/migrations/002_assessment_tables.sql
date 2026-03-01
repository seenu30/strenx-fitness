-- ============================================================================
-- Strenx Fitness - Migration 002: Assessment Tables
-- Client onboarding assessment with 11 sections
-- ============================================================================

-- ============================================================================
-- CLIENT ASSESSMENTS (Parent Table)
-- ============================================================================
CREATE TABLE client_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Version tracking (for re-assessments)
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,

    -- Completion tracking
    sections_completed TEXT[] DEFAULT '{}',
    completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 1: Personal Information
-- ============================================================================
CREATE TABLE assess_personal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Personal details
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18),
    gender gender_type NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    current_weight_kg DECIMAL(5,2) NOT NULL,
    target_weight_kg DECIMAL(5,2),

    -- Calculated BMI
    bmi DECIMAL(4,2),

    -- Occupation & work
    occupation TEXT,
    work_type TEXT CHECK (work_type IN ('desk', 'field', 'mixed', 'remote', 'student')),
    work_timing_start TIME,
    work_timing_end TIME,

    -- Location
    city TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: Transformation Goals
-- ============================================================================
CREATE TABLE assess_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Goals (multi-select stored as array)
    primary_goals TEXT[] NOT NULL,
    -- ['fat_loss', 'muscle_gain', 'body_recomposition', 'strength', 'endurance',
    --  'rehabilitation', 'hormonal_health', 'skin_hair', 'general_wellness']
    secondary_goals TEXT[],

    -- Timeline & commitment
    goal_timeline TEXT, -- 'event', 'wedding', 'shoot', etc.
    goal_deadline DATE,
    commitment_level INTEGER CHECK (commitment_level BETWEEN 1 AND 10),
    weekly_hours_available DECIMAL(3,1),

    -- Additional context
    specific_targets JSONB,
    -- {"target_weight": 70, "target_body_fat": 15, "specific_event": "Wedding in March"}
    motivation TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: Training Background
-- ============================================================================
CREATE TABLE assess_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Experience
    experience_level experience_level NOT NULL,
    training_experience_months INTEGER,

    -- Current training
    current_training_styles TEXT[],
    -- ['weight_training', 'crossfit', 'home_workouts', 'yoga', 'cardio_only', 'not_training']
    current_frequency_per_week INTEGER,
    current_session_duration_mins INTEGER,

    -- Preferences
    preferred_training_time TEXT CHECK (preferred_training_time IN
        ('early_morning', 'morning', 'afternoon', 'evening', 'night', 'flexible')),
    preferred_training_location TEXT CHECK (preferred_training_location IN
        ('gym', 'home', 'outdoor', 'mixed')),
    equipment_available TEXT[],

    -- Injuries (non-medical, training-related)
    past_injuries JSONB DEFAULT '[]',
    -- [{"type": "knee", "details": "ACL tear", "year": 2020, "recovered": true}]
    current_limitations TEXT[],
    -- ['knee_pain', 'back_pain', 'shoulder_pain', 'ankle_pain', 'neck_pain']

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: Medical History (ENCRYPTED - DPDP Sensitive)
-- ============================================================================
CREATE TABLE assess_medical (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Medical conditions (encrypted JSONB)
    -- Raw data is encrypted using pgcrypto before storage
    conditions_encrypted BYTEA,

    -- Condition flags (boolean, for RLS/filtering without decryption)
    has_thyroid_condition BOOLEAN DEFAULT false,
    has_pcos BOOLEAN DEFAULT false,
    has_diabetes BOOLEAN DEFAULT false,
    has_blood_pressure BOOLEAN DEFAULT false,
    has_cholesterol BOOLEAN DEFAULT false,
    has_gut_issues BOOLEAN DEFAULT false,
    has_hormonal_issues BOOLEAN DEFAULT false,
    has_autoimmune BOOLEAN DEFAULT false,

    -- Other medical info (encrypted)
    surgeries_encrypted BYTEA,
    medications_encrypted BYTEA,
    allergies_encrypted BYTEA,

    -- Eating disorder history (sensitive)
    eating_disorder_history_encrypted BYTEA,
    has_eating_disorder_history BOOLEAN DEFAULT false, -- flag only

    -- Encryption metadata
    encryption_key_id TEXT NOT NULL DEFAULT 'medical_key_v1',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: Blood Reports (ENCRYPTED - DPDP Sensitive)
-- ============================================================================
CREATE TABLE assess_blood_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Report metadata
    report_date DATE NOT NULL,
    lab_name TEXT,
    has_report BOOLEAN DEFAULT false,

    -- All values stored encrypted
    -- Structure: {"cbc": {...}, "thyroid": {...}, "lipid": {...}, ...}
    report_values_encrypted BYTEA NOT NULL,

    -- Summary flags (for quick access without decryption)
    has_abnormal_values BOOLEAN DEFAULT false,
    abnormal_parameters TEXT[],

    -- File reference (if uploaded)
    report_file_path TEXT,

    -- Encryption metadata
    encryption_key_id TEXT NOT NULL DEFAULT 'medical_key_v1',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 6: Daily Lifestyle
-- ============================================================================
CREATE TABLE assess_lifestyle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Sleep
    typical_wake_time TIME,
    typical_sleep_time TIME,
    sleep_duration_hours DECIMAL(3,1),
    sleep_quality quality_rating,
    sleep_issues TEXT[],
    -- ['insomnia', 'apnea', 'restless', 'frequent_waking', 'none']

    -- Stress
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    stress_triggers TEXT[],
    -- ['work', 'family', 'financial', 'health', 'relationships', 'other']
    stress_management TEXT[],
    -- ['meditation', 'exercise', 'therapy', 'none', 'other']

    -- Activity
    daily_activity_level activity_level,
    daily_steps_estimate INTEGER,
    sedentary_hours_per_day DECIMAL(3,1),

    -- Screen time
    screen_time_hours DECIMAL(3,1),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: Current Diet & Habits
-- ============================================================================
CREATE TABLE assess_diet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Diet type
    diet_preference diet_preference NOT NULL,

    -- Meal patterns
    meals_per_day INTEGER,
    meal_pattern TEXT,
    -- 'regular', 'irregular', 'time_restricted', 'intermittent_fasting'
    typical_eating_window_start TIME,
    typical_eating_window_end TIME,

    -- Snacking
    snacks_per_day INTEGER,
    late_night_eating BOOLEAN DEFAULT false,

    -- Outside food
    outside_food_frequency frequency_type,
    common_outside_food TEXT[],

    -- Substances
    alcohol_frequency frequency_type,
    alcohol_types TEXT[],
    smoking_status TEXT CHECK (smoking_status IN ('never', 'former', 'current', 'social')),
    cigarettes_per_day INTEGER,

    -- Hydration
    water_intake_liters DECIMAL(3,1),
    other_beverages TEXT[],
    -- ['tea', 'coffee', 'soft_drinks', 'juices', 'energy_drinks']
    caffeine_cups_per_day INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 8: Food Preferences & Restrictions
-- ============================================================================
CREATE TABLE assess_food_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Preferences
    liked_foods TEXT[],
    disliked_foods TEXT[],

    -- Problematic foods (cause issues)
    problematic_foods JSONB DEFAULT '[]',
    -- [{"food": "dairy", "issue": "bloating"}, {"food": "gluten", "issue": "fatigue"}]

    -- Dietary restrictions
    restrictions TEXT[],
    -- ['gluten_free', 'lactose_free', 'nut_free', 'kosher', 'halal', 'jain']
    religious_restrictions TEXT,

    -- Cuisine preferences
    preferred_cuisines TEXT[],
    -- ['indian', 'chinese', 'continental', 'mediterranean', 'south_indian']
    cooking_ability TEXT CHECK (cooking_ability IN ('none', 'basic', 'intermediate', 'advanced')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 9: Supplements & Ergogenic Aids
-- ============================================================================
CREATE TABLE assess_supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Current supplements
    current_supplements JSONB DEFAULT '[]',
    -- [{"name": "Whey Protein", "brand": "ON", "dosage": "30g", "frequency": "daily"}]

    -- Past experience
    past_supplements JSONB DEFAULT '[]',
    -- [{"name": "Creatine", "experience": "positive", "notes": "good strength gains"}]

    -- Openness to supplements
    open_to_supplements BOOLEAN DEFAULT true,
    supplement_budget_inr INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 10: Skin, Hair & Recovery
-- ============================================================================
CREATE TABLE assess_skin_hair (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Skin concerns
    skin_type TEXT CHECK (skin_type IN ('dry', 'oily', 'combination', 'normal', 'sensitive')),
    skin_concerns TEXT[],
    -- ['acne', 'pigmentation', 'dryness', 'aging', 'sensitivity', 'none']

    -- Hair concerns
    hair_type TEXT CHECK (hair_type IN ('straight', 'wavy', 'curly', 'coily')),
    hair_concerns TEXT[],
    -- ['hair_fall', 'dandruff', 'thinning', 'premature_greying', 'dryness', 'none']

    -- Recovery
    recovery_concerns TEXT[],
    -- ['muscle_soreness', 'joint_pain', 'fatigue', 'slow_recovery', 'none']
    typical_recovery_time TEXT CHECK (typical_recovery_time IN
        ('less_than_24h', '24_48h', '48_72h', 'more_than_72h')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 11: Expectations & Coaching Alignment
-- ============================================================================
CREATE TABLE assess_expectations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES client_assessments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Expectations
    expectations TEXT,
    realistic_timeline_understood BOOLEAN DEFAULT false,

    -- Past challenges
    past_challenges TEXT,
    reasons_for_past_failures TEXT[],
    -- ['lack_motivation', 'lack_time', 'no_accountability', 'unrealistic_plans', 'other']

    -- Tracking willingness
    open_to_food_tracking BOOLEAN DEFAULT true,
    open_to_progress_photos BOOLEAN DEFAULT true,
    open_to_measurements BOOLEAN DEFAULT true,
    open_to_daily_checkins BOOLEAN DEFAULT true,

    -- Communication preferences
    preferred_check_in_time TEXT,
    preferred_response_time TEXT CHECK (preferred_response_time IN
        ('same_day', 'within_24h', 'within_48h', 'flexible')),

    -- Additional notes
    additional_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONSENT RECORDS (DPDP Compliance)
-- ============================================================================
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Consent type
    consent_type consent_type NOT NULL,

    -- Version of terms
    terms_version TEXT NOT NULL,

    -- Status
    consented BOOLEAN NOT NULL,

    -- Timestamps
    consented_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,

    -- Proof
    ip_address INET,
    user_agent TEXT,

    -- Legal text hash (for verification)
    consent_text_hash TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, consent_type, terms_version)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Assessments
CREATE INDEX idx_assessments_client ON client_assessments(client_id, tenant_id) WHERE is_current = true;

-- Assessment sections
CREATE INDEX idx_assess_personal_assessment ON assess_personal(assessment_id);
CREATE INDEX idx_assess_goals_assessment ON assess_goals(assessment_id);
CREATE INDEX idx_assess_training_assessment ON assess_training(assessment_id);
CREATE INDEX idx_assess_medical_assessment ON assess_medical(assessment_id);
CREATE INDEX idx_assess_blood_reports_assessment ON assess_blood_reports(assessment_id);
CREATE INDEX idx_assess_lifestyle_assessment ON assess_lifestyle(assessment_id);
CREATE INDEX idx_assess_diet_assessment ON assess_diet(assessment_id);
CREATE INDEX idx_assess_food_prefs_assessment ON assess_food_preferences(assessment_id);
CREATE INDEX idx_assess_supplements_assessment ON assess_supplements(assessment_id);
CREATE INDEX idx_assess_skin_hair_assessment ON assess_skin_hair(assessment_id);
CREATE INDEX idx_assess_expectations_assessment ON assess_expectations(assessment_id);

-- Consent
CREATE INDEX idx_consent_user_type ON consent_records(user_id, consent_type, tenant_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_medical ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_blood_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_lifestyle ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_diet ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_food_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_skin_hair ENABLE ROW LEVEL SECURITY;
ALTER TABLE assess_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - ASSESSMENTS
-- ============================================================================

-- Clients can read their own assessments
CREATE POLICY "assessments_select_own" ON client_assessments
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Clients can insert their own assessments
CREATE POLICY "assessments_insert_own" ON client_assessments
    FOR INSERT WITH CHECK (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Clients can update their own assessments
CREATE POLICY "assessments_update_own" ON client_assessments
    FOR UPDATE USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can read their clients' assessments
CREATE POLICY "assessments_select_coach" ON client_assessments
    FOR SELECT USING (
        is_coach()
        AND coach_has_client_access(client_id)
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - ASSESSMENT SECTIONS (Template pattern)
-- Apply similar policies to all assess_* tables
-- ============================================================================

-- assess_personal
CREATE POLICY "assess_personal_select_own" ON assess_personal
    FOR SELECT USING (
        assessment_id IN (
            SELECT id FROM client_assessments
            WHERE client_id = get_client_id()
        )
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "assess_personal_insert_own" ON assess_personal
    FOR INSERT WITH CHECK (
        assessment_id IN (
            SELECT id FROM client_assessments
            WHERE client_id = get_client_id()
        )
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "assess_personal_update_own" ON assess_personal
    FOR UPDATE USING (
        assessment_id IN (
            SELECT id FROM client_assessments
            WHERE client_id = get_client_id()
        )
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "assess_personal_select_coach" ON assess_personal
    FOR SELECT USING (
        is_coach()
        AND assessment_id IN (
            SELECT ca.id FROM client_assessments ca
            JOIN clients c ON ca.client_id = c.id
            WHERE c.coach_id = get_coach_id()
        )
        AND tenant_id = get_tenant_id()
    );

-- Apply same pattern to other assessment tables
-- (Abbreviated for brevity - in production, create all policies)

-- assess_goals
CREATE POLICY "assess_goals_select_own" ON assess_goals
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_goals_insert_own" ON assess_goals
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_goals_select_coach" ON assess_goals
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_training
CREATE POLICY "assess_training_select_own" ON assess_training
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_training_insert_own" ON assess_training
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_training_select_coach" ON assess_training
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_lifestyle
CREATE POLICY "assess_lifestyle_select_own" ON assess_lifestyle
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_lifestyle_insert_own" ON assess_lifestyle
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_lifestyle_select_coach" ON assess_lifestyle
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_diet
CREATE POLICY "assess_diet_select_own" ON assess_diet
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_diet_insert_own" ON assess_diet
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_diet_select_coach" ON assess_diet
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_food_preferences
CREATE POLICY "assess_food_prefs_select_own" ON assess_food_preferences
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_food_prefs_insert_own" ON assess_food_preferences
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_food_prefs_select_coach" ON assess_food_preferences
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_supplements
CREATE POLICY "assess_supplements_select_own" ON assess_supplements
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_supplements_insert_own" ON assess_supplements
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_supplements_select_coach" ON assess_supplements
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_skin_hair
CREATE POLICY "assess_skin_hair_select_own" ON assess_skin_hair
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_skin_hair_insert_own" ON assess_skin_hair
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_skin_hair_select_coach" ON assess_skin_hair
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- assess_expectations
CREATE POLICY "assess_expectations_select_own" ON assess_expectations
    FOR SELECT USING (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_expectations_insert_own" ON assess_expectations
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id()) AND tenant_id = get_tenant_id());
CREATE POLICY "assess_expectations_select_coach" ON assess_expectations
    FOR SELECT USING (is_coach() AND assessment_id IN (SELECT ca.id FROM client_assessments ca JOIN clients c ON ca.client_id = c.id WHERE c.coach_id = get_coach_id()) AND tenant_id = get_tenant_id());

-- ============================================================================
-- RLS POLICIES - MEDICAL DATA (Requires consent)
-- ============================================================================

CREATE POLICY "assess_medical_select_own" ON assess_medical
    FOR SELECT USING (
        assessment_id IN (
            SELECT id FROM client_assessments
            WHERE client_id = get_client_id()
        )
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "assess_medical_insert_own" ON assess_medical
    FOR INSERT WITH CHECK (
        assessment_id IN (
            SELECT id FROM client_assessments
            WHERE client_id = get_client_id()
        )
        AND tenant_id = get_tenant_id()
    );

-- Coaches can only access medical data if consent is given
CREATE POLICY "assess_medical_select_coach" ON assess_medical
    FOR SELECT USING (
        is_coach()
        AND assessment_id IN (
            SELECT ca.id FROM client_assessments ca
            JOIN clients c ON ca.client_id = c.id
            WHERE c.coach_id = get_coach_id()
        )
        AND tenant_id = get_tenant_id()
        -- Check consent
        AND EXISTS (
            SELECT 1 FROM consent_records cr
            JOIN client_assessments ca ON cr.user_id = (
                SELECT user_id FROM clients WHERE id = ca.client_id
            )
            WHERE ca.id = assess_medical.assessment_id
            AND cr.consent_type = 'medical_data_sharing'
            AND cr.consented = true
            AND cr.withdrawn_at IS NULL
        )
    );

-- Blood reports - same consent pattern
CREATE POLICY "assess_blood_select_own" ON assess_blood_reports
    FOR SELECT USING (
        assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id())
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "assess_blood_insert_own" ON assess_blood_reports
    FOR INSERT WITH CHECK (
        assessment_id IN (SELECT id FROM client_assessments WHERE client_id = get_client_id())
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "assess_blood_select_coach" ON assess_blood_reports
    FOR SELECT USING (
        is_coach()
        AND assessment_id IN (
            SELECT ca.id FROM client_assessments ca
            JOIN clients c ON ca.client_id = c.id
            WHERE c.coach_id = get_coach_id()
        )
        AND tenant_id = get_tenant_id()
        AND EXISTS (
            SELECT 1 FROM consent_records cr
            JOIN client_assessments ca ON cr.user_id = (
                SELECT user_id FROM clients WHERE id = ca.client_id
            )
            WHERE ca.id = assess_blood_reports.assessment_id
            AND cr.consent_type = 'medical_data_sharing'
            AND cr.consented = true
            AND cr.withdrawn_at IS NULL
        )
    );

-- ============================================================================
-- RLS POLICIES - CONSENT RECORDS
-- ============================================================================

CREATE POLICY "consent_select_own" ON consent_records
    FOR SELECT USING (
        user_id = auth.uid()
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "consent_insert_own" ON consent_records
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "consent_update_own" ON consent_records
    FOR UPDATE USING (
        user_id = auth.uid()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers for assessment tables
CREATE TRIGGER set_assessments_updated_at BEFORE UPDATE ON client_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_personal_updated_at BEFORE UPDATE ON assess_personal FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_goals_updated_at BEFORE UPDATE ON assess_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_training_updated_at BEFORE UPDATE ON assess_training FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_medical_updated_at BEFORE UPDATE ON assess_medical FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_blood_updated_at BEFORE UPDATE ON assess_blood_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_lifestyle_updated_at BEFORE UPDATE ON assess_lifestyle FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_diet_updated_at BEFORE UPDATE ON assess_diet FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_food_prefs_updated_at BEFORE UPDATE ON assess_food_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_supplements_updated_at BEFORE UPDATE ON assess_supplements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_skin_hair_updated_at BEFORE UPDATE ON assess_skin_hair FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_assess_expectations_updated_at BEFORE UPDATE ON assess_expectations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- BMI CALCULATION TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.height_cm IS NOT NULL AND NEW.current_weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
        NEW.bmi = ROUND((NEW.current_weight_kg / ((NEW.height_cm / 100.0) ^ 2))::NUMERIC, 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_bmi_trigger
    BEFORE INSERT OR UPDATE ON assess_personal
    FOR EACH ROW EXECUTE FUNCTION calculate_bmi();
