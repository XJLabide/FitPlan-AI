import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Calendar, Activity, Sparkles } from "lucide-react"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
              Your <span className="text-orange-500">AI-Powered</span> Personal Trainer
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-zinc-400 md:text-xl lg:text-2xl">
              Get personalized workout plans tailored to your fitness level, goals, and available equipment. No more gym
              anxiety or confusing routines.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-orange-500 text-lg text-white hover:bg-orange-600">
              <Link href="/auth/sign-up">
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-zinc-800 bg-transparent text-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-900 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Why Choose FitPlan AI?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20">
                <Dumbbell className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">Personalized Plans</h3>
              <p className="leading-relaxed text-zinc-400">
                AI-generated workouts based on your fitness level, goals, and available equipment
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20">
                <Calendar className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">Easy Scheduling</h3>
              <p className="leading-relaxed text-zinc-400">
                Visual calendar to plan and track your workouts with flexible scheduling
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20">
                <Activity className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">Track Progress</h3>
              <p className="leading-relaxed text-zinc-400">
                Monitor your workouts, log exercises, and see your fitness journey unfold
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
