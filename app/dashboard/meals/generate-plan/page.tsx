"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { generateMealPlan, type GeneratedMealPlan, type MealPlanInput } from "@/lib/ai/meal-generator"
import type { OnboardingData } from "@/lib/types"
import { Sparkles, Utensils } from "lucide-react"

const dietaryOptions = [
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten_free", label: "Gluten-Free" },
    { value: "dairy_free", label: "Dairy-Free" },
    { value: "nut_free", label: "Nut-Free" },
    { value: "low_carb", label: "Low Carb" },
    { value: "high_protein", label: "High Protein" },
]

// Wrapper component to handle Suspense boundary for useSearchParams
export default function GenerateMealPlanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950">
                <DashboardNav />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
                        <p className="mt-4 text-zinc-400">Loading...</p>
                    </div>
                </div>
            </div>
        }>
            <GenerateMealPlanContent />
        </Suspense>
    )
}

function GenerateMealPlanContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const hasAutoStarted = useRef(false)

    const [step, setStep] = useState<"preferences" | "generating" | "preview">("preferences")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null)
    const [preferences, setPreferences] = useState<MealPlanInput>({
        fitness_goal: "",
        dietary_preferences: [],
    })

    const handlePreferenceChange = (preference: string, checked: boolean) => {
        setPreferences((prev) => ({
            ...prev,
            dietary_preferences: checked
                ? [...prev.dietary_preferences, preference]
                : prev.dietary_preferences.filter((p) => p !== preference),
        }))
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        setStep("generating")
        setError(null)

        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error("Not authenticated")

            // Fetch onboarding data
            const { data: onboardingData, error: fetchError } = await supabase
                .from("onboarding_data")
                .select("*")
                .eq("user_id", user.id)
                .single()

            if (fetchError || !onboardingData) {
                throw new Error("Could not fetch your fitness profile. Please complete onboarding first.")
            }

            const plan = await generateMealPlan(onboardingData as OnboardingData, {
                ...preferences,
                fitness_goal: onboardingData.primary_goal,
            })

            setGeneratedPlan(plan)
            setStep("preview")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate meal plan")
            setStep("preferences")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSavePlan = async () => {
        if (!generatedPlan) return

        setIsSaving(true)
        setError(null)

        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error("Not authenticated")

            // Deactivate existing plans
            await supabase.from("meal_plans").update({ is_active: false }).eq("user_id", user.id)

            // Create new meal plan
            const { data: planData, error: planError } = await supabase
                .from("meal_plans")
                .insert({
                    user_id: user.id,
                    plan_name: generatedPlan.plan_name,
                    daily_calorie_target: generatedPlan.daily_calorie_target,
                    protein_target_g: generatedPlan.protein_target_g,
                    carbs_target_g: generatedPlan.carbs_target_g,
                    fat_target_g: generatedPlan.fat_target_g,
                    start_date: new Date().toISOString().split("T")[0],
                    is_active: true,
                })
                .select()
                .single()

            if (planError) throw planError

            // Insert meals for today
            const today = new Date().toISOString().split("T")[0]
            const mealsToInsert = generatedPlan.meals.map((meal) => ({
                plan_id: planData.id,
                user_id: user.id,
                meal_date: today,
                meal_type: meal.meal_type,
                meal_name: meal.meal_name,
                description: meal.description,
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fat_g: meal.fat_g,
                logged: false,
            }))

            const { error: mealsError } = await supabase.from("meals").insert(mealsToInsert)
            if (mealsError) throw mealsError

            router.push("/dashboard/meals")
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save meal plan")
        } finally {
            setIsSaving(false)
        }
    }

    // Auto-generate if coming from onboarding
    useEffect(() => {
        const auto = searchParams.get("auto")
        if (auto === "true" && !hasAutoStarted.current && step === "preferences") {
            hasAutoStarted.current = true
            handleGenerate()
        }
    }, [searchParams, step])

    return (
        <div className="min-h-screen bg-zinc-950">
            <DashboardNav />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Generate Your Meal Plan</h1>
                    <p className="text-zinc-400">Let AI create a personalized nutrition plan based on your goals</p>
                </div>

                {step === "preferences" && (
                    <Card className="border-zinc-800 bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="text-white">Dietary Preferences</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Select any dietary restrictions or preferences (optional)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {dietaryOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`flex items-center space-x-3 rounded-xl border p-4 transition-all cursor-pointer ${preferences.dietary_preferences.includes(option.value)
                                            ? "border-orange-500 bg-zinc-800"
                                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                            }`}
                                        onClick={() =>
                                            handlePreferenceChange(
                                                option.value,
                                                !preferences.dietary_preferences.includes(option.value)
                                            )
                                        }
                                    >
                                        <Checkbox
                                            id={option.value}
                                            checked={preferences.dietary_preferences.includes(option.value)}
                                            onCheckedChange={(checked) => handlePreferenceChange(option.value, checked as boolean)}
                                        />
                                        <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium text-white">
                                            {option.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                size="lg"
                                className="w-full bg-orange-500 text-white hover:bg-orange-600"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Generate Meal Plan
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === "generating" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
                        <div className="relative text-center">
                            {/* Animated background circles */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="absolute h-64 w-64 animate-ping rounded-full bg-orange-500/10" style={{ animationDuration: '3s' }} />
                                <div className="absolute h-48 w-48 animate-ping rounded-full bg-orange-500/20" style={{ animationDuration: '2s' }} />
                                <div className="absolute h-32 w-32 animate-ping rounded-full bg-orange-500/30" style={{ animationDuration: '1s' }} />
                            </div>

                            {/* Main spinner container */}
                            <div className="relative mb-8">
                                {/* Outer rotating ring */}
                                <div className="h-32 w-32 animate-spin rounded-full border-4 border-zinc-800" style={{ animationDuration: '3s' }}>
                                    <div className="absolute left-0 top-0 h-4 w-4 -translate-x-1 -translate-y-1 rounded-full bg-orange-500" />
                                </div>

                                {/* Inner counter-rotating ring */}
                                <div className="absolute inset-4 animate-spin rounded-full border-4 border-zinc-700" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
                                    <div className="absolute right-0 top-1/2 h-3 w-3 translate-x-1 -translate-y-1/2 rounded-full bg-green-500" />
                                </div>

                                {/* Center icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
                                        <Sparkles className="h-8 w-8 text-white animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            {/* Text content */}
                            <h2 className="mb-2 text-2xl font-bold text-white">Crafting Your Meal Plan</h2>
                            <p className="mb-4 text-zinc-400">Our AI is analyzing your preferences...</p>

                            {/* Animated steps */}
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center justify-center gap-2 text-green-400 animate-pulse">
                                    <div className="h-2 w-2 rounded-full bg-green-400" />
                                    Calculating macros...
                                </div>
                                <div className="flex items-center justify-center gap-2 text-orange-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
                                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                                    Selecting recipes...
                                </div>
                                <div className="flex items-center justify-center gap-2 text-zinc-500 animate-pulse" style={{ animationDelay: '1s' }}>
                                    <div className="h-2 w-2 rounded-full bg-zinc-500" />
                                    Optimizing nutrition...
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === "preview" && generatedPlan && (
                    <div className="space-y-6">
                        <Card className="border-zinc-800 bg-zinc-900">
                            <CardHeader>
                                <CardTitle className="text-white">{generatedPlan.plan_name}</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    {generatedPlan.daily_calorie_target} cal • {generatedPlan.protein_target_g}g protein •{" "}
                                    {generatedPlan.carbs_target_g}g carbs • {generatedPlan.fat_target_g}g fat
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                            const meals = generatedPlan.meals.filter((m) => m.meal_type === mealType)
                            if (meals.length === 0) return null
                            return (
                                <Card key={mealType} className="border-zinc-800 bg-zinc-900">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white capitalize">
                                            <Utensils className="h-5 w-5 text-orange-500" />
                                            {mealType}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {meals.map((meal, idx) => (
                                                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-white">{meal.meal_name}</h4>
                                                            <p className="mt-1 text-sm text-zinc-400">{meal.description}</p>
                                                        </div>
                                                        <div className="text-right text-sm">
                                                            <p className="font-semibold text-orange-500">{meal.calories} cal</p>
                                                            <p className="text-zinc-500">
                                                                P: {meal.protein_g}g • C: {meal.carbs_g}g • F: {meal.fat_g}g
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setGeneratedPlan(null)
                                    setStep("preferences")
                                }}
                                variant="outline"
                                className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                                Generate New Plan
                            </Button>
                            <Button
                                onClick={handleSavePlan}
                                disabled={isSaving}
                                className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
                            >
                                {isSaving ? "Saving..." : "Save & Start Plan"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
