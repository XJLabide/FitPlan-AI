import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProgressPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch workout sessions
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })
    .limit(10)

  // Fetch exercise logs for recent sessions
  const sessionIds = sessions?.map((s) => s.id) || []
  const { data: exerciseLogs } = await supabase
    .from("exercise_logs")
    .select("*")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalSessions = sessions?.length || 0
  const avgFeeling =
    sessions && sessions.length > 0
      ? sessions
        .filter((s) => s.overall_feeling)
        .map((s) => s.overall_feeling)
        .join(", ")
      : "N/A"

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Progress</h1>
          <p className="text-zinc-400">Track your workout history and performance improvements</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-3">
              <CardDescription className="text-zinc-400">Total Sessions</CardDescription>
              <CardTitle className="text-4xl text-white">{totalSessions}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Completed workouts</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-3">
              <CardDescription className="text-zinc-400">Total Exercises</CardDescription>
              <CardTitle className="text-4xl text-white">{exerciseLogs?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Exercises logged</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-3">
              <CardDescription className="text-zinc-400">Recent Feeling</CardDescription>
              <CardTitle className="text-2xl capitalize text-white">{sessions?.[0]?.overall_feeling || "N/A"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Last workout difficulty</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Recent Workout Sessions</CardTitle>
            <CardDescription className="text-zinc-400">Your workout history and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const sessionLogs = exerciseLogs?.filter((log) => log.session_id === session.id) || []
                  return (
                    <div key={session.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {new Date(session.session_date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sessionLogs.length} exercises completed • Felt{" "}
                            <span className="capitalize">{session.overall_feeling || "N/A"}</span>
                          </p>
                          {session.notes && (
                            <p className="mt-2 text-sm italic text-muted-foreground">{session.notes}</p>
                          )}
                        </div>
                      </div>
                      {sessionLogs.length > 0 && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                          <p className="text-sm font-semibold">Exercises:</p>
                          {sessionLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between text-sm">
                              <span>{log.exercise_name}</span>
                              <span className="text-muted-foreground">
                                {log.sets_completed && `${log.sets_completed} × `}
                                {log.reps_completed}
                                {log.weight_used > 0 && ` @ ${log.weight_used}kg`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No workout sessions yet. Start your first workout to see your progress here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
