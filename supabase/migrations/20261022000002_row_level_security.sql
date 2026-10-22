-- ProcureSense Cloud: Row Level Security (RLS) & Tenant Isolation Policies
-- Migration: 20261022000002_row_level_security.sql

-- Helper function to retrieve the current authenticated user's organization_id
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ====================================================================
-- Enable RLS across all tables
-- ====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 1. Organizations Policies
-- ====================================================================
CREATE POLICY "Users can view their own organization"
    ON public.organizations FOR SELECT
    USING (id = public.current_user_organization_id());

CREATE POLICY "Admins can update their own organization"
    ON public.organizations FOR UPDATE
    USING (id = public.current_user_organization_id())
    WITH CHECK (id = public.current_user_organization_id());

-- ====================================================================
-- 2. Profiles Policies
-- ====================================================================
CREATE POLICY "Users can view profiles within their organization"
    ON public.profiles FOR SELECT
    USING (organization_id = public.current_user_organization_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ====================================================================
-- 3. Categories Policies
-- ====================================================================
CREATE POLICY "Users can view categories in their organization"
    ON public.categories FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert categories into their organization"
    ON public.categories FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can update categories in their organization"
    ON public.categories FOR UPDATE
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can delete categories in their organization"
    ON public.categories FOR DELETE
    USING (organization_id = public.current_user_organization_id());

-- ====================================================================
-- 4. Departments Policies
-- ====================================================================
CREATE POLICY "Users can view departments in their organization"
    ON public.departments FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert departments into their organization"
    ON public.departments FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can update departments in their organization"
    ON public.departments FOR UPDATE
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can delete departments in their organization"
    ON public.departments FOR DELETE
    USING (organization_id = public.current_user_organization_id());

-- ====================================================================
-- 5. Suppliers Policies
-- ====================================================================
CREATE POLICY "Users can view suppliers in their organization"
    ON public.suppliers FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert suppliers into their organization"
    ON public.suppliers FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can update suppliers in their organization"
    ON public.suppliers FOR UPDATE
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can delete suppliers in their organization"
    ON public.suppliers FOR DELETE
    USING (organization_id = public.current_user_organization_id());

-- ====================================================================
-- 6. Procurement Transactions Policies
-- ====================================================================
CREATE POLICY "Users can view transactions in their organization"
    ON public.procurement_transactions FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert transactions into their organization"
    ON public.procurement_transactions FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can update transactions in their organization"
    ON public.procurement_transactions FOR UPDATE
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can delete transactions in their organization"
    ON public.procurement_transactions FOR DELETE
    USING (organization_id = public.current_user_organization_id());

-- ====================================================================
-- 7. Budgets Policies
-- ====================================================================
CREATE POLICY "Users can view budgets in their organization"
    ON public.budgets FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert budgets into their organization"
    ON public.budgets FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can update budgets in their organization"
    ON public.budgets FOR UPDATE
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can delete budgets in their organization"
    ON public.budgets FOR DELETE
    USING (organization_id = public.current_user_organization_id());

-- ====================================================================
-- 8. Import Batches Policies
-- ====================================================================
CREATE POLICY "Users can view import batches in their organization"
    ON public.import_batches FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert import batches into their organization"
    ON public.import_batches FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());

-- ====================================================================
-- 9. Audit Logs Policies
-- ====================================================================
CREATE POLICY "Users can view audit logs in their organization"
    ON public.audit_logs FOR SELECT
    USING (organization_id = public.current_user_organization_id());

CREATE POLICY "Users can insert audit logs into their organization"
    ON public.audit_logs FOR INSERT
    WITH CHECK (organization_id = public.current_user_organization_id());
