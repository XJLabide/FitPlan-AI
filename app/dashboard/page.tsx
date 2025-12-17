import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Dumbbell, Flame, CalendarIcon, ChevronRight, Sparkles, Play, TrendingUp, Settings } from "lucide-react"
import { WorkoutCalendar } from "@/components/workout-calendar"

export default async function DashboardPage() {
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
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch workouts for the active plan only
  const { data: workouts } = activePlan
    ? await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("plan_id", activePlan.id)
      .order("day_number", { ascending: true })
    : { data: [] }

  // Fetch recent workout sessions
  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })
    .limit(5)

  // Calculate stats
  const totalWorkouts = workouts?.length || 0
  const completedWorkouts = workouts?.filter((w) => w.completed).length || 0
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

  // Get current week workouts (for weekly view)
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - currentDay) // Start from Sunday

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav />
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-sm md:text-base text-zinc-400">Stay consistent with your fitness journey</p>
          </div>
          <div className="flex gap-3">
            {activePlan ? (
              <Button
                asChild
                variant="outline"
                className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <Link href="/dashboard/generate-plan">
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Plan
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
                <Link href="/dashboard/generate-plan">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Workout Plan
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-zinc-400">Active Plan</CardDescription>
                <Dumbbell className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
              <CardTitle className="text-2xl text-white">
                {activePlan ? activePlan.plan_name : "No Active Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-zinc-400">
                {activePlan ? activePlan.description : "Generate a plan to get started."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-zinc-400">Completion Rate</CardDescription>
                <Flame className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
              <CardTitle className="text-4xl text-white">{completionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                {completedWorkouts} of {totalWorkouts} workouts completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-zinc-400">Total Sessions</CardDescription>
                <TrendingUp className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
              <CardTitle className="text-4xl text-white">{recentSessions?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Logged workout sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Workout Calendar - Always Visible */}
        <div className="grid gap-6">
          <WorkoutCalendar workouts={workouts || []} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Your Workout Plan - Show if plan exists, else show call to action */}
          {activePlan && workouts && workouts.length > 0 ? (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Your Workout Plan</CardTitle>
                    <CardDescription className="text-zinc-400">All workouts in your program</CardDescription>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Link href="/dashboard/generate-plan">
                      <Settings className="mr-2 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-xs font-semibold text-orange-500">
                          {workout.day_number}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{workout.workout_name}</h4>
                          <p className="text-xs text-zinc-400">{workout.exercises?.length || 0} exercises</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workout.completed && (
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                            Done
                          </span>
                        )}
                        <Button asChild size="sm" className="h-8 bg-orange-500 text-xs text-white hover:bg-orange-600">
                          <Link href={`/dashboard/workouts/${workout.id}`}>
                            <Play className="mr-1 h-3 w-3" />
                            {workout.completed ? "Redo" : "Start"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900 h-full">
              <CardHeader>
                <CardTitle className="text-white">Get Started</CardTitle>
                <CardDescription className="text-zinc-400">
                  Generate a personalized workout plan to see your schedule here.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Sparkles className="h-12 w-12 text-zinc-700 mb-4" />
                <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
                  <Link href="/dashboard/generate-plan">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Workout Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Workout Logs - Always Visible */}
          <Card className="border-zinc-800 bg-zinc-900 h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Workout Logs</CardTitle>
                  <CardDescription className="text-zinc-400">Your latest training sessions</CardDescription>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <Link href="/dashboard/progress">
                    View All
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {recentSessions && recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">
                            {new Date(session.session_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-zinc-400">
                            Felt{" "}
                            <span className="capitalize text-orange-500">{session.overall_feeling || "N/A"}</span>
                          </p>
                          {session.notes && <p className="mt-2 text-xs italic text-zinc-500">{session.notes}</p>}
                        </div>
                        <div className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                          Completed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                  <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-zinc-700" strokeWidth={1.5} />
                  <p className="text-sm text-zinc-500">No workout logs yet</p>
                  <p className="mt-1 text-xs text-zinc-600">Start a workout to track your progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!activePlan && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Get Started with Your First Workout Plan</CardTitle>
              <CardDescription className="text-zinc-400">
                Generate a personalized workout plan tailored to your fitness goals and available equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
                <Link href="/dashboard/generate-plan">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Workout Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
