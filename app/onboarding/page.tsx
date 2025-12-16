"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Check, Sparkles } from "lucide-react"
import type { OnboardingData, FitnessLevel, FitnessGoal, EquipmentOption } from "@/lib/types"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<OnboardingData>({
    fitness_level: "beginner",
    primary_goal: "general_fitness",
    available_days: 3,
    session_duration: 45,
    equipment_access: [],
    injuries_limitations: "",
  })

  const equipmentOptions: { value: EquipmentOption; label: string }[] = [
    { value: "bodyweight_only", label: "Bodyweight Only" },
    { value: "dumbbells", label: "Dumbbells" },
    { value: "barbell", label: "Barbell" },
    { value: "resistance_bands", label: "Resistance Bands" },
    { value: "kettlebell", label: "Kettlebell" },
    { value: "pull_up_bar", label: "Pull-up Bar" },
    { value: "bench", label: "Bench" },
    { value: "cable_machine", label: "Cable Machine" },
    { value: "cardio_equipment", label: "Cardio Equipment" },
    { value: "full_gym", label: "Full Gym Access" },
  ]

  const handleEquipmentChange = (equipment: EquipmentOption, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      equipment_access: checked
        ? [...prev.equipment_access, equipment]
        : prev.equipment_access.filter((e) => e !== equipment),
    }))
  }

  const handleSubmit = async () => {
    if (formData.equipment_access.length === 0) {
      setError("Please select at least one equipment option")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      const { error: insertError } = await supabase.from("onboarding_data").insert({
        user_id: user.id,
        ...formData,
      })

      if (insertError) throw insertError

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Let's Personalize Your Fitness Plan</CardTitle>
            <CardDescription className="text-zinc-400">
              Step {step} of 4 - Help us understand your fitness goals and preferences
            </CardDescription>
            <div className="mt-6 flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      s < step
                        ? "bg-orange-500 text-white"
                        : s === step
                          ? "border-2 border-orange-500 bg-orange-500 text-white"
                          : "border-2 border-zinc-800 bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {s < step ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 4 && <div className={`h-0.5 w-8 ${s < step ? "bg-orange-500" : "bg-zinc-800"}`} />}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Fitness Level */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white">What's your current fitness level?</Label>
                  <RadioGroup
                    value={formData.fitness_level}
                    onValueChange={(value) => setFormData({ ...formData, fitness_level: value as FitnessLevel })}
                  >
                    <div
                      className={`flex items-start space-x-3 rounded-xl border p-4 transition-all ${
                        formData.fitness_level === "beginner"
                          ? "border-orange-500 bg-zinc-800"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <RadioGroupItem value="beginner" id="beginner" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="beginner" className="cursor-pointer font-semibold text-white">
                          Beginner
                        </Label>
                        <p className="text-sm leading-relaxed text-zinc-400">
                          New to working out or getting back after a break
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 rounded-xl border p-4 transition-all ${
                        formData.fitness_level === "intermediate"
                          ? "border-orange-500 bg-zinc-800"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <RadioGroupItem value="intermediate" id="intermediate" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="intermediate" className="cursor-pointer font-semibold text-white">
                          Intermediate
                        </Label>
                        <p className="text-sm leading-relaxed text-zinc-400">
                          Regular workout routine for 6+ months, comfortable with basic exercises
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 rounded-xl border p-4 transition-all ${
                        formData.fitness_level === "advanced"
                          ? "border-orange-500 bg-zinc-800"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="advanced" className="cursor-pointer font-semibold text-white">
                          Advanced
                        </Label>
                        <p className="text-sm leading-relaxed text-zinc-400">
                          Experienced with strength training and various workout programs
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <Button onClick={() => setStep(2)} className="w-full bg-orange-500 text-white hover:bg-orange-600">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Primary Goal */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white">What's your primary fitness goal?</Label>
                  <RadioGroup
                    value={formData.primary_goal}
                    onValueChange={(value) => setFormData({ ...formData, primary_goal: value as FitnessGoal })}
                  >
                    {[
                      { value: "lose_weight", label: "Lose Weight" },
                      { value: "build_muscle", label: "Build Muscle" },
                      { value: "improve_endurance", label: "Improve Endurance" },
                      { value: "general_fitness", label: "General Fitness & Health" },
                      { value: "increase_flexibility", label: "Increase Flexibility" },
                    ].map((goal) => (
                      <div
                        key={goal.value}
                        className={`flex items-center space-x-3 rounded-xl border p-4 transition-all ${
                          formData.primary_goal === goal.value
                            ? "border-orange-500 bg-zinc-800"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <RadioGroupItem value={goal.value} id={goal.value} />
                        <Label htmlFor={goal.value} className="flex-1 cursor-pointer font-medium text-white">
                          {goal.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Schedule & Duration */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white">How many days per week can you work out?</Label>
                  <RadioGroup
                    value={formData.available_days.toString()}
                    onValueChange={(value) => setFormData({ ...formData, available_days: Number.parseInt(value) })}
                  >
                    {[3, 4, 5, 6, 7].map((days) => (
                      <div
                        key={days}
                        className={`flex items-center space-x-3 rounded-xl border p-4 transition-all ${
                          formData.available_days === days
                            ? "border-orange-500 bg-zinc-800"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <RadioGroupItem value={days.toString()} id={`days-${days}`} />
                        <Label htmlFor={`days-${days}`} className="flex-1 cursor-pointer font-medium text-white">
                          {days} days per week
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white">How long can each workout session be?</Label>
                  <RadioGroup
                    value={formData.session_duration.toString()}
                    onValueChange={(value) => setFormData({ ...formData, session_duration: Number.parseInt(value) })}
                  >
                    {[30, 45, 60, 90].map((duration) => (
                      <div
                        key={duration}
                        className={`flex items-center space-x-3 rounded-xl border p-4 transition-all ${
                          formData.session_duration === duration
                            ? "border-orange-500 bg-zinc-800"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                        <Label
                          htmlFor={`duration-${duration}`}
                          className="flex-1 cursor-pointer font-medium text-white"
                        >
                          {duration} minutes
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Equipment & Limitations */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white">What equipment do you have access to?</Label>
                  <p className="text-sm text-zinc-400">Select all that apply</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {equipmentOptions.map((equipment) => (
                      <div
                        key={equipment.value}
                        className={`flex items-center space-x-3 rounded-xl border p-4 transition-all ${
                          formData.equipment_access.includes(equipment.value)
                            ? "border-orange-500 bg-zinc-800"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <Checkbox
                          id={equipment.value}
                          checked={formData.equipment_access.includes(equipment.value)}
                          onCheckedChange={(checked) => handleEquipmentChange(equipment.value, checked as boolean)}
                        />
                        <Label htmlFor={equipment.value} className="flex-1 cursor-pointer font-medium text-white">
                          {equipment.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="injuries" className="text-lg font-semibold text-white">
                    Any injuries or physical limitations? (Optional)
                  </Label>
                  <Textarea
                    id="injuries"
                    placeholder="E.g., lower back issues, shoulder injury, knee problems..."
                    value={formData.injuries_limitations}
                    onChange={(e) => setFormData({ ...formData, injuries_limitations: e.target.value })}
                    rows={4}
                    className="border-zinc-800 bg-zinc-800 text-white placeholder:text-zinc-600 focus:ring-orange-500"
                  />
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(3)}
                    variant="outline"
                    className="flex-1 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Creating your plan..."
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
