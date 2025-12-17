import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dumbbell, Calendar, Activity, Sparkles, Utensils, ChevronDown } from "lucide-react"

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
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-balance text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                Your <span className="text-orange-500">AI-Powered</span> Personal Trainer
              </h1>
              <p className="text-pretty text-lg leading-relaxed text-zinc-400 md:text-xl lg:text-2xl">
                Get personalized workout plans and meal plans tailored to your fitness level, goals, and available equipment. No more gym anxiety or confusing routines.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
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

          {/* Right: Hero Image */}
          <div className="absolute right-0 top-0 hidden h-full w-1/2 lg:block">
            <div className="relative h-full w-full">
              <Image
                src="/fitness-hero.png"
                alt="Fit athletes training together"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Gradient overlays for blending - lighter for clearer image */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            </div>
            {/* Floating accent glows */}
            <div className="absolute bottom-20 left-10 h-40 w-40 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="absolute right-20 top-20 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-zinc-600" />
        </div>
      </section>

      {/* Why Choose FitPlan Section */}
      <section className="border-t border-zinc-800 bg-zinc-900 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">Why Choose FitPlan AI?</h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Everything you need to transform your fitness journey, powered by artificial intelligence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center transition-all hover:border-orange-500/50 hover:bg-zinc-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 transition-all group-hover:bg-orange-500/30">
                <Dumbbell className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">AI Workout Plans</h3>
              <p className="leading-relaxed text-zinc-400">
                Personalized workouts based on your fitness level, goals, and available equipment
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center transition-all hover:border-orange-500/50 hover:bg-zinc-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 transition-all group-hover:bg-orange-500/30">
                <Utensils className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">Smart Meal Plans</h3>
              <p className="leading-relaxed text-zinc-400">
                AI-generated nutrition plans aligned with your fitness goals and dietary preferences
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center transition-all hover:border-orange-500/50 hover:bg-zinc-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 transition-all group-hover:bg-orange-500/30">
                <Calendar className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">Easy Scheduling</h3>
              <p className="leading-relaxed text-zinc-400">
                Pick your workout days and see your plan on a visual weekly calendar
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center transition-all hover:border-orange-500/50 hover:bg-zinc-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 transition-all group-hover:bg-orange-500/30">
                <Activity className="h-8 w-8 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-white">Track Progress</h3>
              <p className="leading-relaxed text-zinc-400">
                Log your workouts, track weights, and watch your fitness journey unfold
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-800 bg-zinc-950 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Transform Your Fitness?
          </h2>
          <p className="mb-8 text-lg text-zinc-400">
            Join now and get your personalized AI workout and meal plan in minutes.
          </p>
          <Button asChild size="lg" className="bg-orange-500 px-8 text-lg text-white hover:bg-orange-600">
            <Link href="/auth/sign-up">
              <Sparkles className="mr-2 h-5 w-5" />
              Start Your Journey
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-zinc-500">
          <p>© 2025 FitPlan AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
