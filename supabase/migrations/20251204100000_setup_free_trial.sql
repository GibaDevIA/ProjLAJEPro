-- Add max_projects column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT NULL;

-- Insert or Update 'Free Trial' Plan
DO $$
DECLARE
    plan_id UUID;
BEGIN
    -- Check if 'Free Trial' plan exists
    SELECT id INTO plan_id FROM public.plans WHERE name = 'Free Trial';

    IF plan_id IS NOT NULL THEN
        -- Update existing
        UPDATE public.plans 
        SET 
            description = '7-day free trial with limited project creation',
            duration_days = 7,
            is_active = true,
            max_panos_per_project = 5,
            max_projects = 5,
            price = 0,
            stripe_price_id = 'free_trial_placeholder_price_id'
        WHERE id = plan_id;
    ELSE
        -- Insert new
        INSERT INTO public.plans (name, description, duration_days, is_active, max_panos_per_project, max_projects, price, stripe_price_id)
        VALUES ('Free Trial', '7-day free trial with limited project creation', 7, true, 5, 5, 0, 'free_trial_placeholder_price_id');
    END IF;
END $$;

-- Update handle_new_user trigger function to enforce Free Trial logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    selected_plan_id UUID;
    plan_duration INTEGER;
BEGIN
    -- Determine plan_id based on the plan parameter (slug)
    IF new.raw_user_meta_data->>'plan' = 'professional' THEN
        SELECT id, duration_days INTO selected_plan_id, plan_duration FROM public.plans WHERE name = 'Profissional' LIMIT 1;
    ELSE
        -- Default to 'Free Trial'
        SELECT id, duration_days INTO selected_plan_id, plan_duration FROM public.plans WHERE name = 'Free Trial' LIMIT 1;
        
        -- Fallback to 'Gratuito 7 dias' if Free Trial not found (safety net)
        IF selected_plan_id IS NULL THEN
            SELECT id, duration_days INTO selected_plan_id, plan_duration FROM public.plans WHERE name = 'Gratuito 7 dias' LIMIT 1;
        END IF;
    END IF;

    -- Insert Profile
    INSERT INTO public.profiles (id, email, full_name, plan_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', selected_plan_id);

    -- Insert Subscription
    IF new.raw_user_meta_data->>'plan' IS DISTINCT FROM 'professional' THEN
         INSERT INTO public.subscriptions (
            user_id,
            plan_id,
            status,
            trial_start,
            trial_end
        ) VALUES (
            new.id,
            selected_plan_id,
            'trialing',
            NOW(),
            NOW() + (COALESCE(plan_duration, 7) || ' days')::INTERVAL
        );
    ELSE
        -- Professional (pending payment)
         INSERT INTO public.subscriptions (
            user_id,
            plan_id,
            status
        ) VALUES (
            new.id,
            selected_plan_id,
            'incomplete'
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
