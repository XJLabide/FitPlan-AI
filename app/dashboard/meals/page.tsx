import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AddMealDialog } from "@/components/add-meal-dialog"

export default async function MealsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch active meal plan
  const { data: activePlan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  // Fetch today's meals
  const today = new Date().toISOString().split("T")[0]
  const { data: todayMeals } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .eq("meal_date", today)
    .order("meal_type", { ascending: true })

  // Calculate today's totals
  const todayTotals = todayMeals?.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein_g || 0),
      carbs: acc.carbs + (meal.carbs_g || 0),
      fat: acc.fat + (meal.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Meal Planning</h1>
            <p className="text-zinc-400">Track your nutrition and plan your meals</p>
          </div>
          <AddMealDialog />
        </div>

        {activePlan ? (
          <>
            {/* Nutrition Goals */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardDescription className="text-zinc-400">Calories</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {todayTotals?.calories || 0}
                    <span className="text-lg font-normal text-muted-foreground">
                      {" "}
                      / {activePlan.daily_calorie_target}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(((todayTotals?.calories || 0) / activePlan.daily_calorie_target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardDescription className="text-zinc-400">Protein</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {todayTotals?.protein || 0}g
                    <span className="text-lg font-normal text-muted-foreground"> / {activePlan.protein_target_g}g</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-chart-2 transition-all"
                      style={{
                        width: `${Math.min(((todayTotals?.protein || 0) / activePlan.protein_target_g) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardDescription className="text-zinc-400">Carbs</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {todayTotals?.carbs || 0}g
                    <span className="text-lg font-normal text-muted-foreground"> / {activePlan.carbs_target_g}g</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-chart-3 transition-all"
                      style={{
                        width: `${Math.min(((todayTotals?.carbs || 0) / activePlan.carbs_target_g) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardDescription className="text-zinc-400">Fat</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {todayTotals?.fat || 0}g
                    <span className="text-lg font-normal text-muted-foreground"> / {activePlan.fat_target_g}g</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-chart-4 transition-all"
                      style={{
                        width: `${Math.min(((todayTotals?.fat || 0) / activePlan.fat_target_g) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Today's Meals</CardTitle>
                <CardDescription className="text-zinc-400">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayMeals && todayMeals.length > 0 ? (
                  <div className="space-y-3">
                    {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                      const meals = todayMeals.filter((m) => m.meal_type === mealType)
                      return (
                        <div key={mealType}>
                          <h4 className="mb-2 text-sm font-semibold capitalize text-zinc-400">{mealType}</h4>
                          {meals.length > 0 ? (
                            <div className="space-y-2">
                              {meals.map((meal) => (
                                <div
                                  key={meal.id}
                                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                                >
                                  <div>
                                    <p className="font-medium text-white">{meal.meal_name}</p>
                                    {meal.description && (
                                      <p className="text-sm text-zinc-400">{meal.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right text-sm">
                                    <p className="font-semibold text-orange-500">{meal.calories} cal</p>
                                    <p className="text-zinc-500">
                                      P: {meal.protein_g}g • C: {meal.carbs_g}g • F: {meal.fat_g}g
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="py-2 text-sm text-zinc-500">No {mealType} logged yet</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500">
                    <p>No meals logged for today. Click the button above to add your first meal!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Create Your Meal Plan</CardTitle>
              <CardDescription className="text-zinc-400">Set up your nutrition goals to start tracking your meals</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
                <Link href="/dashboard/meals/generate-plan">Generate Meal Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
