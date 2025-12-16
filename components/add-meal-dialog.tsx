"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AddMealDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    meal_type: "breakfast",
    meal_name: "",
    description: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
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

      const { error: insertError } = await supabase.from("meals").insert({
        user_id: user.id,
        meal_date: new Date().toISOString().split("T")[0],
        meal_type: formData.meal_type,
        meal_name: formData.meal_name,
        description: formData.description || null,
        calories: Number.parseInt(formData.calories) || null,
        protein_g: Number.parseInt(formData.protein_g) || null,
        carbs_g: Number.parseInt(formData.carbs_g) || null,
        fat_g: Number.parseInt(formData.fat_g) || null,
        logged: true,
      })

      if (insertError) throw insertError

      setOpen(false)
      setFormData({
        meal_type: "breakfast",
        meal_name: "",
        description: "",
        calories: "",
        protein_g: "",
        carbs_g: "",
        fat_g: "",
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add meal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Add Meal</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Meal</DialogTitle>
          <DialogDescription>Add a meal to track your nutrition for today</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select
              value={formData.meal_type}
              onValueChange={(value) => setFormData({ ...formData, meal_type: value })}
            >
              <SelectTrigger id="meal-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-name">Meal Name</Label>
            <Input
              id="meal-name"
              required
              value={formData.meal_name}
              onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
              placeholder="Grilled chicken with rice"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the meal"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={formData.protein_g}
                onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={formData.carbs_g}
                onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={formData.fat_g}
                onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Adding..." : "Add Meal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
