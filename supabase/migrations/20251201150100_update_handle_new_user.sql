-- Update the trigger function to create subscription entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    selected_plan_id UUID;
    plan_param TEXT;
    plan_duration INTEGER;
BEGIN
    plan_param := new.raw_user_meta_data->>'plan';

    -- Determine plan_id based on the plan parameter (slug)
    IF plan_param = 'professional' THEN
        SELECT id, duration_days INTO selected_plan_id, plan_duration FROM public.plans WHERE name = 'Profissional' LIMIT 1;
    ELSE
        -- Default to 'Gratuito 7 dias' if 'free' or undefined/invalid
        SELECT id, duration_days INTO selected_plan_id, plan_duration FROM public.plans WHERE name = 'Gratuito 7 dias' LIMIT 1;
    END IF;

    -- Insert Profile
    INSERT INTO public.profiles (id, email, full_name, plan_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', selected_plan_id);

    -- Insert Subscription for Free Trial if applicable
    -- If it's the free plan, we start a trial immediately
    IF plan_param IS DISTINCT FROM 'professional' THEN
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
            NOW() + (plan_duration || ' days')::INTERVAL
        );
    ELSE
        -- If professional, subscription is created pending payment (incomplete) or handled by checkout flow later
        -- Here we create a placeholder 'incomplete' subscription or let the checkout create it.
        -- To simplify, we create an 'incomplete' subscription so the user has a record.
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

