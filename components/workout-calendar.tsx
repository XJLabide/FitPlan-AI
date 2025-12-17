"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Workout {
  id: string
  day_number: number
  workout_name: string
  scheduled_date?: string
  completed: boolean
  exercises: { id: string }[]
}

interface WorkoutCalendarProps {
  workouts: Workout[]
}

export function WorkoutCalendar({ workouts }: WorkoutCalendarProps) {
  // Initialize with the start of the current week (Sunday)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay() // 0 is Sunday
    const diff = now.getDate() - day
    return new Date(now.setDate(diff))
  })

  const previousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 7)
      return newDate
    })
  }

  const nextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 7)
      return newDate
    })
  }

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart)
      day.setDate(currentWeekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  const weekDays = getWeekDays()

  // Format range for header: "Jan 1 - Jan 7, 2024"
  const startMonth = weekDays[0].toLocaleString("default", { month: "short" })
  const endMonth = weekDays[6].toLocaleString("default", { month: "short" })
  const startDay = weekDays[0].getDate()
  const endDay = weekDays[6].getDate()
  const year = weekDays[0].getFullYear()

  const headerText = `${startMonth} ${startDay} - ${endMonth === startMonth ? "" : endMonth + " "}${endDay}, ${year}`

  const dayNameMap: { [key: string]: number } = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
    "Thursday": 4, "Friday": 5, "Saturday": 6
  }

  const getWorkoutsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.

    return workouts.filter((w) => {
      // Match by exact scheduled_date
      if (w.scheduled_date === dateStr) return true

      // Also match by day of week from workout name (e.g., "Monday - Upper Body" matches all Mondays)
      const workoutDayName = w.workout_name.split(' - ')[0]
      if (dayNameMap[workoutDayName] === dayOfWeek) return true

      return false
    })
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Weekly Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={previousWeek}
              variant="outline"
              size="icon"
              className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] text-center font-semibold text-white">
              {headerText}
            </span>
            <Button
              onClick={nextWeek}
              variant="outline"
              size="icon"
              className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-zinc-400">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {weekDays.map((date, i) => {
            const dayWorkouts = getWorkoutsForDate(date)
            const today = new Date()
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear()

            return (
              <div
                key={i}
                className={`min-h-[100px] rounded-xl border p-2 ${isToday ? "border-orange-500 bg-zinc-800" : "border-zinc-800 bg-zinc-900"
                  }`}
              >
                <div className="flex h-full flex-col">
                  <span className={`text-sm font-medium ${isToday ? "text-orange-500" : "text-white"}`}>
                    {date.getDate()}
                  </span>

                  {/* Workouts list */}
                  <div className="mt-2 flex-1 space-y-1">
                    {dayWorkouts.map((workout) => {
                      // Remove day name prefix (e.g., "Wednesday - Lower Body" -> "Lower Body")
                      const displayName = workout.workout_name.includes(' - ')
                        ? workout.workout_name.split(' - ').slice(1).join(' - ')
                        : workout.workout_name
                      return (
                        <Link key={workout.id} href={`/dashboard/workouts/${workout.id}`}>
                          <div
                            className={`truncate rounded px-1.5 py-1 text-xs font-medium transition-colors ${workout.completed
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                              }`}
                            title={workout.workout_name}
                          >
                            {displayName}
                          </div>
                        </Link>
                      )
                    })}
                    {dayWorkouts.length === 0 && (
                      <div className="flex flex-1 items-center justify-center">
                        <span className="text-[10px] text-zinc-600">Rest</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
