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

  return `Create a personalized ${data.available_days}-day workout plan for ${levelDescriptions[data.fitness_level]} whose primary goal is to ${goalDescriptions[data.primary_goal]}.

Workout Details:
- Fitness Level: ${data.fitness_level}
- Available Days per Week: ${data.available_days}
- Session Duration: ${data.session_duration} minutes
- Available Equipment: ${data.equipment_access.join(", ")}
${data.injuries_limitations ? `- Injuries/Limitations: ${data.injuries_limitations}` : ""}

Requirements:
1. Create ${data.available_days} distinct workouts (one for each day)
2. Each workout should fit within ${data.session_duration} minutes
3. Use ONLY the available equipment: ${data.equipment_access.join(", ")}
4. Include proper warm-up exercises
5. For each exercise, specify: sets, reps (or duration), and rest periods
6. Provide exercise notes with form cues and modifications if needed
${data.injuries_limitations ? `7. IMPORTANT: Avoid exercises that aggravate: ${data.injuries_limitations}` : ""}

Return the plan in this exact JSON format:
{
  "plan_name": "Descriptive plan name",
  "description": "Brief overview of the plan and what to expect",
  "workouts": [
    {
      "day_number": 1,
      "workout_name": "Day 1 workout name",
      "exercises": [
        {
          "exercise_name": "Exercise name",
          "sets": 3,
          "reps": "10-12",
          "duration_minutes": null,
          "rest_seconds": 60,
          "notes": "Form cues and tips",
          "order_index": 0
        }
      ]
    }
  ]
}`
}
