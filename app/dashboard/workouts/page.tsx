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

  // Fetch all workouts
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, exercises(*)")
    .eq("user_id", user.id)
    .order("day_number", { ascending: true })

  return (
    <div className="min-h-screen bg-muted/50">
      <DashboardNav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Workouts</h1>
            <p className="text-muted-foreground">View and manage all your workout sessions</p>
          </div>
          {activePlan && (
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/dashboard/generate-plan">Generate New Plan</Link>
            </Button>
          )}
        </div>

        {activePlan && workouts && workouts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {workouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                        {workout.day_number}
                      </div>
                      <div>
                        <CardTitle>{workout.workout_name}</CardTitle>
                        <CardDescription>{workout.exercises?.length || 0} exercises</CardDescription>
                      </div>
                    </div>
                    {workout.completed && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workout.exercises?.slice(0, 3).map((exercise: { id: string; exercise_name: string }) => (
                      <div key={exercise.id} className="text-sm text-muted-foreground">
                        • {exercise.exercise_name}
                      </div>
                    ))}
                    {workout.exercises && workout.exercises.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        • And {workout.exercises.length - 3} more exercises...
                      </div>
                    )}
                  </div>
                  <Button asChild className="mt-4 w-full" variant={workout.completed ? "outline" : "default"}>
                    <Link href={`/dashboard/workouts/${workout.id}`}>
                      {workout.completed ? "View Details" : "Start Workout"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Workouts Yet</CardTitle>
              <CardDescription>Generate a workout plan to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/dashboard/generate-plan">Generate Workout Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
