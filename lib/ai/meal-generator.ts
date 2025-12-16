import type { OnboardingData } from "@/lib/types"

interface MealItem {
    meal_type: "breakfast" | "lunch" | "dinner" | "snack"
    meal_name: string
    description: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
}

export interface GeneratedMealPlan {
    plan_name: string
    daily_calorie_target: number
    protein_target_g: number
    carbs_target_g: number
    fat_target_g: number
    meals: MealItem[]
}

export interface MealPlanInput {
    fitness_goal: string
    dietary_preferences: string[]
    calorie_preference?: "low" | "moderate" | "high"
}

export async function generateMealPlan(
    onboardingData: OnboardingData,
    preferences: MealPlanInput
): Promise<GeneratedMealPlan> {
    const prompt = buildMealPrompt(onboardingData, preferences)

    try {
        const response = await fetch("/api/generate-meal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.details || errorData.error || "Failed to generate meal plan")
        }

        const data = await response.json()
        return data.plan
    } catch (error) {
        console.error("[MealGenerator] Error generating meal plan:", error)
        throw error
    }
}

function buildMealPrompt(data: OnboardingData, preferences: MealPlanInput): string {
    const goalDescriptions: Record<string, { focus: string; calorieRange: string; macroSplit: string }> = {
        lose_weight: {
            focus: "weight loss and fat burning",
            calorieRange: "1400-1800",
            macroSplit: "high protein (35%), moderate carbs (35%), moderate fat (30%)",
        },
        build_muscle: {
            focus: "muscle building and strength gains",
            calorieRange: "2200-2800",
            macroSplit: "high protein (35%), high carbs (45%), moderate fat (20%)",
        },
        improve_endurance: {
            focus: "endurance and energy for cardio",
            calorieRange: "2000-2400",
            macroSplit: "moderate protein (25%), high carbs (55%), low fat (20%)",
        },
        general_fitness: {
            focus: "overall health and balanced nutrition",
            calorieRange: "1800-2200",
            macroSplit: "balanced (30% protein, 40% carbs, 30% fat)",
        },
        increase_flexibility: {
            focus: "recovery and anti-inflammatory foods",
            calorieRange: "1800-2200",
            macroSplit: "balanced with healthy fats (25% protein, 45% carbs, 30% fat)",
        },
    }

    const goalInfo = goalDescriptions[data.primary_goal] || goalDescriptions.general_fitness
    const dietaryRestrictions = preferences.dietary_preferences.length > 0
        ? preferences.dietary_preferences.join(", ")
        : "None"

    return `Create a personalized daily meal plan for someone whose fitness goal is ${goalInfo.focus}.

User Profile:
- Fitness Goal: ${data.primary_goal}
- Dietary Restrictions: ${dietaryRestrictions}
- Recommended Calorie Range: ${goalInfo.calorieRange} calories
- Macro Split: ${goalInfo.macroSplit}

Generate a complete daily meal plan with breakfast, lunch, dinner, and 1-2 snacks.
Make the meals practical, easy to prepare, and nutritious.
${preferences.dietary_preferences.includes("vegetarian") ? "All meals must be vegetarian (no meat or fish)." : ""}
${preferences.dietary_preferences.includes("vegan") ? "All meals must be vegan (no animal products)." : ""}
${preferences.dietary_preferences.includes("gluten_free") ? "All meals must be gluten-free." : ""}
${preferences.dietary_preferences.includes("dairy_free") ? "All meals must be dairy-free." : ""}

Return a JSON object with this exact structure:
{
  "plan_name": "string (e.g., 'Muscle Building Daily Plan')",
  "daily_calorie_target": number,
  "protein_target_g": number,
  "carbs_target_g": number,
  "fat_target_g": number,
  "meals": [
    {
      "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
      "meal_name": "string",
      "description": "string (ingredients and brief prep notes)",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ]
}

Ensure the total macros from all meals add up close to the daily targets.`
}
