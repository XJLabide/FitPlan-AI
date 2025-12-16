"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dumbbell } from "lucide-react"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/workouts", label: "Workouts" },
    { href: "/dashboard/progress", label: "Progress" },
    { href: "/dashboard/meals", label: "Meals" },
  ]

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
            <Dumbbell className="h-6 w-6 text-orange-500" strokeWidth={2} />
            FitPlan AI
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={pathname === item.href ? "default" : "ghost"}
                className={
                  pathname === item.href
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          Sign Out
        </Button>
      </div>
    </nav>
  )
}
