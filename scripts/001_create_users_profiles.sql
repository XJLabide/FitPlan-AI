-- Create users profiles table to store user fitness data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create onboarding_data table to store user's fitness goals and preferences
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('lose_weight', 'build_muscle', 'improve_endurance', 'general_fitness', 'increase_flexibility')),
  available_days INTEGER NOT NULL CHECK (available_days >= 1 AND available_days <= 7),
  session_duration INTEGER NOT NULL CHECK (session_duration IN (30, 45, 60, 90)),
  equipment_access TEXT[] NOT NULL,
  injuries_limitations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_data
CREATE POLICY "Users can view own onboarding data"
  ON public.onboarding_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON public.onboarding_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON public.onboarding_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding data"
  ON public.onboarding_data FOR DELETE
  USING (auth.uid() = user_id);
