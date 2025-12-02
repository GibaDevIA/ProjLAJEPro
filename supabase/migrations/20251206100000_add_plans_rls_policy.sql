-- Enable Row Level Security on the plans table
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to view all plans
-- This is necessary for the Admin Dashboard to list plans for assignment
-- and potentially for other authenticated user views (like pricing/subscription management)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.plans;

CREATE POLICY "Enable read access for authenticated users" ON public.plans
FOR SELECT
TO authenticated
USING (true);
