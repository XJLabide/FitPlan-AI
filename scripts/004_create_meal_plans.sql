-- Create meal_plans table for optional meal planning feature
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  daily_calorie_target INTEGER,
  protein_target_g INTEGER,
  carbs_target_g INTEGER,
  fat_target_g INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_plans
CREATE POLICY "Users can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create meals table to store individual meals
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  logged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meals
CREATE POLICY "Users can view own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);
