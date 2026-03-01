-- ============================================================================
-- Strenx Fitness - Migration 003: Plans & Tracking
-- Nutrition plans, training plans, check-ins, progress tracking
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Check if client has medical consent
-- ============================================================================
CREATE OR REPLACE FUNCTION client_has_medical_consent(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM consent_records cr
        JOIN clients c ON c.user_id = cr.user_id
        WHERE c.id = p_client_id
        AND cr.consent_type = 'medical_data_sharing'
        AND cr.consented = true
        AND cr.withdrawn_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- EXERCISE LIBRARY (Reference data)
-- ============================================================================
CREATE TABLE exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Exercise details
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- chest, back, shoulders, legs, arms, core, cardio
    equipment TEXT[], -- dumbbells, barbell, machine, bodyweight, cables
    muscle_groups TEXT[], -- primary muscles targeted

    -- Instructions
    description TEXT,
    form_cues TEXT[], -- Array of form tips
    video_url TEXT,

    -- Metadata
    difficulty experience_level DEFAULT 'intermediate',
    is_compound BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION PLANS
-- ============================================================================
CREATE TABLE nutrition_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_by UUID NOT NULL REFERENCES coaches(id),

    -- Plan metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Target macros (daily totals)
    target_calories INTEGER,
    target_protein_g INTEGER,
    target_carbs_g INTEGER,
    target_fat_g INTEGER,

    -- Plan settings
    diet_type diet_preference DEFAULT 'non_vegetarian',
    meal_count INTEGER DEFAULT 5, -- Number of meals per day

    -- Template flags
    is_template BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition plan versions (for tracking changes)
CREATE TABLE nutrition_plan_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,

    -- Version metadata
    change_notes TEXT,
    created_by UUID NOT NULL REFERENCES coaches(id),

    -- Snapshot of plan at this version
    plan_data JSONB NOT NULL, -- Full plan snapshot

    -- Status
    is_current BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one current version per plan
    CONSTRAINT unique_current_version UNIQUE (plan_id, is_current)
        DEFERRABLE INITIALLY DEFERRED
);

-- Meal templates within nutrition plan
CREATE TABLE nutrition_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_version_id UUID NOT NULL REFERENCES nutrition_plan_versions(id) ON DELETE CASCADE,

    -- Meal metadata
    meal_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    meal_name TEXT NOT NULL, -- Breakfast, Pre-Workout, etc.
    meal_time TEXT, -- Suggested time "7:00 AM"

    -- Meal macros
    calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fat_g INTEGER,

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food items within meals
CREATE TABLE meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES nutrition_meals(id) ON DELETE CASCADE,

    -- Food details
    food_name TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit TEXT NOT NULL, -- g, ml, cup, tbsp, piece, etc.

    -- Nutritional info
    calories INTEGER,
    protein_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    fiber_g DECIMAL(6,2),

    -- Alternatives
    alternatives TEXT[], -- Array of alternative foods

    -- Notes
    preparation_notes TEXT,

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRAINING PLANS
-- ============================================================================
CREATE TABLE training_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_by UUID NOT NULL REFERENCES coaches(id),

    -- Plan metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Plan structure
    days_per_week INTEGER DEFAULT 5,
    plan_type TEXT DEFAULT 'split', -- full_body, split, push_pull_legs, upper_lower

    -- Target
    goal TEXT, -- muscle_gain, fat_loss, strength, endurance
    experience_required experience_level DEFAULT 'intermediate',

    -- Template flags
    is_template BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training plan versions
CREATE TABLE training_plan_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,

    -- Version metadata
    change_notes TEXT,
    created_by UUID NOT NULL REFERENCES coaches(id),

    -- Snapshot of plan at this version
    plan_data JSONB NOT NULL,

    -- Status
    is_current BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one current version per plan
    CONSTRAINT unique_training_current_version UNIQUE (plan_id, is_current)
        DEFERRABLE INITIALLY DEFERRED
);

