-- ============================================================================
-- Strenx Fitness - Migration 008: Transformation Plans
-- Unified personalized transformation plan documents for clients
-- ============================================================================

-- ============================================================================
-- TRANSFORMATION PLANS (Main table)
-- ============================================================================
CREATE TABLE transformation_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES coaches(id),

    -- Plan metadata
    plan_name TEXT NOT NULL DEFAULT 'Transformation Plan',
    phase TEXT,
    duration_weeks INTEGER DEFAULT 4,

    -- References to existing plans (optional)
    nutrition_plan_version_id UUID REFERENCES nutrition_plan_versions(id),
    training_plan_version_id UUID REFERENCES training_plan_versions(id),
    assessment_id UUID REFERENCES client_assessments(id),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRANSFORMATION PLAN VERSIONS
-- ============================================================================
CREATE TABLE transformation_plan_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES transformation_plans(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    change_notes TEXT,
    created_by UUID NOT NULL REFERENCES coaches(id),
    plan_snapshot JSONB NOT NULL,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_tp_current_version UNIQUE (plan_id, is_current)
        DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- TRANSFORMATION PLAN SECTIONS
-- ============================================================================
CREATE TABLE transformation_plan_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES transformation_plans(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN (
        'header', 'blood_report_strategy', 'daily_macros', 'meal_timing',
        'morning_drinks', 'bedtime_drink', 'meal_plan', 'snack_ideas',
        'supplements', 'training_program', 'progression_strategy',
        'recovery_rules', 'checkin_protocol', 'coach_credentials', 'custom'
    )),
    title TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUPPLEMENT LIBRARY
-- ============================================================================
CREATE TABLE supplement_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    default_dosage TEXT,
    default_timing TEXT,
    benefits TEXT[],
    target_deficiencies TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DRINK RECIPES LIBRARY
-- ============================================================================
CREATE TABLE drink_recipes_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    drink_type TEXT CHECK (drink_type IN ('morning', 'bedtime', 'pre_workout', 'post_workout', 'other')),
    ingredients JSONB NOT NULL DEFAULT '[]',
    preparation TEXT,
    benefits TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_transformation_plans_client ON transformation_plans(client_id);
CREATE INDEX idx_transformation_plans_coach ON transformation_plans(created_by);
CREATE INDEX idx_transformation_plans_status ON transformation_plans(client_id, status) WHERE status = 'published';
CREATE INDEX idx_tp_versions_plan ON transformation_plan_versions(plan_id);
CREATE INDEX idx_tp_sections_plan ON transformation_plan_sections(plan_id);
CREATE INDEX idx_supplement_library_category ON supplement_library(category);
CREATE INDEX idx_drink_recipes_type ON drink_recipes_library(drink_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE transformation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_recipes_library ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - TRANSFORMATION PLANS
-- ============================================================================

-- Coaches can view transformation plans for their clients
CREATE POLICY "tp_select_coach" ON transformation_plans
    FOR SELECT USING (
        is_coach()
        AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
    );

-- Clients can view their own published plans
CREATE POLICY "tp_select_client" ON transformation_plans
    FOR SELECT USING (
        client_id = get_client_id()
        AND status = 'published'
    );

-- Admin can view all
CREATE POLICY "tp_select_admin" ON transformation_plans
    FOR SELECT USING (is_admin());

-- Coaches can create plans for their clients
CREATE POLICY "tp_insert_coach" ON transformation_plans
    FOR INSERT WITH CHECK (
        is_coach()
        AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
    );

-- Coaches can update their clients' plans
CREATE POLICY "tp_update_coach" ON transformation_plans
    FOR UPDATE USING (
        is_coach()
        AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
    );

-- Coaches can delete their clients' plans
CREATE POLICY "tp_delete_coach" ON transformation_plans
    FOR DELETE USING (
        is_coach()
        AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
    );

-- ============================================================================
-- RLS POLICIES - VERSIONS
-- ============================================================================
CREATE POLICY "tp_versions_select_coach" ON transformation_plan_versions
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM transformation_plans
            WHERE is_coach()
            AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
        )
    );

CREATE POLICY "tp_versions_select_client" ON transformation_plan_versions
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM transformation_plans
            WHERE client_id = get_client_id() AND status = 'published'
        )
    );

CREATE POLICY "tp_versions_insert_coach" ON transformation_plan_versions
    FOR INSERT WITH CHECK (
        plan_id IN (
            SELECT id FROM transformation_plans
            WHERE is_coach()
            AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
        )
    );

-- ============================================================================
-- RLS POLICIES - SECTIONS
-- ============================================================================
CREATE POLICY "tp_sections_coach" ON transformation_plan_sections
    FOR ALL USING (
        plan_id IN (
            SELECT id FROM transformation_plans
            WHERE is_coach()
            AND client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id())
        )
    );

CREATE POLICY "tp_sections_select_client" ON transformation_plan_sections
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM transformation_plans
            WHERE client_id = get_client_id() AND status = 'published'
        )
        AND is_visible = true
    );

