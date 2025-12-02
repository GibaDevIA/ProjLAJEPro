-- Update 'Free Trial' plan duration to 7 days to ensure correct display in Admin Dashboard
UPDATE public.plans
SET duration_days = 7
WHERE name = 'Free Trial';
