-- ============================================================================
-- Strenx Fitness - Migration 004: Messaging, Billing & Compliance
-- Conversations, messages, subscriptions, payments, risk flags, audit logs
-- ============================================================================

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Participants
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,

    -- Conversation metadata
    title TEXT, -- Optional custom title

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One conversation per client-coach pair
    CONSTRAINT unique_conversation UNIQUE (client_id, coach_id)
);

-- ============================================================================
-- MESSAGES
-- ============================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Sender
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role user_role NOT NULL, -- client, coach, super_admin

    -- Message content
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, image, file, system

    -- Attachments
    attachment_url TEXT,
    attachment_type TEXT, -- image, pdf, etc.
    attachment_name TEXT,

    -- Status
    status message_status DEFAULT 'sent',

    -- Metadata
    metadata JSONB DEFAULT '{}', -- For system messages, quick replies, etc.

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- ============================================================================
-- READ RECEIPTS
-- ============================================================================
CREATE TABLE read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Read timestamp
    read_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique per message per user
    CONSTRAINT unique_read_receipt UNIQUE (message_id, user_id)
);

-- ============================================================================
-- NOTIFICATION QUEUE
-- ============================================================================
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification type
    notification_type TEXT NOT NULL, -- message, checkin_reminder, plan_update, etc.

    -- Content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional data for the notification

    -- Delivery channels
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,

    -- Status
    push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMPTZ,
    push_error TEXT,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    email_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- PUSH SUBSCRIPTIONS (for Web Push)
-- ============================================================================
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Web Push subscription
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL, -- Public key
    auth TEXT NOT NULL, -- Auth secret

    -- Device info
    device_name TEXT,
    user_agent TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,

    -- Unique endpoint per user
    CONSTRAINT unique_push_endpoint UNIQUE (user_id, endpoint)
);

-- ============================================================================
-- SUBSCRIPTION PLANS (Available programs)
-- ============================================================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Plan details
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL, -- 30, 60, 90, 100

    -- Pricing (in paise for India)
    price_amount INTEGER NOT NULL, -- Amount in smallest currency unit
    currency TEXT DEFAULT 'INR',

    -- Branding
    branding_name TEXT, -- "30 Day Transformation", etc.
    branding_color TEXT, -- Hex color

    -- Features
    features TEXT[],
    includes_nutrition BOOLEAN DEFAULT true,
    includes_training BOOLEAN DEFAULT true,
    includes_messaging BOOLEAN DEFAULT true,
    daily_checkins_required BOOLEAN DEFAULT true,
    weekly_checkins_required BOOLEAN DEFAULT true,

    -- Status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (tenant_id, name, duration_days, price_amount, branding_name, features) VALUES
('00000000-0000-0000-0000-000000000001', '30 Day Kickstart', 30, 999900, '30 Day Transformation',
    ARRAY['Personalized nutrition plan', 'Custom training program', 'Daily check-ins', 'Direct messaging with coach']),
('00000000-0000-0000-0000-000000000001', '60 Day Program', 60, 1799900, '60 Day Body Recomp',
    ARRAY['Personalized nutrition plan', 'Custom training program', 'Daily check-ins', 'Weekly progress reviews', 'Direct messaging with coach']),
('00000000-0000-0000-0000-000000000001', '90 Day Transformation', 90, 2499900, '90 Day Complete Transformation',
    ARRAY['Comprehensive nutrition plan', 'Progressive training program', 'Daily check-ins', 'Weekly progress reviews', 'Bi-weekly plan adjustments', 'Priority support']),
('00000000-0000-0000-0000-000000000001', '100 Day Ultimate', 100, 2999900, '100 Day Ultimate Transformation',
    ARRAY['Premium nutrition coaching', 'Advanced training program', 'Daily check-ins', 'Weekly progress reviews', 'Bi-weekly plan adjustments', 'Priority support', 'Blood work analysis']);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Plan reference
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,

    -- Status
    status subscription_status DEFAULT 'active',

    -- Pricing at time of purchase
    amount_paid INTEGER,
    currency TEXT DEFAULT 'INR',

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Payment details
    amount INTEGER NOT NULL, -- In smallest currency unit
    currency TEXT DEFAULT 'INR',

    -- Payment method (manual tracking for now)
    payment_method TEXT, -- upi, bank_transfer, card, cash
    transaction_reference TEXT, -- UTR, transaction ID, etc.

    -- Status
    status payment_status DEFAULT 'pending',

    -- Dates
    payment_date DATE,
    due_date DATE,

    -- Notes
    notes TEXT,
    confirmed_by UUID REFERENCES coaches(id),
    confirmed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICES
