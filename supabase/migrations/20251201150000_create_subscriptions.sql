-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL, -- 'trialing', 'active', 'canceled', 'past_due', 'incomplete', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- RLS Policies for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update/delete subscriptions generally (handled via webhooks/triggers)
-- But we allow triggers to work as they run with security definer usually, or we can grant permissions.
-- For simplicity in this setup where webhooks (service role) manage it, we just need read access for users.

