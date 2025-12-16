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

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <WorkoutTracker workout={{ ...workout, exercises: sortedExercises }} />
      </div>
    </div>
  )
}