-- ============================================================================
-- RLS POLICIES - LIBRARIES (accessible by all coaches)
-- ============================================================================
CREATE POLICY "supplement_library_select" ON supplement_library
    FOR SELECT USING (is_coach() OR is_admin());

CREATE POLICY "supplement_library_manage" ON supplement_library
    FOR ALL USING (is_coach() OR is_admin());

CREATE POLICY "drink_recipes_select" ON drink_recipes_library
    FOR SELECT USING (is_coach() OR is_admin());

CREATE POLICY "drink_recipes_manage" ON drink_recipes_library
    FOR ALL USING (is_coach() OR is_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER set_transformation_plans_updated_at
    BEFORE UPDATE ON transformation_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_transformation_plan_sections_updated_at
    BEFORE UPDATE ON transformation_plan_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_supplement_library_updated_at
    BEFORE UPDATE ON supplement_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION get_client_transformation_plan(p_client_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM transformation_plans
        WHERE client_id = p_client_id
        AND status = 'published'
        ORDER BY published_at DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Common supplements
-- ============================================================================
INSERT INTO supplement_library (name, category, default_dosage, default_timing, benefits, target_deficiencies) VALUES
('Vitamin D3', 'vitamin', '60,000 IU weekly', 'Morning with fat', ARRAY['Bone health', 'Immune function', 'Mood support'], ARRAY['vitamin_d']),
('Vitamin B12', 'vitamin', '1500 mcg daily', 'Morning sublingual', ARRAY['Energy', 'Nerve function', 'Red blood cell production'], ARRAY['vitamin_b12']),
('Magnesium Glycinate', 'mineral', '400 mg', 'Before bed', ARRAY['Sleep quality', 'Muscle recovery', 'Stress reduction'], ARRAY['magnesium']),
('Creatine Monohydrate', 'performance', '5 g daily', 'Post workout', ARRAY['Strength', 'Muscle mass', 'Performance'], NULL),
('Whey Protein Isolate', 'protein', '25-30 g', 'Post workout or between meals', ARRAY['Muscle recovery', 'Protein intake', 'Convenience'], NULL),
('Omega-3 Fish Oil', 'health', '1000-2000 mg', 'With meals', ARRAY['Heart health', 'Brain function', 'Inflammation'], NULL),
('Iron', 'mineral', 'As prescribed', 'Empty stomach with Vitamin C', ARRAY['Energy', 'Oxygen transport', 'Fatigue reduction'], ARRAY['iron']),
('Zinc', 'mineral', '15-30 mg', 'With meals', ARRAY['Immune function', 'Testosterone support', 'Wound healing'], ARRAY['zinc']);

-- ============================================================================
-- SEED DATA: Common drink recipes
-- ============================================================================
INSERT INTO drink_recipes_library (name, drink_type, ingredients, preparation, benefits) VALUES
('Jeera Water', 'morning', '[{"name": "Cumin seeds", "quantity": "1", "unit": "tsp"}, {"name": "Water", "quantity": "250", "unit": "ml"}]', 'Soak cumin seeds overnight. Strain and drink on empty stomach.', ARRAY['Improves digestion', 'Boosts metabolism', 'Reduces bloating']),
('Methi Water', 'morning', '[{"name": "Fenugreek seeds", "quantity": "1", "unit": "tsp"}, {"name": "Water", "quantity": "250", "unit": "ml"}]', 'Soak fenugreek seeds overnight. Strain and drink on empty stomach.', ARRAY['Blood sugar control', 'Digestive health', 'Weight management']),
('Dalchini Water', 'morning', '[{"name": "Cinnamon stick", "quantity": "1", "unit": "piece"}, {"name": "Water", "quantity": "250", "unit": "ml"}]', 'Boil cinnamon stick in water. Let it cool and drink.', ARRAY['Blood sugar control', 'Anti-inflammatory', 'Antioxidant']),
('Ajwain Water', 'morning', '[{"name": "Carom seeds", "quantity": "1", "unit": "tsp"}, {"name": "Water", "quantity": "250", "unit": "ml"}]', 'Soak carom seeds overnight or boil for 5 minutes. Strain and drink.', ARRAY['Digestive aid', 'Reduces acidity', 'Boosts metabolism']),
('Chia Water', 'morning', '[{"name": "Chia seeds", "quantity": "1", "unit": "tbsp"}, {"name": "Water", "quantity": "300", "unit": "ml"}, {"name": "Lemon juice", "quantity": "1", "unit": "tbsp"}]', 'Soak chia seeds in water for 10 minutes. Add lemon and drink.', ARRAY['Hydration', 'Fiber', 'Omega-3']),
('Golden Milk', 'bedtime', '[{"name": "Almond milk", "quantity": "200", "unit": "ml"}, {"name": "Turmeric powder", "quantity": "0.5", "unit": "tsp"}, {"name": "Black pepper", "quantity": "1", "unit": "pinch"}]', 'Warm the almond milk. Add turmeric and black pepper. Stir well.', ARRAY['Sleep quality', 'Anti-inflammatory', 'Recovery support']);