-- Training days within plan
CREATE TABLE training_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_version_id UUID NOT NULL REFERENCES training_plan_versions(id) ON DELETE CASCADE,

    -- Day metadata
    day_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    day_name TEXT NOT NULL, -- "Day 1 - Chest & Triceps", "Rest Day"
    focus_areas TEXT[], -- muscle groups

    -- Day type
    is_rest_day BOOLEAN DEFAULT false,
    is_cardio_day BOOLEAN DEFAULT false,

    -- Estimated duration
    duration_minutes INTEGER,

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within training days
CREATE TABLE training_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,

    -- Exercise details (can override library)
    exercise_name TEXT NOT NULL,

    -- Sets and reps
    sets INTEGER NOT NULL DEFAULT 3,
    reps TEXT NOT NULL, -- "8-12", "15", "AMRAP"

    -- Rest
    rest_seconds INTEGER DEFAULT 90,

    -- Weight guidance
    weight_type TEXT, -- percentage_1rm, rpe, fixed
    weight_value TEXT, -- "70%", "RPE 8", "25kg"

    -- Tempo
    tempo TEXT, -- "3-1-2-0" (eccentric-pause-concentric-pause)

    -- Notes
    coach_notes TEXT,
    form_cues TEXT[],

    -- Superset/circuit grouping
    group_id TEXT, -- For grouping exercises together
    group_type TEXT, -- superset, triset, circuit

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLIENT PLAN ASSIGNMENTS
-- ============================================================================
CREATE TABLE client_plan_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES coaches(id),

    -- Nutrition plan assignment
    nutrition_plan_version_id UUID REFERENCES nutrition_plan_versions(id),

    -- Training plan assignment
    training_plan_version_id UUID REFERENCES training_plan_versions(id),

    -- Assignment dates
    start_date DATE NOT NULL,
    end_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Notes
    assignment_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DAILY CHECK-INS
-- ============================================================================
CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Check-in date
    checkin_date DATE NOT NULL,

    -- Weight
    morning_weight_kg DECIMAL(5,2),

    -- Steps (manual entry)
    step_count INTEGER,

    -- Training
    training_completed BOOLEAN,
    training_day_id UUID REFERENCES training_days(id), -- Which day they did

    -- Energy and wellness
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    sleep_hours DECIMAL(3,1),
    sleep_quality quality_rating,

    -- Mood
    mood TEXT, -- great, good, okay, bad, terrible

    -- Notes
    client_notes TEXT,
    coach_notes TEXT,

    -- Status
    coach_reviewed BOOLEAN DEFAULT false,
    coach_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES coaches(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One check-in per day per client
    CONSTRAINT unique_daily_checkin UNIQUE (client_id, checkin_date)
);

-- Meal tracking within daily check-in
CREATE TABLE checkin_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID NOT NULL REFERENCES daily_checkins(id) ON DELETE CASCADE,

    -- Meal reference
    meal_number INTEGER NOT NULL, -- Which meal (1, 2, 3, etc.)
    meal_name TEXT,

    -- Photo (stored in Supabase storage)
    photo_url TEXT,
    photo_path TEXT, -- Storage path for deletion

    -- Compliance
    followed_plan BOOLEAN DEFAULT true,
    deviation_notes TEXT, -- What they ate differently

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training details within daily check-in
CREATE TABLE checkin_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID NOT NULL REFERENCES daily_checkins(id) ON DELETE CASCADE,

    -- Overall
    workout_duration_minutes INTEGER,

    -- Performance notes
    performance_notes TEXT,

    -- Exercise logs (optional detailed logging)
    exercise_logs JSONB, -- [{exercise_name, sets_completed, reps_achieved, weight_used}]

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROGRESS PHOTOS
-- ============================================================================
CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Photo date
    photo_date DATE NOT NULL,

    -- Photo type
    photo_type TEXT NOT NULL, -- front, side, back

    -- Storage (encrypted path for DPDP)
    photo_path_encrypted BYTEA, -- Encrypted storage path
    thumbnail_path_encrypted BYTEA,
    encryption_key_id TEXT NOT NULL DEFAULT 'photos_key_v1',

    -- Metadata
    notes TEXT,

    -- Weekly check-in reference
    weekly_checkin_id UUID, -- Will be linked to weekly_checkins table

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BODY MEASUREMENTS
-- ============================================================================
CREATE TABLE measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Measurement date
    measurement_date DATE NOT NULL,

    -- Body measurements (in cm)
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hips_cm DECIMAL(5,2),
    left_arm_cm DECIMAL(5,2),
    right_arm_cm DECIMAL(5,2),
    left_thigh_cm DECIMAL(5,2),
    right_thigh_cm DECIMAL(5,2),
    left_calf_cm DECIMAL(5,2),
    right_calf_cm DECIMAL(5,2),
    shoulders_cm DECIMAL(5,2),
    neck_cm DECIMAL(5,2),

    -- Additional
    body_fat_percentage DECIMAL(4,1),

    -- Notes
    notes TEXT,

    -- Weekly check-in reference
    weekly_checkin_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One measurement per date per client
    CONSTRAINT unique_measurement_date UNIQUE (client_id, measurement_date)
);

