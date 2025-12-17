import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function WorkoutsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch active workout plan
  const { data: activePlan } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  // Fetch all workouts for the active plan only
  const { data: workouts } = activePlan
    ? await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("plan_id", activePlan.id)
      .order("day_number", { ascending: true })
    : { data: [] }

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav />
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Your Workouts</h1>
            <p className="text-sm md:text-base text-zinc-400">View and manage all your workout sessions</p>
          </div>
          {activePlan && (
            <Button asChild variant="outline" className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <Link href="/dashboard/generate-plan">Generate New Plan</Link>
            </Button>
          )}
        </div>

        {activePlan && workouts && workouts.length > 0 ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {workouts.map((workout) => (
              <Card key={workout.id} className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
                        {workout.day_number}
                      </div>
                      <div>
                        <CardTitle className="text-white">{workout.workout_name}</CardTitle>
                        <CardDescription className="text-zinc-400">{workout.exercises?.length || 0} exercises</CardDescription>
                      </div>
                    </div>
                    {workout.completed && (
                      <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
                        Completed
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workout.exercises?.slice(0, 3).map((exercise: { id: string; exercise_name: string }) => (
                      <div key={exercise.id} className="text-sm text-zinc-400">
                        • {exercise.exercise_name}
                      </div>
                    ))}
                    {workout.exercises && workout.exercises.length > 3 && (
                      <div className="text-sm text-zinc-400">
                        • And {workout.exercises.length - 3} more exercises...
                      </div>
                    )}
                  </div>
                  <Button asChild className={`mt-4 w-full ${workout.completed ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                    <Link href={`/dashboard/workouts/${workout.id}`}>
                      {workout.completed ? "View Details" : "Start Workout"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">No Workouts Yet</CardTitle>
              <CardDescription className="text-zinc-400">Generate a workout plan to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
                <Link href="/dashboard/generate-plan">Generate Workout Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