-- ============================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Invoice number
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Amounts
    subtotal INTEGER NOT NULL,
    tax_amount INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',

    -- Tax details (GST for India)
    tax_rate DECIMAL(5,2) DEFAULT 18.00, -- 18% GST
    tax_number TEXT, -- GSTIN

    -- Line items
    line_items JSONB NOT NULL DEFAULT '[]',
    -- [{description, quantity, unit_price, amount}]

    -- Status
    status TEXT DEFAULT 'draft', -- draft, sent, paid, cancelled

    -- Payment reference
    payment_id UUID REFERENCES payments(id),

    -- Notes
    notes TEXT,

    -- PDF
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice number sequence
CREATE SEQUENCE invoice_number_seq START 1000;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================================================
-- RISK FLAGS
-- ============================================================================
CREATE TABLE risk_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Flag details
    flag_type TEXT NOT NULL, -- heart_disease, diabetes, hypertension, etc.
    severity risk_severity NOT NULL,

    -- Source
    source TEXT DEFAULT 'assessment', -- assessment, manual, blood_report
    source_id UUID, -- Reference to source record

    -- Details
    description TEXT,
    restrictions TEXT[], -- Activities to avoid
    recommendations TEXT[],

    -- Medical clearance
    requires_medical_clearance BOOLEAN DEFAULT false,
    medical_clearance_obtained BOOLEAN DEFAULT false,
    medical_clearance_date DATE,
    medical_clearance_notes TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES coaches(id),
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FLAG ACKNOWLEDGEMENTS (Coach acknowledgment of risk)
-- ============================================================================
CREATE TABLE flag_acknowledgements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID NOT NULL REFERENCES risk_flags(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,

    -- Acknowledgment
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    action_taken TEXT,
    notes TEXT,

    -- Status
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT false,

    -- Unique per flag per coach
    CONSTRAINT unique_flag_acknowledgement UNIQUE (flag_id, coach_id)
);

-- ============================================================================
-- ACCESS LOGS (Immutable audit log for sensitive data access)
-- ============================================================================
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Who accessed
    user_id UUID NOT NULL,
    user_role user_role NOT NULL,

    -- What was accessed
    resource_type TEXT NOT NULL, -- medical_data, blood_reports, progress_photos
    resource_id UUID,
    action audit_action NOT NULL,

    -- Context
    client_id UUID, -- Whose data was accessed
    ip_address INET,
    user_agent TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp (immutable)
    accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Make access_logs append-only
CREATE RULE access_logs_no_update AS ON UPDATE TO access_logs DO INSTEAD NOTHING;
CREATE RULE access_logs_no_delete AS ON DELETE TO access_logs DO INSTEAD NOTHING;

-- ============================================================================
-- AUDIT HISTORY (Track changes to sensitive data)
-- ============================================================================
CREATE TABLE audit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Table and record
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,

    -- Change details
    action audit_action NOT NULL,
    old_data JSONB, -- Previous state (for update/delete)
    new_data JSONB, -- New state (for insert/update)
    changed_fields TEXT[], -- List of changed field names

    -- Who made the change
    changed_by UUID NOT NULL,
    changed_by_role user_role,

    -- Timestamp (immutable)
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Make audit_history append-only
CREATE RULE audit_history_no_update AS ON UPDATE TO audit_history DO INSTEAD NOTHING;
CREATE RULE audit_history_no_delete AS ON DELETE TO audit_history DO INSTEAD NOTHING;

-- ============================================================================
-- DATA DELETION REQUESTS (DPDP Right to Erasure)
-- ============================================================================
CREATE TABLE data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Requester
    user_id UUID NOT NULL REFERENCES users(id),
    requested_by_email TEXT NOT NULL,

    -- Request details
    request_type TEXT NOT NULL, -- full_deletion, data_export, specific_data
    reason TEXT,

    -- Verification
    verification_code TEXT,
    verified_at TIMESTAMPTZ,

    -- Processing
    status TEXT DEFAULT 'pending', -- pending, verified, processing, completed, rejected
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    completion_notes TEXT,

    -- Data export (if requested)
    export_url TEXT,
    export_expires_at TIMESTAMPTZ,

    -- Legal hold (prevents deletion)
    legal_hold BOOLEAN DEFAULT false,
    legal_hold_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- DPDP requirement: 30 day processing deadline
    deadline_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '30 days') STORED
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Conversations
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_coach ON conversations(coach_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, status)
    WHERE status = 'sent' OR status = 'delivered';

-- Read receipts
CREATE INDEX idx_read_receipts_message ON read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON read_receipts(user_id);