-- ============================================================================
-- WEIGHT LOGS (Extracted from daily check-ins for easy querying)
-- ============================================================================
CREATE TABLE weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Weight data
    log_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,

    -- Source
    source TEXT DEFAULT 'daily_checkin', -- daily_checkin, manual
    checkin_id UUID REFERENCES daily_checkins(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One weight per day
    CONSTRAINT unique_weight_date UNIQUE (client_id, log_date)
);

-- ============================================================================
-- WEEKLY CHECK-INS
-- ============================================================================
CREATE TABLE weekly_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Week reference
    week_start_date DATE NOT NULL,
    week_number INTEGER, -- Week number in program

    -- Progress photos (linked via progress_photos table)

    -- Weekly reflection
    weekly_summary TEXT,
    challenges TEXT,
    wins TEXT,

    -- Questions for coach
    questions_for_coach TEXT,

    -- Compliance summary (calculated)
    nutrition_compliance_percent INTEGER,
    training_compliance_percent INTEGER,
    checkin_compliance_percent INTEGER,

    -- Coach review
    coach_notes TEXT,
    coach_reviewed BOOLEAN DEFAULT false,
    coach_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES coaches(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One weekly check-in per week per client
    CONSTRAINT unique_weekly_checkin UNIQUE (client_id, week_start_date)
);

-- ============================================================================
-- BLOOD REPORT LOGS (Historical tracking, encrypted)
-- ============================================================================
CREATE TABLE blood_report_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Report date
    report_date DATE NOT NULL,
    lab_name TEXT,

    -- Encrypted values (same structure as assess_blood_reports)
    values_encrypted BYTEA NOT NULL,
    encryption_key_id TEXT NOT NULL DEFAULT 'blood_key_v1',

    -- Quick reference flags (not encrypted for alerts)
    has_abnormal_values BOOLEAN DEFAULT false,
    abnormal_markers TEXT[], -- Which markers are abnormal

    -- Document
    report_file_path TEXT, -- PDF upload path

    -- Notes
    notes TEXT,
    coach_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Exercise library
CREATE INDEX idx_exercise_library_tenant ON exercise_library(tenant_id);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);

-- Nutrition plans
CREATE INDEX idx_nutrition_plans_tenant ON nutrition_plans(tenant_id);
CREATE INDEX idx_nutrition_plans_coach ON nutrition_plans(created_by);

-- Training plans
CREATE INDEX idx_training_plans_tenant ON training_plans(tenant_id);
CREATE INDEX idx_training_plans_coach ON training_plans(created_by);

-- Client assignments
CREATE INDEX idx_plan_assignments_client ON client_plan_assignments(client_id);
CREATE INDEX idx_plan_assignments_active ON client_plan_assignments(client_id, is_active) WHERE is_active = true;

-- Daily check-ins
CREATE INDEX idx_daily_checkins_client ON daily_checkins(client_id);
CREATE INDEX idx_daily_checkins_date ON daily_checkins(client_id, checkin_date DESC);
CREATE INDEX idx_daily_checkins_unreviewed ON daily_checkins(tenant_id, coach_reviewed)
    WHERE coach_reviewed = false;

-- Progress photos
CREATE INDEX idx_progress_photos_client ON progress_photos(client_id);
CREATE INDEX idx_progress_photos_date ON progress_photos(client_id, photo_date DESC);

-- Measurements
CREATE INDEX idx_measurements_client ON measurements(client_id);
CREATE INDEX idx_measurements_date ON measurements(client_id, measurement_date DESC);

-- Weight logs
CREATE INDEX idx_weight_logs_client ON weight_logs(client_id);
CREATE INDEX idx_weight_logs_date ON weight_logs(client_id, log_date DESC);

-- Weekly check-ins
CREATE INDEX idx_weekly_checkins_client ON weekly_checkins(client_id);
CREATE INDEX idx_weekly_checkins_date ON weekly_checkins(client_id, week_start_date DESC);

