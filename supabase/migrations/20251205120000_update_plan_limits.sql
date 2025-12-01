-- Ensure 'Gratuito 7 dias' has 5 panos limit and correct settings
-- We use UPDATE first to target existing records
UPDATE public.plans
SET max_panos_per_project = 5,
    max_projects = 5,
    duration_days = 7,
    price = 0,
    is_active = true
WHERE name = 'Gratuito 7 dias' OR name = 'Free Trial';

-- Ensure 'Profissional' has NULL limits (unlimited)
UPDATE public.plans
SET max_panos_per_project = NULL,
    max_projects = NULL,
    duration_days = 30,
    is_active = true
WHERE name = 'Profissional';

-- If 'Gratuito 7 dias' doesn't exist (and Free Trial doesn't either), insert it
INSERT INTO public.plans (name, description, duration_days, is_active, max_panos_per_project, max_projects, price, stripe_price_id)
SELECT 'Gratuito 7 dias', 'Plano gratuito de avaliação por 7 dias', 7, true, 5, 5, 0, 'price_free_trial'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Gratuito 7 dias' OR name = 'Free Trial');