-- Notification queue
CREATE INDEX idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_pending ON notification_queue(processed_at)
    WHERE processed_at IS NULL;
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for)
    WHERE processed_at IS NULL;

-- Push subscriptions
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id)
    WHERE is_active = true;

-- Subscriptions
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status)
    WHERE status = 'active';
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date)
    WHERE status = 'active';

-- Payments
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status)
    WHERE status = 'pending';

-- Invoices
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Risk flags
CREATE INDEX idx_risk_flags_client ON risk_flags(client_id);
CREATE INDEX idx_risk_flags_active ON risk_flags(client_id, is_active)
    WHERE is_active = true;
CREATE INDEX idx_risk_flags_severity ON risk_flags(severity)
    WHERE is_active = true;

-- Flag acknowledgements
CREATE INDEX idx_flag_acknowledgements_flag ON flag_acknowledgements(flag_id);
CREATE INDEX idx_flag_acknowledgements_coach ON flag_acknowledgements(coach_id);

-- Access logs
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_client ON access_logs(client_id);
CREATE INDEX idx_access_logs_resource ON access_logs(resource_type, resource_id);
CREATE INDEX idx_access_logs_time ON access_logs(accessed_at DESC);

-- Audit history
CREATE INDEX idx_audit_history_table ON audit_history(table_name, record_id);
CREATE INDEX idx_audit_history_user ON audit_history(changed_by);
CREATE INDEX idx_audit_history_time ON audit_history(changed_at DESC);

-- Deletion requests
CREATE INDEX idx_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON data_deletion_requests(status)
    WHERE status NOT IN ('completed', 'rejected');
CREATE INDEX idx_deletion_requests_deadline ON data_deletion_requests(deadline_at)
    WHERE status NOT IN ('completed', 'rejected');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - CONVERSATIONS
-- ============================================================================

-- Clients can see their own conversations
CREATE POLICY "conversations_client" ON conversations
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can see their clients' conversations
CREATE POLICY "conversations_coach" ON conversations
    FOR ALL USING (
        is_coach()
        AND coach_id = get_coach_id()
        AND tenant_id = get_tenant_id()
    );

-- Super admin can see all
CREATE POLICY "conversations_admin" ON conversations
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - MESSAGES
-- ============================================================================

-- Users can see messages in their conversations
CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations
            WHERE (client_id = get_client_id() OR coach_id = get_coach_id())
        )
    );

-- Users can send messages to their conversations
CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND conversation_id IN (
            SELECT id FROM conversations
            WHERE (client_id = get_client_id() OR coach_id = get_coach_id())
        )
    );

-- Users can soft-delete their own messages
CREATE POLICY "messages_update" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid()
    );

-- ============================================================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================================================

-- Users can see their own notifications
CREATE POLICY "notifications_select" ON notification_queue
    FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - PUSH SUBSCRIPTIONS
-- ============================================================================

-- Users can manage their own push subscriptions
CREATE POLICY "push_subscriptions_own" ON push_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - SUBSCRIPTION PLANS
-- ============================================================================

-- Everyone can view active plans
CREATE POLICY "subscription_plans_select" ON subscription_plans
    FOR SELECT USING (
        is_active = true
        AND tenant_id = get_tenant_id()
    );

