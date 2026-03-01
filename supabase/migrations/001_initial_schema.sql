-- ============================================================================
-- Strenx Fitness - Migration 001: Initial Schema
-- Core tables: Extensions, Enums, Tenants, Users, Coaches, Clients
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('super_admin', 'coach', 'client');

-- Gender options
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Experience levels
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');

-- Diet preference
CREATE TYPE diet_preference AS ENUM ('vegetarian', 'eggetarian', 'non_vegetarian', 'vegan');

-- Frequency types
CREATE TYPE frequency_type AS ENUM ('never', 'rarely', 'occasionally', 'frequently', 'daily');

-- Quality ratings
CREATE TYPE quality_rating AS ENUM ('poor', 'fair', 'good', 'excellent');

-- Activity levels
CREATE TYPE activity_level AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'unpaid', 'paused');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Message status
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Risk severity
CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Consent types
CREATE TYPE consent_type AS ENUM ('data_processing', 'marketing', 'medical_data_sharing', 'photo_usage', 'terms_of_service');

-- Audit action types
CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'export', 'login', 'logout');

-- ============================================================================
-- TENANTS (Multi-tenancy foundation for future SaaS)
-- ============================================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',

    -- Subscription/billing at tenant level
    subscription_tier TEXT DEFAULT 'basic',
    max_coaches INTEGER DEFAULT 1,
    max_clients INTEGER DEFAULT 50,

    -- Compliance settings
    data_retention_days INTEGER DEFAULT 2555, -- ~7 years for medical
    require_mfa BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- Create default tenant for single-coach setup
INSERT INTO tenants (id, name, slug, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Strenx Fitness',
    'strenx',
    '{"branding": {"primary_color": "#2D2522", "secondary_color": "#8B7355"}}'
);

-- ============================================================================
-- USERS (Extends Supabase auth.users)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT
        DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Role-based access
    role user_role NOT NULL DEFAULT 'client',

    -- Profile
    email TEXT NOT NULL,
    phone TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,

    -- Age verification (DPDP requirement - 18+ only)
    date_of_birth DATE,
    age_verified BOOLEAN DEFAULT false,
    age_verified_at TIMESTAMPTZ,

    -- MFA settings
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_method TEXT, -- 'totp', 'sms'

    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,

    -- Metadata
    timezone TEXT DEFAULT 'Asia/Kolkata',
    locale TEXT DEFAULT 'en-IN',
    preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ, -- Soft delete for DPDP compliance

    -- Age constraint (18+ only)
    CONSTRAINT check_age_18_plus CHECK (
        date_of_birth IS NULL OR
        date_of_birth <= CURRENT_DATE - INTERVAL '18 years'
    )
);

-- ============================================================================
-- COACHES (Role-specific profile)
-- ============================================================================
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Professional info
    specializations TEXT[],
    certifications JSONB DEFAULT '[]',
    -- [{"name": "Certified Personal Trainer", "issuer": "ACE", "year": 2020}]
    bio TEXT,
    experience_years INTEGER,

    -- Capacity management
    max_active_clients INTEGER DEFAULT 30,
    accepting_clients BOOLEAN DEFAULT true,

    -- Settings
    working_hours JSONB DEFAULT '{}',
    -- {"mon": {"start": "09:00", "end": "18:00"}, ...}
    notification_preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLIENTS (Role-specific profile)
-- ============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Coach assignment
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,

    -- Onboarding status
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,

    -- Quick reference (denormalized for dashboard)
    current_weight_kg DECIMAL(5,2),
    target_weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),

    -- Status
    status TEXT DEFAULT 'active', -- active, paused, churned

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COACH-CLIENT RELATIONSHIP HISTORY (for audit)
-- ============================================================================
CREATE TABLE coach_client_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,

    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    reason TEXT
);

-- ============================================================================
-- USER SESSIONS (extends Supabase session management)
-- ============================================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,

    -- Location (for suspicious activity detection)
    country_code TEXT,
    city TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Coaches
CREATE INDEX idx_coaches_tenant ON coaches(tenant_id);
CREATE INDEX idx_coaches_user ON coaches(user_id);

-- Clients
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_coach ON clients(coach_id, tenant_id);
CREATE INDEX idx_clients_status ON clients(status) WHERE status = 'active';

-- Sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id) WHERE is_active = true;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================

-- Get current user's tenant_id from JWT claims
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID,
        '00000000-0000-0000-0000-000000000001'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = auth.uid();
    RETURN COALESCE(v_role, 'client');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is coach or super_admin
CREATE OR REPLACE FUNCTION is_coach()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT get_user_role()) IN ('coach', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT get_user_role()) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get coach_id for current user (if coach)
CREATE OR REPLACE FUNCTION get_coach_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM coaches
        WHERE user_id = auth.uid()
        AND tenant_id = (SELECT get_tenant_id())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get client_id for current user (if client)
CREATE OR REPLACE FUNCTION get_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM clients
        WHERE user_id = auth.uid()
        AND tenant_id = (SELECT get_tenant_id())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if coach has access to a specific client
CREATE OR REPLACE FUNCTION coach_has_client_access(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM clients
        WHERE id = p_client_id
        AND coach_id = (SELECT get_coach_id())
        AND tenant_id = (SELECT get_tenant_id())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- RLS POLICIES - TENANTS
-- ============================================================================

-- Only super_admin can see tenants
CREATE POLICY "tenants_select_admin" ON tenants
    FOR SELECT USING (is_super_admin());

-- ============================================================================
-- RLS POLICIES - USERS
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (
        auth.uid() = id
        AND tenant_id = get_tenant_id()
    );

-- Coaches can read their clients' profiles
CREATE POLICY "users_select_coach_clients" ON users
    FOR SELECT USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND id IN (
            SELECT user_id FROM clients
            WHERE coach_id = get_coach_id()
        )
    );

-- Super admin can read all users in tenant
CREATE POLICY "users_select_admin" ON users
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (
        auth.uid() = id
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - COACHES
-- ============================================================================

-- Coaches can read their own record
CREATE POLICY "coaches_select_own" ON coaches
    FOR SELECT USING (
        user_id = auth.uid()
        AND tenant_id = get_tenant_id()
    );

-- Super admin can read all coaches
CREATE POLICY "coaches_select_admin" ON coaches
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - CLIENTS
-- ============================================================================

-- Clients can read their own record
CREATE POLICY "clients_select_own" ON clients
    FOR SELECT USING (
        user_id = auth.uid()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can read their assigned clients
CREATE POLICY "clients_select_coach" ON clients
    FOR SELECT USING (
        is_coach()
        AND coach_id = get_coach_id()
        AND tenant_id = get_tenant_id()
    );

-- Super admin can read all clients
CREATE POLICY "clients_select_admin" ON clients
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can update their assigned clients
CREATE POLICY "clients_update_coach" ON clients
    FOR UPDATE USING (
        is_coach()
        AND coach_id = get_coach_id()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - SESSIONS
-- ============================================================================

-- Users can see their own sessions
CREATE POLICY "sessions_select_own" ON user_sessions
    FOR SELECT USING (
        user_id = auth.uid()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- AUTH TRIGGER - Create profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.users (
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        role
    )
    VALUES (
        NEW.id,
        '00000000-0000-0000-0000-000000000001',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'client'
    );

    -- Create client profile
    INSERT INTO public.clients (
        user_id,
        tenant_id
    )
    VALUES (
        NEW.id,
        '00000000-0000-0000-0000-000000000001'
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
