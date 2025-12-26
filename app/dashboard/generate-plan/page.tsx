"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateWorkoutPlan } from "@/lib/ai/workout-generator"
import type { GeneratedWorkoutPlan } from "@/lib/ai/workout-generator"
import type { OnboardingData } from "@/lib/types"
import { ArrowLeft, Plus, Sparkles, Edit, Trash2, Save, Dumbbell, RefreshCw, User } from "lucide-react"
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
  const [mode, setMode] = useState<"view" | "generate" | "customize" | "profile-select">("view")
  const [editablePlan, setEditablePlan] = useState<CurrentPlan | null>(null)
  const [isSavingEdits, setIsSavingEdits] = useState(false)

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

  // Enter customize mode with a copy of the current plan
  const enterEditMode = () => {
    if (currentPlan) {
      // Deep clone the current plan for editing
      setEditablePlan(JSON.parse(JSON.stringify(currentPlan)))
      setMode("customize")
    }
  }

  // Remove an exercise from the editable plan
  const removeExercise = (workoutIndex: number, exerciseIndex: number) => {
    if (!editablePlan) return
    setEditablePlan(prev => {
      if (!prev) return prev
      const updated = { ...prev }
      updated.workouts = [...updated.workouts]
      updated.workouts[workoutIndex] = {
        ...updated.workouts[workoutIndex],
        exercises: updated.workouts[workoutIndex].exercises.filter((_, idx) => idx !== exerciseIndex)
      }
      return updated
    })
  }

  // Remove an entire workout from the editable plan
  const removeWorkout = (workoutIndex: number) => {
    if (!editablePlan) return
    setEditablePlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        workouts: prev.workouts.filter((_, idx) => idx !== workoutIndex)
      }
    })
  }

  // Save edits to the database
  const handleSaveEdits = async () => {
    if (!editablePlan) return
    setIsSavingEdits(true)
    setError(null)

    try {
      const supabase = createClient()

      // Delete exercises that were removed
      const originalExerciseIds = currentPlan?.workouts.flatMap(w => w.exercises.map(e => e.id)) || []
      const remainingExerciseIds = editablePlan.workouts.flatMap(w => w.exercises.map(e => e.id))
      const deletedExerciseIds = originalExerciseIds.filter(id => !remainingExerciseIds.includes(id))

      if (deletedExerciseIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("exercises")
          .delete()
          .in("id", deletedExerciseIds)

        if (deleteError) throw deleteError
      }

      // Delete workouts that were removed
      const originalWorkoutIds = currentPlan?.workouts.map(w => w.id) || []
      const remainingWorkoutIds = editablePlan.workouts.map(w => w.id)
      const deletedWorkoutIds = originalWorkoutIds.filter(id => !remainingWorkoutIds.includes(id))

      if (deletedWorkoutIds.length > 0) {
        // First delete exercises for deleted workouts
        const { error: deleteExError } = await supabase
          .from("exercises")
          .delete()
          .in("workout_id", deletedWorkoutIds)

        if (deleteExError) throw deleteExError

        // Then delete the workouts
        const { error: deleteWError } = await supabase
          .from("workouts")
          .delete()
          .in("id", deletedWorkoutIds)

        if (deleteWError) throw deleteWError
      }

      // Update currentPlan with editablePlan
      setCurrentPlan(editablePlan)
      setMode("view")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setIsSavingEdits(false)
    }
  }

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

      // Deactivate any existing active plans before creating new one
      await supabase
        .from("workout_plans")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true)

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
            // Use local date formatting to avoid timezone issues
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            scheduledDate = `${year}-${month}-${day}`
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

        // Create exercises for this workout - sanitize numeric values
        const exercisesToInsert = workout.exercises.map((exercise) => ({
          workout_id: workoutData.id,
          user_id: user.id,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets ? Math.round(Number(exercise.sets)) : null,
          reps: exercise.reps || null,
          duration_minutes: exercise.duration_minutes ? Math.round(Number(exercise.duration_minutes)) : null,
          rest_seconds: exercise.rest_seconds ? Math.round(Number(exercise.rest_seconds)) : null,
          notes: exercise.notes || null,
          order_index: exercise.order_index,
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
  // Full-screen loading animation when generating
  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
        <div className="relative text-center">
          {/* Animated background circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute h-64 w-64 animate-ping rounded-full bg-orange-500/10" style={{ animationDuration: '3s' }} />
            <div className="absolute h-48 w-48 animate-ping rounded-full bg-orange-500/20" style={{ animationDuration: '2s' }} />
            <div className="absolute h-32 w-32 animate-ping rounded-full bg-orange-500/30" style={{ animationDuration: '1s' }} />
          </div>

          {/* Main spinner container */}
          <div className="relative mb-8">
            {/* Outer rotating ring */}
            <div className="h-32 w-32 animate-spin rounded-full border-4 border-zinc-800" style={{ animationDuration: '3s' }}>
              <div className="absolute left-0 top-0 h-4 w-4 -translate-x-1 -translate-y-1 rounded-full bg-orange-500" />
            </div>

            {/* Inner counter-rotating ring */}
            <div className="absolute inset-4 animate-spin rounded-full border-4 border-zinc-700" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
              <div className="absolute right-0 top-1/2 h-3 w-3 translate-x-1 -translate-y-1/2 rounded-full bg-green-500" />
            </div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
                <Dumbbell className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Text content */}
          <h2 className="mb-2 text-2xl font-bold text-white">Creating Your Workout Plan</h2>
          <p className="mb-4 text-zinc-400">Our AI is designing your personalized routine...</p>

          {/* Animated steps */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-green-400 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              Analyzing your goals...
            </div>
            <div className="flex items-center justify-center gap-2 text-orange-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
              <div className="h-2 w-2 rounded-full bg-orange-400" />
              Selecting exercises...
            </div>
            <div className="flex items-center justify-center gap-2 text-zinc-500 animate-pulse" style={{ animationDelay: '1s' }}>
              <div className="h-2 w-2 rounded-full bg-zinc-500" />
              Building weekly schedule...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
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
                  setMode("profile-select")
                }}
                disabled={isGenerating}
                variant="outline"
                className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Plan
              </Button>
              <Button
                onClick={enterEditMode}
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
        {mode === "customize" && editablePlan && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Customizing: {editablePlan.plan_name}</span>
              <Button
                onClick={() => {
                  setEditablePlan(null)
                  setMode("view")
                }}
                variant="outline"
                className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>

            <Card className="border-orange-500/20 bg-orange-500/10">
              <CardContent className="py-4">
                <p className="text-sm text-orange-400">
                  ✨ Click the trash icon to remove exercises or entire workout days. Changes are saved when you click "Save Changes".
                </p>
              </CardContent>
            </Card>

            {/* Plan name and description */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">{editablePlan.plan_name}</CardTitle>
                <CardDescription className="text-zinc-400">{editablePlan.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Editable workouts */}
            {editablePlan.workouts.map((workout, workoutIdx) => (
              <Card key={workout.id || workoutIdx} className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                        {workout.day_number}
                      </span>
                      {workout.workout_name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkout(workoutIdx)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      title="Remove this workout day"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, exIdx) => (
                      <div key={exercise.id || exIdx} className="flex items-start justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{exercise.exercise_name}</h4>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                            {exercise.sets && <span>Sets: {exercise.sets}</span>}
                            {exercise.reps && <span>Reps: {exercise.reps}</span>}
                            {exercise.duration_minutes && <span>Duration: {exercise.duration_minutes} min</span>}
                            {exercise.rest_seconds && <span>Rest: {exercise.rest_seconds}s</span>}
                          </div>
                          {exercise.notes && <p className="mt-2 text-sm text-zinc-500">{exercise.notes}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(workoutIdx, exIdx)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 ml-2"
                          title="Remove this exercise"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {workout.exercises.length === 0 && (
                      <p className="text-center text-sm text-zinc-500 py-4">No exercises remaining. This workout will be removed when saved.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {editablePlan.workouts.length === 0 && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="py-8 text-center">
                  <p className="text-zinc-500">All workouts removed. Cancel to restore or generate a new plan.</p>
                </CardContent>
              </Card>
            )}

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setEditablePlan(null)
                  setMode("view")
                }}
                variant="outline"
                className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdits}
                disabled={isSavingEdits}
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSavingEdits ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}

        {/* Mode: Profile Selection for New Plan */}
        {mode === "profile-select" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-semibold text-white">Generate New Plan</span>
            </div>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Choose Your Profile Data</CardTitle>
                <CardDescription className="text-zinc-400">
                  Would you like to generate a new plan using your current profile, or update your fitness information first?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Option 1: Use Current Profile */}
                  <button
                    onClick={() => {
                      setMode("view")
                      handleGenerate()
                    }}
                    className="group flex flex-col items-center gap-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 p-6 text-center transition-all hover:border-orange-500 hover:bg-zinc-800"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 transition-colors group-hover:bg-orange-500/30">
                      <User className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Use Current Profile</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        Generate a plan based on your existing fitness level, goals, and preferences
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Redo Onboarding */}
                  <button
                    onClick={() => {
                      router.push("/onboarding")
                    }}
                    className="group flex flex-col items-center gap-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 p-6 text-center transition-all hover:border-green-500 hover:bg-zinc-800"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 transition-colors group-hover:bg-green-500/30">
                      <RefreshCw className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Update My Profile</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        Review and update your fitness goals, available days, and equipment first
                      </p>
                    </div>
                  </button>
                </div>

                <Button
                  onClick={() => setMode("view")}
                  variant="outline"
                  className="w-full border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mode: No Current Plan */}
        {mode === "view" && !currentPlan && !generatedPlan && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-zinc-400">
                Generate a personalized workout plan tailored to your fitness level, goals, and available equipment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Option 1: Use Current Profile */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group flex flex-col items-center gap-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 p-6 text-center transition-all hover:border-orange-500 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 transition-colors group-hover:bg-orange-500/30">
                    <User className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {isGenerating ? "Generating..." : "Use Current Profile"}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Generate a plan based on your existing fitness level, goals, and preferences
                    </p>
                  </div>
                </button>

                {/* Option 2: Redo Onboarding */}
                <button
                  onClick={() => {
                    router.push("/onboarding")
                  }}
                  disabled={isGenerating}
                  className="group flex flex-col items-center gap-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 p-6 text-center transition-all hover:border-green-500 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 transition-colors group-hover:bg-green-500/30">
                    <RefreshCw className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Update My Profile</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Review and update your fitness goals, available days, and equipment first
                    </p>
                  </div>
                </button>
              </div>
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
