"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dumbbell, Menu, X } from "lucide-react"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-lg md:text-xl font-bold text-white">
              <Dumbbell className="h-5 w-5 md:h-6 md:w-6 text-orange-500" strokeWidth={2} />
              <span className="hidden sm:inline">FitPlan AI</span>
              <span className="sm:hidden">FitPlan</span>
            </Link>
            {/* Desktop nav links */}
            <div className="hidden md:flex gap-1">
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

          <div className="flex items-center gap-2">
            {/* Desktop sign out */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="hidden md:flex border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Sign Out
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="absolute right-0 top-14 w-64 bg-zinc-900 border-l border-zinc-800 h-[calc(100vh-3.5rem)] animate-in slide-in-from-right duration-200">
            <div className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={`w-full justify-start h-12 ${pathname === item.href
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}

              <div className="border-t border-zinc-800 mt-2 pt-4">
                <Button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleLogout()
                  }}
                  variant="outline"
                  className="w-full h-12 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
