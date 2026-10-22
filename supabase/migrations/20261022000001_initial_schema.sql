-- ProcureSense Cloud: Comprehensive PostgreSQL Database Schema
-- Migration: 20261022000001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. Organizations (Multi-Tenant Workspaces)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    default_currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    fiscal_year_start INTEGER DEFAULT 1 NOT NULL CHECK (fiscal_year_start BETWEEN 1 AND 12),
    budget_alert_thresholds JSONB DEFAULT '{"warning": 80, "critical": 90, "overrun": 100}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 2. User Profiles & Workspace Membership
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'analyst' NOT NULL CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. Spend Categories
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_categories_org_name UNIQUE (organization_id, name)
);

-- ====================================================================
-- 4. Departments
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    cost_center VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_departments_org_name UNIQUE (organization_id, name)
);

-- ====================================================================
-- 5. Suppliers
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    country VARCHAR(10) DEFAULT 'US',
    category_tag VARCHAR(150),
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    tax_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'preferred', 'under_review')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_suppliers_org_name UNIQUE (organization_id, name)
);

-- ====================================================================
-- 6. Import Batches (Audit Log of Uploads)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    total_records INTEGER DEFAULT 0 NOT NULL,
    successful_records INTEGER DEFAULT 0 NOT NULL,
    failed_records INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed', 'partially_completed')),
    error_summary JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 7. Procurement Transactions / Purchase Orders
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.procurement_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    department_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(12, 2) DEFAULT 1.00 NOT NULL,
    unit_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid' NOT NULL CHECK (payment_status IN ('paid', 'pending', 'overdue', 'cancelled')),
    delivery_status VARCHAR(50) DEFAULT 'delivered' NOT NULL CHECK (delivery_status IN ('delivered', 'in_transit', 'pending', 'delayed', 'cancelled')),
    contract_ref VARCHAR(100),
    invoice_ref VARCHAR(100),
    notes TEXT,
    import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_transactions_org_po UNIQUE (organization_id, po_number)
);

-- ====================================================================
-- 8. Budgets
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    period_type VARCHAR(50) DEFAULT 'annual' CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
    period_value VARCHAR(50) DEFAULT 'FY' NOT NULL,
    department_name VARCHAR(150),
    category_name VARCHAR(150),
    allocated_amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_budget_org_period_target UNIQUE (organization_id, fiscal_year, period_type, period_value, department_name, category_name)
);

-- ====================================================================
-- 9. Audit Logs
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- Indexes for High-Performance Cloud Querying & Analytics
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON public.procurement_transactions(organization_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_org_supplier ON public.procurement_transactions(organization_id, supplier_name);
CREATE INDEX IF NOT EXISTS idx_transactions_org_category ON public.procurement_transactions(organization_id, category_name);
CREATE INDEX IF NOT EXISTS idx_transactions_org_dept ON public.procurement_transactions(organization_id, department_name);
CREATE INDEX IF NOT EXISTS idx_transactions_po ON public.procurement_transactions(organization_id, po_number);
CREATE INDEX IF NOT EXISTS idx_budgets_org_fy ON public.budgets(organization_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_name ON public.suppliers(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
