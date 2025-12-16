"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-400">Sign in to continue your fitness journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-zinc-800 bg-zinc-800 text-white placeholder:text-zinc-600 focus:ring-orange-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-zinc-800 bg-zinc-800 text-white placeholder:text-zinc-600 focus:ring-orange-500"
                  />
                </div>
                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <Button
                  type="submit"
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-zinc-400">
                {"Don't have an account? "}
                <Link
                  href="/auth/sign-up"
                  className="text-orange-500 underline underline-offset-4 hover:text-orange-400"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
