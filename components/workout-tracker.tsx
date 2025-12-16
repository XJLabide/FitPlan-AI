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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft } from "lucide-react"

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

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout")
    } finally {
      setIsSaving(false)
    }
  }

  const allCompleted = workout.exercises.every((ex) => exerciseCompleted[ex.id])

  return (
    <div className="space-y-6">
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

      {/* Exercises */}
      {workout.exercises.map((exercise, idx) => (
        <Card key={exercise.id} className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`completed-${exercise.id}`}
                    checked={exerciseCompleted[exercise.id]}
                    onCheckedChange={(checked) =>
                      setExerciseCompleted((prev) => ({ ...prev, [exercise.id]: checked as boolean }))
                    }
                  />
                  <Label htmlFor={`completed-${exercise.id}`} className="cursor-pointer text-lg font-semibold text-white">
                    {idx + 1}. {exercise.exercise_name}
                  </Label>
                </div>
                {exercise.notes && <p className="ml-9 mt-2 text-sm text-zinc-400">{exercise.notes}</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Planned Details */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-zinc-400">Planned</h4>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
                {exercise.sets && <span>Sets: {exercise.sets}</span>}
                {exercise.reps && <span>Reps: {exercise.reps}</span>}
                {exercise.duration_minutes && <span>Duration: {exercise.duration_minutes} min</span>}
                {exercise.rest_seconds && <span>Rest: {exercise.rest_seconds}s</span>}
              </div>
            </div>

            {/* Actual Performance */}
            {(exerciseCompleted[exercise.id] || isWorkoutCompleted) && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">
                  {isWorkoutCompleted ? "Logged Performance" : "Log Your Performance"}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {exercise.sets && (
                    <div className="space-y-2">
                      <Label htmlFor={`sets-${exercise.id}`} className="text-sm text-zinc-300">
                        Sets Completed
                      </Label>
                      <Input
                        id={`sets-${exercise.id}`}
                        type="number"
                        value={exerciseLogs[exercise.id]?.sets_completed || ""}
                        onChange={(e) =>
                          updateExerciseLog(exercise.id, "sets_completed", Number.parseInt(e.target.value))
                        }
                        className="border-zinc-800 bg-zinc-800 text-white"
                      />
                    </div>
                  )}
                  {exercise.reps && (
                    <div className="space-y-2">
                      <Label htmlFor={`reps-${exercise.id}`} className="text-sm text-zinc-300">
                        Reps Completed
                      </Label>
                      <Input
                        id={`reps-${exercise.id}`}
                        type="text"
                        value={exerciseLogs[exercise.id]?.reps_completed || ""}
                        onChange={(e) => updateExerciseLog(exercise.id, "reps_completed", e.target.value)}
                        className="border-zinc-800 bg-zinc-800 text-white"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor={`weight-${exercise.id}`} className="text-sm text-zinc-300">
                      Weight Used (kg)
                    </Label>
                    <Input
                      id={`weight-${exercise.id}`}
                      type="number"
                      step="0.5"
                      value={exerciseLogs[exercise.id]?.weight_used || ""}
                      onChange={(e) => updateExerciseLog(exercise.id, "weight_used", Number.parseFloat(e.target.value))}
                      className="border-zinc-800 bg-zinc-800 text-white"
                    />
                  </div>
                  {exercise.duration_minutes && (
                    <div className="space-y-2">
                      <Label htmlFor={`duration-${exercise.id}`} className="text-sm text-zinc-300">
                        Duration (min)
                      </Label>
                      <Input
                        id={`duration-${exercise.id}`}
                        type="number"
                        value={exerciseLogs[exercise.id]?.duration_minutes || ""}
                        onChange={(e) =>
                          updateExerciseLog(exercise.id, "duration_minutes", Number.parseInt(e.target.value))
                        }
                        className="border-zinc-800 bg-zinc-800 text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`notes-${exercise.id}`} className="text-sm text-zinc-300">
                    Exercise Notes (Optional)
                  </Label>
                  <Textarea
                    id={`notes-${exercise.id}`}
                    placeholder="How did this exercise feel? Any observations?"
                    value={exerciseLogs[exercise.id]?.notes || ""}
                    onChange={(e) => updateExerciseLog(exercise.id, "notes", e.target.value)}
                    rows={2}
                    className="border-zinc-800 bg-zinc-800 text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Session Summary */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Workout Summary</CardTitle>
          <CardDescription className="text-zinc-400">How did the overall workout feel?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-zinc-300">Overall Difficulty</Label>
            <RadioGroup
              value={sessionFeeling}
              onValueChange={(value) => setSessionFeeling(value as typeof sessionFeeling)}
            >
              <div className="flex items-center space-x-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="flex-1 cursor-pointer text-white">
                  Easy
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <RadioGroupItem value="moderate" id="moderate" />
                <Label htmlFor="moderate" className="flex-1 cursor-pointer text-white">
                  Moderate
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="flex-1 cursor-pointer text-white">
                  Hard
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <RadioGroupItem value="very_hard" id="very_hard" />
                <Label htmlFor="very_hard" className="flex-1 cursor-pointer text-white">
                  Very Hard
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-notes" className="text-zinc-300">Session Notes (Optional)</Label>
            <Textarea
              id="session-notes"
              placeholder="How did you feel during the workout? Any achievements or challenges?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={3}
              className="border-zinc-800 bg-zinc-800 text-white placeholder:text-zinc-600"
            />
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {isWorkoutCompleted ? (
            /* For completed workouts, show Update button only when changes are made */
            hasChanges && (
              <Button onClick={handleCompleteWorkout} disabled={isSaving} size="lg" className="w-full bg-orange-500 text-white hover:bg-orange-600">
                {isSaving ? "Updating..." : "Update Workout"}
              </Button>
            )
          ) : (
            /* For new workouts, show Complete Workout button */
            <>
              <Button onClick={handleCompleteWorkout} disabled={!allCompleted || isSaving} size="lg" className="w-full bg-orange-500 text-white hover:bg-orange-600">
                {isSaving ? "Saving..." : allCompleted ? "Complete Workout" : "Mark All Exercises as Complete"}
              </Button>

              {!allCompleted && (
                <p className="text-center text-sm text-zinc-500">
                  Check off all exercises to complete this workout
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
