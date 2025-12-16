-- Create workout_plans table to store AI-generated workout plans
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_plans
CREATE POLICY "Users can view own workout plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create workouts table to store individual workouts
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  workout_name TEXT NOT NULL,
  scheduled_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workouts
CREATE POLICY "Users can view own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Create exercises table to store individual exercises within workouts
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  duration_minutes INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  order_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises
CREATE POLICY "Users can view own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);