-- Blood reports
CREATE INDEX idx_blood_report_logs_client ON blood_report_logs(client_id);
CREATE INDEX idx_blood_report_logs_date ON blood_report_logs(client_id, report_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_plan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_report_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - EXERCISE LIBRARY
-- ============================================================================

-- Everyone in tenant can view exercises
CREATE POLICY "exercise_library_select_tenant" ON exercise_library
    FOR SELECT USING (tenant_id = get_tenant_id());

-- Only coaches can manage exercises
CREATE POLICY "exercise_library_insert_coach" ON exercise_library
    FOR INSERT WITH CHECK (is_coach() AND tenant_id = get_tenant_id());

CREATE POLICY "exercise_library_update_coach" ON exercise_library
    FOR UPDATE USING (is_coach() AND tenant_id = get_tenant_id());

-- ============================================================================
-- RLS POLICIES - NUTRITION PLANS
-- ============================================================================

-- Coaches can see all plans in tenant
CREATE POLICY "nutrition_plans_select_coach" ON nutrition_plans
    FOR SELECT USING (is_coach() AND tenant_id = get_tenant_id());

-- Clients can see plans assigned to them
CREATE POLICY "nutrition_plans_select_client" ON nutrition_plans
    FOR SELECT USING (
        tenant_id = get_tenant_id()
        AND nutrition_plans.id IN (
            SELECT np.id FROM nutrition_plans np
            JOIN nutrition_plan_versions npv ON npv.plan_id = np.id
            JOIN client_plan_assignments cpa ON cpa.nutrition_plan_version_id = npv.id
            WHERE cpa.client_id = get_client_id() AND cpa.is_active = true
        )
    );

-- Only coaches can create/update plans
CREATE POLICY "nutrition_plans_insert_coach" ON nutrition_plans
    FOR INSERT WITH CHECK (is_coach() AND tenant_id = get_tenant_id());

CREATE POLICY "nutrition_plans_update_coach" ON nutrition_plans
    FOR UPDATE USING (is_coach() AND tenant_id = get_tenant_id());

-- ============================================================================
-- RLS POLICIES - TRAINING PLANS
-- ============================================================================

-- Coaches can see all plans in tenant
CREATE POLICY "training_plans_select_coach" ON training_plans
    FOR SELECT USING (is_coach() AND tenant_id = get_tenant_id());

-- Clients can see plans assigned to them
CREATE POLICY "training_plans_select_client" ON training_plans
    FOR SELECT USING (
        tenant_id = get_tenant_id()
        AND training_plans.id IN (
            SELECT tp.id FROM training_plans tp
            JOIN training_plan_versions tpv ON tpv.plan_id = tp.id
            JOIN client_plan_assignments cpa ON cpa.training_plan_version_id = tpv.id
            WHERE cpa.client_id = get_client_id() AND cpa.is_active = true
        )
    );

-- Only coaches can create/update plans
CREATE POLICY "training_plans_insert_coach" ON training_plans
    FOR INSERT WITH CHECK (is_coach() AND tenant_id = get_tenant_id());

CREATE POLICY "training_plans_update_coach" ON training_plans
    FOR UPDATE USING (is_coach() AND tenant_id = get_tenant_id());

-- ============================================================================
-- RLS POLICIES - CLIENT PLAN ASSIGNMENTS
-- ============================================================================

-- Coaches can see all assignments for their clients
CREATE POLICY "plan_assignments_select_coach" ON client_plan_assignments
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- Clients can see their own assignments
CREATE POLICY "plan_assignments_select_client" ON client_plan_assignments
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Super admin can see all
CREATE POLICY "plan_assignments_select_admin" ON client_plan_assignments
    FOR SELECT USING (is_super_admin() AND tenant_id = get_tenant_id());

-- Only coaches can manage assignments
CREATE POLICY "plan_assignments_insert_coach" ON client_plan_assignments
    FOR INSERT WITH CHECK (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - DAILY CHECK-INS
-- ============================================================================

-- Clients can see and create their own check-ins
CREATE POLICY "daily_checkins_select_client" ON daily_checkins
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "daily_checkins_insert_client" ON daily_checkins
    FOR INSERT WITH CHECK (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

CREATE POLICY "daily_checkins_update_client" ON daily_checkins
    FOR UPDATE USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can see and update their clients' check-ins
CREATE POLICY "daily_checkins_select_coach" ON daily_checkins
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

CREATE POLICY "daily_checkins_update_coach" ON daily_checkins
    FOR UPDATE USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- Super admin can see all
CREATE POLICY "daily_checkins_select_admin" ON daily_checkins
    FOR SELECT USING (is_super_admin() AND tenant_id = get_tenant_id());

-- ============================================================================
-- RLS POLICIES - CHECKIN MEALS
-- ============================================================================

-- Clients can manage their own meal check-ins
CREATE POLICY "checkin_meals_client" ON checkin_meals
    FOR ALL USING (
        checkin_id IN (
            SELECT id FROM daily_checkins
            WHERE client_id = get_client_id()
        )
    );

-- Coaches can view their clients' meal check-ins
CREATE POLICY "checkin_meals_coach" ON checkin_meals
    FOR SELECT USING (
        is_coach()
        AND checkin_id IN (
            SELECT id FROM daily_checkins dc
            JOIN clients c ON c.id = dc.client_id
            WHERE c.coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - PROGRESS PHOTOS
-- ============================================================================

-- Clients can manage their own photos
CREATE POLICY "progress_photos_client" ON progress_photos
    FOR ALL USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can view their clients' photos
CREATE POLICY "progress_photos_coach" ON progress_photos
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - MEASUREMENTS
-- ============================================================================

-- Clients can manage their own measurements
CREATE POLICY "measurements_client" ON measurements
    FOR ALL USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can view their clients' measurements
CREATE POLICY "measurements_coach" ON measurements
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - WEIGHT LOGS
-- ============================================================================

-- Clients can see their own weight logs
CREATE POLICY "weight_logs_client" ON weight_logs
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can see their clients' weight logs
CREATE POLICY "weight_logs_coach" ON weight_logs
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - WEEKLY CHECK-INS
-- ============================================================================

-- Clients can manage their own weekly check-ins
CREATE POLICY "weekly_checkins_client" ON weekly_checkins
    FOR ALL USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can view and update their clients' weekly check-ins
CREATE POLICY "weekly_checkins_select_coach" ON weekly_checkins
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

CREATE POLICY "weekly_checkins_update_coach" ON weekly_checkins
    FOR UPDATE USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - BLOOD REPORT LOGS (requires consent)
-- ============================================================================

-- Clients can manage their own blood reports
CREATE POLICY "blood_report_logs_client" ON blood_report_logs
    FOR ALL USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can view if consent exists (using function from migration 002)
CREATE POLICY "blood_report_logs_coach" ON blood_report_logs
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
        AND client_has_medical_consent(client_id)
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create weight log from daily check-in
CREATE OR REPLACE FUNCTION create_weight_log_from_checkin()
RETURNS TRIGGER AS $$
BEGIN
    -- Only if weight was provided
    IF NEW.morning_weight_kg IS NOT NULL THEN
        INSERT INTO weight_logs (tenant_id, client_id, log_date, weight_kg, source, checkin_id)
        VALUES (NEW.tenant_id, NEW.client_id, NEW.checkin_date, NEW.morning_weight_kg, 'daily_checkin', NEW.id)
        ON CONFLICT (client_id, log_date)
        DO UPDATE SET
            weight_kg = EXCLUDED.weight_kg,
            checkin_id = EXCLUDED.checkin_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_weight_log
    AFTER INSERT OR UPDATE OF morning_weight_kg ON daily_checkins
    FOR EACH ROW EXECUTE FUNCTION create_weight_log_from_checkin();

-- Update client's current weight when weight log is inserted
CREATE OR REPLACE FUNCTION update_client_weight()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients
    SET current_weight_kg = NEW.weight_kg,
        updated_at = NOW()
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_client_weight
    AFTER INSERT ON weight_logs
    FOR EACH ROW EXECUTE FUNCTION update_client_weight();

-- Update timestamps
CREATE TRIGGER set_nutrition_plans_updated_at
    BEFORE UPDATE ON nutrition_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_training_plans_updated_at
    BEFORE UPDATE ON training_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_plan_assignments_updated_at
    BEFORE UPDATE ON client_plan_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_weekly_checkins_updated_at
    BEFORE UPDATE ON weekly_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
