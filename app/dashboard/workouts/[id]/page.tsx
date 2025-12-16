import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { WorkoutTracker } from "@/components/workout-tracker"

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch workout with exercises
  const { data: workout } = await supabase
    .from("workouts")
    .select("*, exercises(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!workout) {
    redirect("/dashboard/workouts")
  }

  // Sort exercises by order_index
  const sortedExercises = workout.exercises?.sort(
    (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index,
  )

  // If workout is completed, fetch the most recent exercise logs
  let previousLogs: Record<string, { weight_used: number; sets_completed: number; reps_completed: string; notes: string }> = {}

  if (workout.completed) {
    // Get the most recent workout session for this workout
    const { data: session } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("workout_id", workout.id)
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .limit(1)
      .single()

    if (session) {
      // Get exercise logs from that session
      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("session_id", session.id)

      if (logs) {
        previousLogs = logs.reduce((acc: Record<string, { weight_used: number; sets_completed: number; reps_completed: string; notes: string }>, log: { exercise_id: string; weight_used: number; sets_completed: number; reps_completed: string; notes: string }) => ({
          ...acc,
          [log.exercise_id]: {
            weight_used: log.weight_used || 0,
            sets_completed: log.sets_completed || 0,
            reps_completed: log.reps_completed || "",
            notes: log.notes || "",
          },
        }), {})
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <WorkoutTracker
          workout={{ ...workout, exercises: sortedExercises }}
          previousLogs={previousLogs}
        />
      </div>
    </div>
  )
}
