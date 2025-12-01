-- Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    duration_days INTEGER,
    max_panos_per_project INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Seed initial plans
INSERT INTO public.plans (name, description, price, duration_days, max_panos_per_project, is_active)
VALUES
('Gratuito 7 dias', 'Até 5 panos por projeto', 0, 7, 5, TRUE),
('Profissional', 'Mensal: de R$ 297 por R$ 147', 147, NULL, NULL, TRUE);
