-- Update the max_panos_per_project limit for the Free Trial / Gratuito 7 dias plans
UPDATE public.plans
SET max_panos_per_project = 20
WHERE name IN ('Gratuito 7 dias', 'Free Trial');
