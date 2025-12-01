DO $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Retrieve the Free plan ID for default assignment
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Gratuito 7 dias' LIMIT 1;

    -- Add plan_id column allowing NULL initially
    ALTER TABLE public.profiles ADD COLUMN plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT;

    -- Update existing profiles to use the Free plan
    UPDATE public.profiles SET plan_id = free_plan_id WHERE plan_id IS NULL;

    -- Enforce NOT NULL constraint
    ALTER TABLE public.profiles ALTER COLUMN plan_id SET NOT NULL;
END $$;

-- Update the trigger function to handle plan assignment from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    selected_plan_id UUID;
    plan_param TEXT;
BEGIN
    plan_param := new.raw_user_meta_data->>'plan';

    -- Determine plan_id based on the plan parameter (slug)
    IF plan_param = 'professional' THEN
        SELECT id INTO selected_plan_id FROM public.plans WHERE name = 'Profissional' LIMIT 1;
    ELSE
        -- Default to 'Gratuito 7 dias' if 'free' or undefined/invalid
        SELECT id INTO selected_plan_id FROM public.plans WHERE name = 'Gratuito 7 dias' LIMIT 1;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, plan_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', selected_plan_id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
