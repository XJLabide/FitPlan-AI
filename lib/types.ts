export type FitnessLevel = "beginner" | "intermediate" | "advanced"

export type FitnessGoal =
  | "lose_weight"
  | "build_muscle"
  | "improve_endurance"
  | "general_fitness"
  | "increase_flexibility"

export type EquipmentOption =
  | "dumbbells"
  | "barbell"
  | "resistance_bands"
  | "pull_up_bar"
  | "kettlebell"
  | "bench"
  | "cable_machine"
  | "cardio_equipment"
  | "bodyweight_only"
  | "full_gym"

export interface OnboardingData {
  fitness_level: FitnessLevel
  primary_goal: FitnessGoal
  available_days: number
  session_duration: number
  equipment_access: EquipmentOption[]
  injuries_limitations?: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  plan_name: string
  description: string
  start_date: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  plan_id: string
  user_id: string
  day_number: number
  workout_name: string
  scheduled_date?: string
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface Exercise {
  id: string
  workout_id: string
  user_id: string
  exercise_name: string
  sets?: number
  reps?: string
  duration_minutes?: number
  rest_seconds?: number
  notes?: string
  order_index: number
  completed: boolean
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_id?: string
  session_date: string
  duration_minutes?: number
  notes?: string
  overall_feeling?: "easy" | "moderate" | "hard" | "very_hard"
  created_at: string
}
