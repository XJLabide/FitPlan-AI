-- Create workout_sessions table to track completed workout sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  overall_feeling TEXT CHECK (overall_feeling IN ('easy', 'moderate', 'hard', 'very_hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_sessions
CREATE POLICY "Users can view own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create exercise_logs table to track individual exercise performance
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER,
  reps_completed TEXT,
  weight_used DECIMAL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_logs
CREATE POLICY "Users can view own exercise logs"
  ON public.exercise_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs"
  ON public.exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise logs"
  ON public.exercise_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise logs"
  ON public.exercise_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create body_measurements table to track physical progress
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  weight_kg DECIMAL,
  body_fat_percentage DECIMAL,
  chest_cm DECIMAL,
  waist_cm DECIMAL,
  hips_cm DECIMAL,
  arms_cm DECIMAL,
  legs_cm DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for body_measurements
CREATE POLICY "Users can view own body measurements"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body measurements"
  ON public.body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body measurements"
  ON public.body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body measurements"
  ON public.body_measurements FOR DELETE
  USING (auth.uid() = user_id);
