-- Ensure Free Trial plan has correct limits and duration
UPDATE public.plans
SET
    duration_days = 7,
    max_projects = 5,
    max_panos_per_project = 5,
    is_active = TRUE
WHERE name = 'Free Trial';

-- Ensure the plan exists if it was somehow missed (Idempotent insert)
INSERT INTO public.plans (name, description, duration_days, max_projects, max_panos_per_project, price, stripe_price_id, is_active)
SELECT 'Free Trial', '7-day free trial with limited project creation', 7, 5, 5, 0, 'free_trial_placeholder_price_id', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Free Trial');
