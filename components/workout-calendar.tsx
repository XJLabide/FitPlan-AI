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
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getWorkoutsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return workouts.filter((w) => w.scheduled_date === dateStr)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Workout Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={previousMonth}
              variant="outline"
              size="icon"
              className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              onClick={nextMonth}
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

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square p-2" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayWorkouts = getWorkoutsForDate(day)
            const today = new Date()
            const isToday =
              day === today.getDate() &&
              currentDate.getMonth() === today.getMonth() &&
              currentDate.getFullYear() === today.getFullYear()

            return (
              <div
                key={day}
                className={`aspect-square rounded-xl border p-2 ${
                  isToday ? "border-orange-500 bg-zinc-800" : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className="flex h-full flex-col">
                  <span className={`text-sm font-medium ${isToday ? "text-orange-500" : "text-white"}`}>{day}</span>
                  <div className="mt-1 flex-1 space-y-1">
                    {dayWorkouts.slice(0, 2).map((workout) => (
                      <Link key={workout.id} href={`/dashboard/workouts/${workout.id}`}>
                        <div
                          className={`rounded px-1 py-0.5 text-xs ${
                            workout.completed ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {workout.workout_name.substring(0, 10)}
                          {workout.workout_name.length > 10 ? "..." : ""}
                        </div>
                      </Link>
                    ))}
                    {dayWorkouts.length > 2 && <div className="text-xs text-zinc-400">+{dayWorkouts.length - 2}</div>}
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
