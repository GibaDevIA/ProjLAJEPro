-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.projects enable row level security;

-- Create policies
create policy "Users can view their own projects." on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert their own projects." on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects." on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects." on public.projects
  for delete using (auth.uid() = user_id);
