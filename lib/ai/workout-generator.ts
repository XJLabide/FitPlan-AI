import type { OnboardingData } from "@/lib/types"

interface WorkoutDay {
  day_number: number
  workout_name: string
  exercises: {
    exercise_name: string
    sets?: number
    reps?: string
    duration_minutes?: number
    rest_seconds?: number
    notes?: string
    order_index: number
  }[]
}

export interface GeneratedWorkoutPlan {
  plan_name: string
  description: string
  workouts: WorkoutDay[]
}

export async function generateWorkoutPlan(onboardingData: OnboardingData): Promise<GeneratedWorkoutPlan> {
  const prompt = buildWorkoutPrompt(onboardingData)

  try {
    const response = await fetch("/api/generate-workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.details || errorData.error || "Failed to generate workout plan")
    }

    const data = await response.json()
    return data.plan
  } catch (error) {
    console.error("[v0] Error generating workout plan:", error)
    throw error
  }
}

function buildWorkoutPrompt(data: OnboardingData): string {
  const goalDescriptions = {
    lose_weight: "lose weight and burn fat",
    build_muscle: "build muscle and increase strength",
    improve_endurance: "improve cardiovascular endurance and stamina",
    general_fitness: "improve overall fitness and health",
    increase_flexibility: "increase flexibility and mobility",
  }

  const levelDescriptions = {
    beginner: "a beginner who is new to working out",
    intermediate: "an intermediate exerciser with 6+ months of experience",
    advanced: "an advanced athlete with extensive training experience",
  }

  return `Create a personalized workout plan for ${levelDescriptions[data.fitness_level]} whose primary goal is to ${goalDescriptions[data.primary_goal]}.

/*
    User Profile:
    - Fitness Level: ${data.fitness_level}
    - Primary Goal: ${data.primary_goal}
    - Days Available: ${data.available_days.join(", ")}
    - Session Duration: ${data.session_duration} minutes
    - Equipment: ${data.equipment_access.join(", ")}
    - Limitations: ${data.injuries_limitations || "None"}

    Generate a ${data.available_days.length}-day workout routine.
    IMPORTANT: Generate exactly ${data.available_days.length} workouts, one for each available day (${data.available_days.join(", ")}).
    
    Return a JSON object with this exact structure:
    {
      "plan_name": "string",
      "description": "string",
      "workouts": [
        {
          "day_number": number (1 to ${data.available_days.length}),
          "workout_name": "string (e.g., 'Upper Body Power', 'Monday Full Body')",
          "exercises": [
            {
              "exercise_name": "string",
              "sets": number,
              "reps": "string",
              "duration_minutes": number (optional),
              "rest_seconds": number,
              "notes": "string (optional)",
              "order_index": number
            }
          ]
        }
      ]
    }
  */`
}
