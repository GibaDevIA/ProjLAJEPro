-- Update the Professional plan with the provided Stripe Price ID
UPDATE public.plans 
SET stripe_price_id = 'price_1SZYZvJMdLIyjifR7ZzexA1v' 
WHERE name = 'Profissional';

-- Ensure constraint is applied after seeding (if we wanted to enforce not null, but some plans might be free and have no price id)
-- For free plans, stripe_price_id can be null or empty.
-- However, AC says "stripe_price_id of type TEXT, which should be NOT NULL".
-- So we must provide a value for all plans.
-- For the free plan, we can use a placeholder or empty string if it's not paid.

UPDATE public.plans 
SET stripe_price_id = '' 
WHERE stripe_price_id IS NULL;

ALTER TABLE public.plans ALTER COLUMN stripe_price_id SET NOT NULL;
