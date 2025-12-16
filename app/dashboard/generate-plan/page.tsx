"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateWorkoutPlan } from "@/lib/ai/workout-generator"
import type { GeneratedWorkoutPlan } from "@/lib/ai/workout-generator"
import type { OnboardingData } from "@/lib/types"

export default function GeneratePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasAutoStarted = useRef(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Fetch user's onboarding data
      const { data: onboardingData, error: fetchError } = await supabase
        .from("onboarding_data")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (fetchError || !onboardingData) {
        throw new Error("Could not fetch your fitness profile")
      }

      // Generate workout plan using AI
      const plan = await generateWorkoutPlan(onboardingData as OnboardingData)
      setGeneratedPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate workout plan")
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const auto = searchParams.get("auto")
    if (auto === "true" && !hasAutoStarted.current && !generatedPlan) {
      hasAutoStarted.current = true
      handleGenerate()
    }
  }, [searchParams, generatedPlan])

  const handleSavePlan = async () => {
    if (!generatedPlan) return

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Fetch onboarding data to get available days
      const { data: onboardingData, error: fetchError } = await supabase
        .from("onboarding_data")
        .select("available_days")
        .eq("user_id", user.id)
        .single()

      if (fetchError || !onboardingData) {
        throw new Error("Could not fetch profile settings")
      }

      const availableDays = (onboardingData.available_days as unknown as string[]) || []

      // Create workout plan
      console.log("Saving plan...", { userId: user.id, planName: generatedPlan.plan_name })
      const { data: planData, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user.id,
          plan_name: generatedPlan.plan_name,
          description: generatedPlan.description,
          start_date: new Date().toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single()

      if (planError) {
        console.error("Plan insert error:", planError)
        throw planError
      }
      console.log("Plan saved:", planData)

      // Map days to integers for calculation
      const dayMap: { [key: string]: number } = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      }

      // Create workouts for each day
      for (const workout of generatedPlan.workouts) {
        // Calculate scheduled date
        let scheduledDate = null
        if (availableDays.length > 0) {
          // Assuming AI generates workouts in order corresponding to proper available days
          // workout.day_number is 1-indexed
          const dayIndex = (workout.day_number - 1) % availableDays.length
          const dayName = availableDays[dayIndex]

          if (dayName && dayMap[dayName] !== undefined) {
            const targetDay = dayMap[dayName]
            const today = new Date()
            const currentDay = today.getDay()

            // Calculate days until target day
            let daysUntil = targetDay - currentDay
            // If the day is today, schedule for today. If it's past, schedule for next week.
            if (daysUntil < 0) {
              daysUntil += 7
            }

            const date = new Date(today)
            date.setDate(today.getDate() + daysUntil)
            scheduledDate = date.toISOString().split('T')[0]
          }
        }

        console.log("Saving workout...", { day: workout.day_number, date: scheduledDate })
        const { data: workoutData, error: workoutError } = await supabase
          .from("workouts")
          .insert({
            plan_id: planData.id,
            user_id: user.id,
            day_number: workout.day_number,
            workout_name: workout.workout_name,
            scheduled_date: scheduledDate
          })
          .select()
          .single()

        if (workoutError) {
          console.error("Workout insert error:", workoutError)
          throw workoutError
        }

        // Create exercises for this workout
        const exercisesToInsert = workout.exercises.map((exercise) => ({
          workout_id: workoutData.id,
          user_id: user.id,
          ...exercise,
        }))

        const { error: exercisesError } = await supabase.from("exercises").insert(exercisesToInsert)

        if (exercisesError) {
          console.error("Exercise insert error:", exercisesError)
          throw exercisesError
        }
      }

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error("Save plan error object:", err)

      let errorMessage = "Failed to save workout plan."
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === "object" && err !== null) {
        errorMessage = err.message || err.details || JSON.stringify(err)
      }

      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Generate Your Workout Plan</h1>
          <p className="text-zinc-400">Let AI create a personalized workout plan based on your profile</p>
        </div>

        {!generatedPlan ? (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-zinc-400">
                Click below to generate a personalized workout plan tailored to your fitness level, goals, and available
                equipment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full">
                {isGenerating ? "Generating Your Plan..." : "Generate Workout Plan"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">{generatedPlan.plan_name}</CardTitle>
                <CardDescription className="text-zinc-400">{generatedPlan.description}</CardDescription>
              </CardHeader>
            </Card>

            {generatedPlan.workouts.map((workout) => (
              <Card key={workout.day_number} className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                      {workout.day_number}
                    </span>
                    {workout.workout_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, idx) => (
                      <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                        <h4 className="font-semibold text-white">{exercise.exercise_name}</h4>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                          {exercise.sets && <span>Sets: {exercise.sets}</span>}
                          {exercise.reps && <span>Reps: {exercise.reps}</span>}
                          {exercise.duration_minutes && <span>Duration: {exercise.duration_minutes} min</span>}
                          {exercise.rest_seconds && <span>Rest: {exercise.rest_seconds}s</span>}
                        </div>
                        {exercise.notes && <p className="mt-2 text-sm text-muted-foreground">{exercise.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button onClick={() => setGeneratedPlan(null)} variant="outline" className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white">
                Generate New Plan
              </Button>
              <Button onClick={handleSavePlan} disabled={isSaving} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
                {isSaving ? "Saving..." : "Save & Start Plan"}
              </Button>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
