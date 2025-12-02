-- Add RLS policies to allow admins to manage subscriptions in the subscriptions table

-- Policy: Admins can view all subscriptions
-- This allows the admin dashboard to list all user subscriptions for management
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Policy: Admins can insert subscriptions
-- This allows the admin to manually create a subscription for a user
CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Policy: Admins can update subscriptions
-- This allows the admin to modify subscription details (e.g., plan, status)
CREATE POLICY "Admins can update subscriptions" ON public.subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Policy: Admins can delete subscriptions
-- This allows the admin to cancel/remove a subscription entirely
CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
