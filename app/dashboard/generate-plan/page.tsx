"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateWorkoutPlan } from "@/lib/ai/workout-generator"
import type { GeneratedWorkoutPlan } from "@/lib/ai/workout-generator"
import type { OnboardingData } from "@/lib/types"
import { ArrowLeft, Plus, Sparkles, Edit } from "lucide-react"
import Link from "next/link"

interface CurrentPlan {
  id: string
  plan_name: string
  description: string
  workouts: {
    id: string
    day_number: number
    workout_name: string
    exercises: {
      id: string
      exercise_name: string
      sets: number
      reps: string
      duration_minutes?: number
      rest_seconds: number
      notes?: string
    }[]
  }[]
}

// Wrapper component to handle Suspense boundary for useSearchParams
export default function GeneratePlanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <GeneratePlanContent />
    </Suspense>
  )
}

function GeneratePlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasAutoStarted = useRef(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null)
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [mode, setMode] = useState<"view" | "generate" | "customize">("view")

  // Fetch current active plan on load
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsLoadingPlan(false)
          return
        }

        const { data: plan } = await supabase
          .from("workout_plans")
          .select(`
            id,
            plan_name,
            description,
            workouts (
              id,
              day_number,
              workout_name,
              exercises (
                id,
                exercise_name,
                sets,
                reps,
                duration_minutes,
                rest_seconds,
                notes
              )
            )
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (plan) {
          // Sort workouts and exercises
          const sortedPlan = {
            ...plan,
            workouts: (plan.workouts as any[])
              .sort((a, b) => a.day_number - b.day_number)
              .map((w) => ({
                ...w,
                exercises: (w.exercises as any[]).sort((a, b) =>
                  (a.order_index ?? 0) - (b.order_index ?? 0)
                )
              }))
          }
          setCurrentPlan(sortedPlan as CurrentPlan)
        }
      } catch (err) {
        console.error("Error fetching current plan:", err)
      } finally {
        setIsLoadingPlan(false)
      }
    }

    fetchCurrentPlan()
  }, [])

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
      setMode("generate")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate workout plan")
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const auto = searchParams.get("auto")
    if (auto === "true" && !hasAutoStarted.current && !generatedPlan && !isLoadingPlan) {
      hasAutoStarted.current = true
      handleGenerate()
    }
  }, [searchParams, generatedPlan, isLoadingPlan])

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

  // Render a workout plan (either current or generated)
  const renderPlanDetails = (plan: CurrentPlan | GeneratedWorkoutPlan, isCurrentPlan: boolean) => (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">{plan.plan_name}</CardTitle>
          <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
        </CardHeader>
      </Card>

      {plan.workouts.map((workout, idx) => (
        <Card key={workout.day_number || idx} className="border-zinc-800 bg-zinc-900">
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
              {workout.exercises.map((exercise, exIdx) => (
                <div key={exIdx} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                  <h4 className="font-semibold text-white">{exercise.exercise_name}</h4>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                    {exercise.sets && <span>Sets: {exercise.sets}</span>}
                    {exercise.reps && <span>Reps: {exercise.reps}</span>}
                    {exercise.duration_minutes && <span>Duration: {exercise.duration_minutes} min</span>}
                    {exercise.rest_seconds && <span>Rest: {exercise.rest_seconds}s</span>}
                  </div>
                  {exercise.notes && <p className="mt-2 text-sm text-zinc-500">{exercise.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Loading state
  if (isLoadingPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-zinc-400">Loading your plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white">Workout Plans</h1>
          <p className="text-zinc-400">Manage your workout plan or create a new one</p>
        </div>

        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {/* Mode: View Current Plan */}
        {mode === "view" && currentPlan && !generatedPlan && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                onClick={() => {
                  setGeneratedPlan(null)
                  handleGenerate()
                }}
                disabled={isGenerating}
                variant="outline"
                className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Create New Plan"}
              </Button>
              <Button
                onClick={() => setMode("customize")}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                <Edit className="mr-2 h-4 w-4" />
                Customize Current Plan
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-400">Your Current Plan</span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>

            {renderPlanDetails(currentPlan, true)}
          </div>
        )}

        {/* Mode: Customize Current Plan */}
        {mode === "customize" && currentPlan && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Customizing: {currentPlan.plan_name}</span>
              <Button
                onClick={() => setMode("view")}
                variant="outline"
                className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>

            <Card className="border-orange-500/20 bg-orange-500/10">
              <CardContent className="py-4">
                <p className="text-sm text-orange-400">
                  ✨ Customization mode - Edit your workouts directly from the dashboard.
                  Click on any workout to modify exercises, sets, or reps.
                </p>
              </CardContent>
            </Card>

            {renderPlanDetails(currentPlan, true)}

            <div className="flex gap-3">
              <Button
                onClick={() => setMode("view")}
                variant="outline"
                className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Done Viewing
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Mode: No Current Plan */}
        {mode === "view" && !currentPlan && !generatedPlan && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-zinc-400">
                Click below to generate a personalized workout plan tailored to your fitness level, goals, and available equipment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full bg-orange-500 text-white hover:bg-orange-600"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating Your Plan..." : "Generate Workout Plan"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mode: Generated Plan Preview */}
        {generatedPlan && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-semibold text-white">AI Generated Plan</span>
            </div>

            {renderPlanDetails(generatedPlan, false)}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setGeneratedPlan(null)
                  setMode("view")
                }}
                variant="outline"
                className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                {currentPlan ? "Keep Current Plan" : "Generate New Plan"}
              </Button>
              <Button
                onClick={handleSavePlan}
                disabled={isSaving}
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
              >
                {isSaving ? "Saving..." : "Save & Start Plan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