-- Coaches can manage plans
CREATE POLICY "subscription_plans_manage" ON subscription_plans
    FOR ALL USING (
        is_coach()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - SUBSCRIPTIONS
-- ============================================================================

-- Clients can view their own subscriptions
CREATE POLICY "subscriptions_client" ON subscriptions
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can manage their clients' subscriptions
CREATE POLICY "subscriptions_coach" ON subscriptions
    FOR ALL USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- Super admin can see all
CREATE POLICY "subscriptions_admin" ON subscriptions
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - PAYMENTS
-- ============================================================================

-- Clients can view their own payments
CREATE POLICY "payments_client" ON payments
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can manage their clients' payments
CREATE POLICY "payments_coach" ON payments
    FOR ALL USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- ============================================================================
-- RLS POLICIES - INVOICES
-- ============================================================================

-- Clients can view their own invoices
CREATE POLICY "invoices_client" ON invoices
    FOR SELECT USING (
        client_id = get_client_id()
        AND tenant_id = get_tenant_id()
    );

-- Coaches can manage invoices
CREATE POLICY "invoices_coach" ON invoices
    FOR ALL USING (
        is_coach()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - RISK FLAGS
-- ============================================================================

-- Coaches can manage risk flags for their clients
CREATE POLICY "risk_flags_coach" ON risk_flags
    FOR ALL USING (
        is_coach()
        AND tenant_id = get_tenant_id()
        AND client_id IN (
            SELECT id FROM clients WHERE coach_id = get_coach_id()
        )
    );

-- Super admin can see all risk flags
CREATE POLICY "risk_flags_admin" ON risk_flags
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- RLS POLICIES - FLAG ACKNOWLEDGEMENTS
-- ============================================================================

-- Coaches can manage acknowledgements for flags on their clients
CREATE POLICY "flag_ack_coach" ON flag_acknowledgements
    FOR ALL USING (
        coach_id = get_coach_id()
    );

-- ============================================================================
-- RLS POLICIES - ACCESS LOGS (Read-only for admins)
-- ============================================================================

-- Only super admin can view access logs
CREATE POLICY "access_logs_admin" ON access_logs
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- Service role can insert (via triggers/functions)
CREATE POLICY "access_logs_insert" ON access_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES - AUDIT HISTORY (Read-only for admins)
-- ============================================================================

-- Only super admin can view audit history
CREATE POLICY "audit_history_admin" ON audit_history
    FOR SELECT USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- Service role can insert (via triggers)
CREATE POLICY "audit_history_insert" ON audit_history
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES - DELETION REQUESTS
-- ============================================================================

-- Users can view their own deletion requests
CREATE POLICY "deletion_requests_own" ON data_deletion_requests
    FOR SELECT USING (user_id = auth.uid());

-- Users can create deletion requests
CREATE POLICY "deletion_requests_create" ON data_deletion_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Super admin can manage all deletion requests
CREATE POLICY "deletion_requests_admin" ON data_deletion_requests
    FOR ALL USING (
        is_super_admin()
        AND tenant_id = get_tenant_id()
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update conversation last_message when new message arrives
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Create conversation when client is assigned to coach
CREATE OR REPLACE FUNCTION create_client_conversation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coach_id IS NOT NULL AND (OLD.coach_id IS NULL OR OLD.coach_id != NEW.coach_id) THEN
        INSERT INTO conversations (tenant_id, client_id, coach_id)
        VALUES (NEW.tenant_id, NEW.id, NEW.coach_id)
        ON CONFLICT (client_id, coach_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_client_conversation
    AFTER UPDATE OF coach_id ON clients
    FOR EACH ROW EXECUTE FUNCTION create_client_conversation();

-- Log access to sensitive data
CREATE OR REPLACE FUNCTION log_medical_data_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO access_logs (tenant_id, user_id, user_role, resource_type, resource_id, action, client_id, metadata)
    SELECT
        NEW.tenant_id,
        auth.uid(),
        get_user_role(),
        TG_ARGV[0], -- resource_type passed as argument
        NEW.id,
        'read',
        NEW.client_id,
        jsonb_build_object('table', TG_TABLE_NAME);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamps
CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_risk_flags_updated_at
    BEFORE UPDATE ON risk_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_deletion_requests_updated_at
    BEFORE UPDATE ON data_deletion_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTIONS FOR COMPLIANCE
-- ============================================================================

-- Function to check if user can be deleted (DPDP compliance)
CREATE OR REPLACE FUNCTION can_delete_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_active_subscription BOOLEAN;
    v_has_pending_payments BOOLEAN;
    v_has_legal_hold BOOLEAN;
BEGIN
    -- Check for active subscription
    SELECT EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN clients c ON c.id = s.client_id
        WHERE c.user_id = p_user_id AND s.status = 'active'
    ) INTO v_has_active_subscription;

    -- Check for pending payments
    SELECT EXISTS (
        SELECT 1 FROM payments p
        JOIN clients c ON c.id = p.client_id
        WHERE c.user_id = p_user_id AND p.status = 'pending'
    ) INTO v_has_pending_payments;

    -- Check for legal hold
    SELECT EXISTS (
        SELECT 1 FROM data_deletion_requests
        WHERE user_id = p_user_id AND legal_hold = true
    ) INTO v_has_legal_hold;

    RETURN NOT (v_has_active_subscription OR v_has_pending_payments OR v_has_legal_hold);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate subscription days remaining
CREATE OR REPLACE FUNCTION get_subscription_days_remaining(p_client_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_days INTEGER;
BEGIN
    SELECT (end_date - CURRENT_DATE)::INTEGER INTO v_days
    FROM subscriptions
    WHERE client_id = p_client_id
        AND status = 'active'
        AND end_date >= CURRENT_DATE
    ORDER BY end_date DESC
    LIMIT 1;

    RETURN COALESCE(v_days, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if subscription is expiring soon
CREATE OR REPLACE FUNCTION is_subscription_expiring_soon(p_client_id UUID, p_days INTEGER DEFAULT 7)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_subscription_days_remaining(p_client_id) BETWEEN 1 AND p_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
