"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Trophy, PartyPopper, Check } from "lucide-react"
import { WorkoutTimer } from "@/components/workout-timer"
import { cn } from "@/lib/utils"

interface Exercise {
  id: string
  exercise_name: string
  sets?: number
  reps?: string
  duration_minutes?: number
  rest_seconds?: number
  notes?: string
  order_index: number
  completed: boolean
}

interface Workout {
  id: string
  workout_name: string
  day_number: number
  completed: boolean
  exercises: Exercise[]
}

interface ExerciseLog {
  exercise_id: string
  exercise_name: string
  sets_completed: number
  reps_completed: string
  weight_used: number
  duration_minutes?: number
  notes: string
}

interface PreviousLogData {
  weight_used: number
  sets_completed: number
  reps_completed: string
  notes: string
}

export function WorkoutTracker({ workout, previousLogs = {} }: { workout: Workout; previousLogs?: Record<string, PreviousLogData> }) {
  const router = useRouter()
  const [exerciseCompleted, setExerciseCompleted] = useState<Record<string, boolean>>(
    workout.exercises.reduce(
      (acc, ex) => ({
        ...acc,
        [ex.id]: ex.completed,
      }),
      {},
    ),
  )
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>(
    workout.exercises.reduce(
      (acc, ex) => {
        const prevLog = previousLogs[ex.id]
        return {
          ...acc,
          [ex.id]: {
            exercise_id: ex.id,
            exercise_name: ex.exercise_name,
            sets_completed: prevLog?.sets_completed ?? ex.sets ?? 0,
            reps_completed: prevLog?.reps_completed ?? ex.reps ?? "",
            weight_used: prevLog?.weight_used ?? 0,
            duration_minutes: ex.duration_minutes,
            notes: prevLog?.notes ?? "",
          },
        }
      },
      {},
    ),
  )
  const [sessionNotes, setSessionNotes] = useState("")
  const [sessionFeeling, setSessionFeeling] = useState<"easy" | "moderate" | "hard" | "very_hard">("moderate")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)

  const isWorkoutCompleted = workout.completed

  const updateExerciseLog = (exerciseId: string, field: string, value: string | number) => {
    setHasChanges(true)
    setExerciseLogs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      },
    }))
  }

  const handleCompleteWorkout = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          session_date: new Date().toISOString().split("T")[0],
          notes: sessionNotes,
          overall_feeling: sessionFeeling,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Log each completed exercise
      const completedExercises = Object.entries(exerciseCompleted)
        .filter(([_, completed]) => completed)
        .map(([exerciseId]) => {
          const { exercise_id: _, ...logData } = exerciseLogs[exerciseId]
          return {
            user_id: user.id,
            session_id: session.id,
            exercise_id: exerciseId,
            ...logData,
          }
        })

      if (completedExercises.length > 0) {
        const { error: logsError } = await supabase.from("exercise_logs").insert(completedExercises)
        if (logsError) throw logsError
      }

      // Update workout completion status
      const allExercisesCompleted = workout.exercises.every((ex) => exerciseCompleted[ex.id])

      if (allExercisesCompleted) {
        const { error: workoutError } = await supabase
          .from("workouts")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", workout.id)

        if (workoutError) throw workoutError
      }

      // Update individual exercise completion
      for (const [exerciseId, completed] of Object.entries(exerciseCompleted)) {
        if (completed) {
          await supabase.from("exercises").update({ completed: true }).eq("id", exerciseId)
        }
      }

      // Show success popup instead of immediately redirecting
      if (allExercisesCompleted) {
        setShowSuccess(true)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout")
    } finally {
      setIsSaving(false)
    }
  }

  const allCompleted = workout.exercises.every((ex) => exerciseCompleted[ex.id])

  return (
    <div className="space-y-6">
      {/* Celebration Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
            <Card className="border-orange-500/30 bg-zinc-900 overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-green-500/20 animate-pulse" />

              <CardContent className="relative py-12 text-center">
                {/* Trophy Icon with animation */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/30" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
                      <Trophy className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>

                {/* Congratulations text */}
                <h2 className="mb-2 text-2xl font-bold text-white">🎉 Workout Complete!</h2>
                <p className="mb-6 text-zinc-400">
                  Amazing job crushing your workout! Keep up the great work on your fitness journey.
                </p>

                {/* Motivational stats */}
                <div className="mb-6 flex justify-center gap-4">
                  <div className="rounded-lg bg-zinc-800/50 px-4 py-2">
                    <div className="text-2xl font-bold text-orange-400">{workout.exercises.length}</div>
                    <div className="text-xs text-zinc-500">Exercises</div>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 px-4 py-2">
                    <div className="text-2xl font-bold text-green-400">✓</div>
                    <div className="text-xs text-zinc-500">Completed</div>
                  </div>
                </div>

                {/* Continue button */}
                <Button
                  onClick={() => {
                    router.push("/dashboard")
                    router.refresh()
                  }}
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25"
                >
                  <PartyPopper className="mr-2 h-5 w-5" />
                  Continue to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/workouts")}
        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workouts
      </Button>

      {/* Workout Header */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
              {workout.day_number}
            </div>
            <div>
              <CardTitle className="text-white">{workout.workout_name}</CardTitle>
              <CardDescription className="text-zinc-400">
                {isWorkoutCompleted ? "Completed" : `${workout.exercises.length} exercises to complete`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Workout Timer */}
      {!isWorkoutCompleted && (
        <WorkoutTimer
          exercises={workout.exercises}
          currentExerciseIndex={currentExerciseIndex}
          onExerciseChange={setCurrentExerciseIndex}
          onComplete={(feeling, notes) => {
            setSessionFeeling(feeling as typeof sessionFeeling)
            setSessionNotes(notes)
            handleCompleteWorkout()
          }}
          exerciseLogs={exerciseLogs}
          onLogUpdate={(exerciseId, field, value) => {
            updateExerciseLog(exerciseId, field, value)
          }}
          onExerciseComplete={(exerciseId) => {
            setExerciseCompleted((prev) => ({ ...prev, [exerciseId]: true }))
            setHasChanges(true)
          }}
          exerciseCompleted={exerciseCompleted}
        />
      )}

      {/* Exercise List Header - sticky on mobile */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-zinc-950 py-2 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Exercises ({Object.values(exerciseCompleted).filter(Boolean).length}/{workout.exercises.length})
        </h3>
      </div>

      {/* Exercises - Simple Static List */}
      <div className="space-y-1">
        {workout.exercises.map((exercise, idx) => {
          const isCurrent = idx === currentExerciseIndex && !isWorkoutCompleted
          const isComplete = exerciseCompleted[exercise.id]

          return (
            <div
              key={exercise.id}
              onClick={() => {
                if (!isWorkoutCompleted) {
                  setCurrentExerciseIndex(idx)
                }
              }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                isCurrent
                  ? "bg-orange-500/10 border border-orange-500"
                  : isComplete
                    ? "bg-green-500/5 border border-green-500/30"
                    : "bg-zinc-900/50 border border-transparent hover:bg-zinc-800/50"
              )}
            >
              {/* Number/Check */}
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold flex-shrink-0",
                isComplete
                  ? "bg-green-500 text-white"
                  : isCurrent
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-800 text-zinc-400"
              )}>
                {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
              </div>

              {/* Exercise Info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  isComplete ? "text-green-400" : "text-white"
                )}>
                  {exercise.exercise_name}
                </p>
                <p className="text-xs text-zinc-500">
                  {exercise.sets && `${exercise.sets} sets`}
                  {exercise.reps && ` • ${exercise.reps}`}
                </p>
              </div>

              {/* Weight logged indicator */}
              {isComplete && exerciseLogs[exercise.id]?.weight_used > 0 && (
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                  {exerciseLogs[exercise.id].weight_used}kg
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Update button for already completed workouts */}
      {isWorkoutCompleted && hasChanges && (
        <Button onClick={handleCompleteWorkout} disabled={isSaving} size="lg" className="w-full bg-orange-500 text-white hover:bg-orange-600">
          {isSaving ? "Updating..." : "Update Workout"}
        </Button>
      )}
    </div >
  )
}
