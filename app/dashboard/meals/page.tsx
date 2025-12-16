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
    <div className="min-h-screen bg-muted/50">
      <DashboardNav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meal Planning</h1>
            <p className="text-muted-foreground">Track your nutrition and plan your meals</p>
          </div>
          <AddMealDialog />
        </div>

        {activePlan ? (
          <>
            {/* Nutrition Goals */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Calories</CardDescription>
                  <CardTitle className="text-3xl">
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

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Protein</CardDescription>
                  <CardTitle className="text-3xl">
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

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Carbs</CardDescription>
                  <CardTitle className="text-3xl">
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

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Fat</CardDescription>
                  <CardTitle className="text-3xl">
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

            {/* Today's Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Meals</CardTitle>
                <CardDescription>
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
                          <h4 className="mb-2 text-sm font-semibold capitalize">{mealType}</h4>
                          {meals.length > 0 ? (
                            <div className="space-y-2">
                              {meals.map((meal) => (
                                <div
                                  key={meal.id}
                                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                                >
                                  <div>
                                    <p className="font-medium">{meal.meal_name}</p>
                                    {meal.description && (
                                      <p className="text-sm text-muted-foreground">{meal.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right text-sm">
                                    <p className="font-semibold">{meal.calories} cal</p>
                                    <p className="text-muted-foreground">
                                      P: {meal.protein_g}g • C: {meal.carbs_g}g • F: {meal.fat_g}g
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="py-2 text-sm text-muted-foreground">No {mealType} logged yet</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No meals logged for today. Click the button above to add your first meal!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Meal Plan</CardTitle>
              <CardDescription>Set up your nutrition goals to start tracking your meals</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/dashboard/meals/create-plan">Create Meal Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
