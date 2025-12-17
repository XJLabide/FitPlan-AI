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

  // Exercise library - ONLY use exercises from this list
  const exerciseLibrary = `
APPROVED EXERCISE LIST (You MUST only use exercises from this list):

CHEST:
- Bench Press, Incline Bench Press, Decline Bench Press, Dumbbell Bench Press
- Push-ups, Wide Push-ups, Diamond Push-ups
- Chest Fly, Dumbbell Fly, Cable Fly

BACK:
- Pull-ups, Chin-ups, Lat Pulldown
- Bent Over Row, Barbell Row, Dumbbell Row, Seated Row, Cable Row
- Deadlift, Romanian Deadlift, Stiff-Leg Deadlift

SHOULDERS:
- Shoulder Press, Overhead Press, Military Press, Dumbbell Shoulder Press, Arnold Press
- Lateral Raise, Side Raise, Front Raise

ARMS:
- Bicep Curl, Dumbbell Curl, Barbell Curl, Hammer Curl, Preacher Curl, Concentration Curl
- Tricep Extension, Skull Crusher, Overhead Tricep Extension, Tricep Pushdown
- Dips, Tricep Dip, Bench Dip

LEGS:
- Squat, Back Squat, Front Squat, Goblet Squat, Bodyweight Squat
- Leg Press
- Lunge, Walking Lunge, Reverse Lunge, Dumbbell Lunge
- Leg Curl, Hamstring Curl, Lying Leg Curl
- Leg Extension
- Calf Raise, Standing Calf Raise, Seated Calf Raise

CORE:
- Crunch, Crunches, Bicycle Crunch, Reverse Crunch, Cable Crunch
- Plank, Side Plank, Forearm Plank
- Hyperextension, Back Extension
`

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
    IMPORTANT: Generate exactly ${data.available_days.length} workouts, one for each available day.
    
    CRITICAL: The workout_name MUST start with the exact day name from the available days list, in order:
    - Workout 1 (day_number: 1) must be for ${data.available_days[0] || "Day 1"}
    - Workout 2 (day_number: 2) must be for ${data.available_days[1] || "Day 2"}
    ${data.available_days[2] ? `- Workout 3 (day_number: 3) must be for ${data.available_days[2]}` : ""}
    ${data.available_days[3] ? `- Workout 4 (day_number: 4) must be for ${data.available_days[3]}` : ""}
    ${data.available_days[4] ? `- Workout 5 (day_number: 5) must be for ${data.available_days[4]}` : ""}
    ${data.available_days[5] ? `- Workout 6 (day_number: 6) must be for ${data.available_days[5]}` : ""}
    ${data.available_days[6] ? `- Workout 7 (day_number: 7) must be for ${data.available_days[6]}` : ""}

    ${exerciseLibrary}

    CRITICAL EXERCISE CONSTRAINT:
    - You MUST ONLY use exercises from the APPROVED EXERCISE LIST above
    - DO NOT invent or use any exercises not in the list
    - Each exercise name must match one from the list exactly
    
    Return a JSON object with this exact structure:
    {
      "plan_name": "string",
      "description": "string",
      "workouts": [
        {
          "day_number": number (1 to ${data.available_days.length}),
          "workout_name": "string (format: '[DayName] - [Focus]', e.g., '${data.available_days[0] || "Monday"} - Upper Body')",
          "exercises": [
            {
              "exercise_name": "string (MUST be from approved list)",
              "sets": integer (whole number only, no decimals),
              "reps": "string",
              "duration_minutes": integer (optional, whole number only),
              "rest_seconds": integer (whole number only, no decimals like 0.5),
              "notes": "string (optional)",
              "order_index": number
            }
          ]
        }
      ]
    }
    
    IMPORTANT VARIATION RULES:
    - Generate a UNIQUE and DIFFERENT workout plan each time
    - Use VARIETY in exercise selection from the approved list
    - Mix up the workout structure and exercise order
    - Include a variety of compound and isolation movements
    - All numeric values for sets, rest_seconds, and duration_minutes MUST be whole integers (no decimals)
  */`
}
