"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreateMealPlanPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    plan_name: "My Nutrition Plan",
    daily_calorie_target: "2000",
    protein_target_g: "150",
    carbs_target_g: "200",
    fat_target_g: "65",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Deactivate existing plans
      await supabase.from("meal_plans").update({ is_active: false }).eq("user_id", user.id)

      // Create new plan
      const { error: insertError } = await supabase.from("meal_plans").insert({
        user_id: user.id,
        plan_name: formData.plan_name,
        daily_calorie_target: Number.parseInt(formData.daily_calorie_target),
        protein_target_g: Number.parseInt(formData.protein_target_g),
        carbs_target_g: Number.parseInt(formData.carbs_target_g),
        fat_target_g: Number.parseInt(formData.fat_target_g),
        start_date: new Date().toISOString().split("T")[0],
        is_active: true,
      })

      if (insertError) throw insertError

      router.push("/dashboard/meals")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meal plan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <DashboardNav />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Create Meal Plan</h1>
          <p className="text-muted-foreground">Set your daily nutrition targets</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nutrition Goals</CardTitle>
            <CardDescription>Define your daily macronutrient targets based on your fitness goals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  required
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories">Daily Calorie Target</Label>
                <Input
                  id="calories"
                  type="number"
                  required
                  value={formData.daily_calorie_target}
                  onChange={(e) => setFormData({ ...formData, daily_calorie_target: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Typical range: 1500-3000 calories depending on your goals
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein Target (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    required
                    value={formData.protein_target_g}
                    onChange={(e) => setFormData({ ...formData, protein_target_g: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs Target (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    required
                    value={formData.carbs_target_g}
                    onChange={(e) => setFormData({ ...formData, carbs_target_g: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat">Fat Target (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    required
                    value={formData.fat_target_g}
                    onChange={(e) => setFormData({ ...formData, fat_target_g: e.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-semibold">Quick Guide:</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Weight Loss: Higher protein, moderate carbs, lower fat</li>
                  <li>• Muscle Building: High protein, high carbs, moderate fat</li>
                  <li>• Maintenance: Balanced macros based on activity level</li>
                </ul>
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                {isLoading ? "Creating Plan..." : "Create Plan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
