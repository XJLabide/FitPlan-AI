"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, SkipForward, Dumbbell, Clock, Flame, Check, ArrowRight, Trophy, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Exercise {
    id: string
    exercise_name: string
    sets?: number
    reps?: string
    duration_minutes?: number
    rest_seconds?: number
    notes?: string
    order_index: number
}

interface ExerciseLog {
    sets_completed: number
    reps_completed: string
    weight_used: number
}

interface WorkoutTimerProps {
    exercises: Exercise[]
    currentExerciseIndex: number
    onExerciseChange: (index: number) => void
    onComplete: (feeling: string, notes: string) => void
    exerciseLogs: Record<string, ExerciseLog>
    onLogUpdate: (exerciseId: string, field: string, value: string | number) => void
    onExerciseComplete: (exerciseId: string) => void
    exerciseCompleted: Record<string, boolean>
}

type WorkoutPhase = "ready" | "exercising" | "resting" | "logging" | "summary"

export function WorkoutTimer({
    exercises,
    currentExerciseIndex,
    onExerciseChange,
    onComplete,
    exerciseLogs,
    onLogUpdate,
    onExerciseComplete,
    exerciseCompleted,
}: WorkoutTimerProps) {
    const [phase, setPhase] = useState<WorkoutPhase>("ready")
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [currentSet, setCurrentSet] = useState(1)
    const [sessionFeeling, setSessionFeeling] = useState<"easy" | "moderate" | "hard" | "very_hard">("moderate")
    const [sessionNotes, setSessionNotes] = useState("")

    const currentExercise = exercises[currentExerciseIndex]
    const currentLog = exerciseLogs[currentExercise?.id]
    const isCurrentCompleted = exerciseCompleted[currentExercise?.id]
    const totalSets = currentExercise?.sets || 1
    const restSeconds = currentExercise?.rest_seconds || 60
    const allExercisesCompleted = Object.keys(exerciseCompleted).length === exercises.length &&
        Object.values(exerciseCompleted).every(Boolean)

    const timerProgress = restSeconds > 0 ? ((restSeconds - timeRemaining) / restSeconds) * 100 : 0

    useEffect(() => {
        // Check if all exercises are completed
        if (allExercisesCompleted && phase !== "summary") {
            setPhase("summary")
            return
        }

        setCurrentSet(1)
        if (isCurrentCompleted) {
            setPhase("logging")
        } else {
            setPhase("ready")
        }
        setIsRunning(false)
        setTimeRemaining(0)
    }, [currentExerciseIndex, isCurrentCompleted, allExercisesCompleted])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => prev - 1)
            }, 1000)
        } else if (timeRemaining === 0 && isRunning && phase === "resting") {
            setIsRunning(false)
            if (currentSet < totalSets) {
                setCurrentSet((prev) => prev + 1)
                setPhase("ready")
            } else {
                setPhase("logging")
            }
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, timeRemaining, phase, currentSet, totalSets])

    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) {
            onExerciseChange(currentExerciseIndex - 1)
        }
    }

    const handleNextExercise = useCallback(() => {
        onExerciseComplete(currentExercise.id)

        if (currentExerciseIndex < exercises.length - 1) {
            onExerciseChange(currentExerciseIndex + 1)
        } else {
            // All exercises done - show summary
            setPhase("summary")
        }
    }, [currentExerciseIndex, exercises.length, onExerciseChange, currentExercise, onExerciseComplete])

    const handleFinishWorkout = () => {
        onComplete(sessionFeeling, sessionNotes)
    }

    const startExercise = () => setPhase("exercising")

    const completeSet = () => {
        setPhase("resting")
        setTimeRemaining(restSeconds)
        setIsRunning(true)
    }

    const skipRest = () => {
        setIsRunning(false)
        setTimeRemaining(0)
        if (currentSet < totalSets) {
            setCurrentSet((prev) => prev + 1)
            setPhase("ready")
        } else {
            setPhase("logging")
        }
    }

    const toggleRestTimer = () => setIsRunning(!isRunning)
    const resetRestTimer = () => { setTimeRemaining(restSeconds); setIsRunning(false) }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progress = ((currentExerciseIndex + 1) / exercises.length) * 100
    const completedCount = Object.values(exerciseCompleted).filter(Boolean).length

    // Summary Phase - After all exercises completed
    if (phase === "summary") {
        return (
            <Card className="border-zinc-800 bg-gradient-to-br from-green-900/30 via-zinc-900 to-zinc-800 mb-4 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-green-500/20 to-transparent" />
                <CardContent className="p-6 relative">
                    {/* Celebration Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                            <Trophy className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Workout Complete! 🎉</h2>
                        <p className="text-zinc-400">{exercises.length} exercises finished</p>
                    </div>

                    {/* Difficulty Rating */}
                    <div className="mb-4">
                        <Label className="text-sm text-zinc-400 mb-2 block">How did it feel?</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { value: "easy", label: "Easy", emoji: "😊" },
                                { value: "moderate", label: "Moderate", emoji: "💪" },
                                { value: "hard", label: "Hard", emoji: "🔥" },
                                { value: "very_hard", label: "Intense", emoji: "😤" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSessionFeeling(option.value as typeof sessionFeeling)}
                                    className={cn(
                                        "p-3 rounded-lg border text-center transition-all",
                                        sessionFeeling === option.value
                                            ? "border-green-500 bg-green-500/20 text-white"
                                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                                    )}
                                >
                                    <span className="text-xl block">{option.emoji}</span>
                                    <span className="text-xs">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <Label className="text-sm text-zinc-400 mb-2 block">Quick notes (optional)</Label>
                        <Textarea
                            placeholder="Any achievements or notes about this workout?"
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            rows={2}
                            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Finish Button */}
                    <Button
                        size="lg"
                        onClick={handleFinishWorkout}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl shadow-lg shadow-green-500/25 text-lg"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Save Workout
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!currentExercise) return null

    return (
        <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 mb-4 overflow-hidden relative">
            <div className={cn(
                "absolute inset-0 opacity-10 transition-opacity duration-500",
                phase === "resting" && isRunning && "animate-pulse bg-blue-500",
                phase === "exercising" && "animate-pulse bg-orange-500",
                phase === "logging" && "bg-green-500"
            )} />

            <CardContent className="p-4 md:p-6 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-2 rounded-lg",
                            phase === "logging" ? "bg-green-500/20" : "bg-orange-500/20"
                        )}>
                            {phase === "logging" ? <Check className="h-5 w-5 text-green-500" /> : <Flame className="h-5 w-5 text-orange-500" />}
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Exercise</p>
                            <p className="text-sm font-semibold text-white">{currentExerciseIndex + 1} of {exercises.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Set</p>
                            <p className="text-sm font-semibold text-white">{phase === "logging" ? `${totalSets}/${totalSets}` : `${currentSet}/${totalSets}`}</p>
                        </div>
                        <div className={cn("p-2 rounded-lg", phase === "logging" ? "bg-green-500/20" : "bg-zinc-800")}>
                            {phase === "logging" ? <Check className="h-5 w-5 text-green-500" /> : <Dumbbell className="h-5 w-5 text-zinc-400" />}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                {/* Exercise Info */}
                <div className="text-center mb-4">
                    <div className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-medium mb-2",
                        phase === "ready" && "bg-zinc-700 text-zinc-300",
                        phase === "exercising" && "bg-orange-500/20 text-orange-400",
                        phase === "resting" && "bg-blue-500/20 text-blue-400",
                        phase === "logging" && "bg-green-500/20 text-green-400"
                    )}>
                        {phase === "ready" && `READY - SET ${currentSet}`}
                        {phase === "exercising" && `SET ${currentSet}`}
                        {phase === "resting" && "REST"}
                        {phase === "logging" && "LOG PERFORMANCE"}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{currentExercise.exercise_name}</h3>
                    {phase !== "logging" && (
                        <div className="flex justify-center gap-3 text-sm">
                            {currentExercise.sets && <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">{currentExercise.sets} sets</span>}
                            {currentExercise.reps && <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">{currentExercise.reps}</span>}
                        </div>
                    )}
                </div>

                {/* Phase: Ready */}
                {phase === "ready" && (
                    <div className="flex justify-center mb-4">
                        <Button size="lg" onClick={startExercise} className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full shadow-lg shadow-orange-500/25 text-lg">
                            <Play className="h-5 w-5 mr-2" />
                            Start Set {currentSet}
                        </Button>
                    </div>
                )}

                {/* Phase: Exercising */}
                {phase === "exercising" && (
                    <div className="flex flex-col items-center mb-4">
                        <div className="text-center mb-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <Dumbbell className="h-8 w-8 text-orange-500 mx-auto mb-1 animate-bounce" />
                            <p className="text-sm text-zinc-300">Do {currentExercise.reps || "your reps"}</p>
                        </div>
                        <Button size="lg" onClick={completeSet} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full shadow-lg shadow-green-500/25 text-lg">
                            <Check className="h-5 w-5 mr-2" />
                            Done
                        </Button>
                    </div>
                )}

                {/* Phase: Resting */}
                {phase === "resting" && (
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative w-32 h-32 mb-3">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-zinc-800" />
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={352} strokeDashoffset={352 - (352 * timerProgress) / 100} className="text-blue-500 transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={cn("text-3xl font-mono font-bold text-white", isRunning && "animate-pulse")}>{formatTime(timeRemaining)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={resetRestTimer} className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-800/50"><RotateCcw className="h-4 w-4" /></Button>
                            <Button size="lg" onClick={toggleRestTimer} className={cn("h-12 w-12 rounded-full shadow-lg", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600")}>
                                {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                            </Button>
                            <Button variant="outline" size="icon" onClick={skipRest} className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-800/50"><SkipForward className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}

                {/* Phase: Logging */}
                {phase === "logging" && currentLog && (
                    <div className="mb-4">
                        <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs text-zinc-500 mb-1 block text-center">Sets</Label>
                                    <Input type="number" value={currentLog.sets_completed || ""} onChange={(e) => onLogUpdate(currentExercise.id, "sets_completed", parseInt(e.target.value) || 0)} className="h-12 text-center bg-zinc-900 border-zinc-700 text-white text-xl font-semibold" />
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500 mb-1 block text-center">Reps</Label>
                                    <Input type="text" value={currentLog.reps_completed || ""} onChange={(e) => onLogUpdate(currentExercise.id, "reps_completed", e.target.value)} className="h-12 text-center bg-zinc-900 border-zinc-700 text-white text-xl font-semibold" />
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500 mb-1 block text-center">Weight</Label>
                                    <Input type="number" step="0.5" value={currentLog.weight_used || ""} onChange={(e) => onLogUpdate(currentExercise.id, "weight_used", parseFloat(e.target.value) || 0)} className="h-12 text-center bg-zinc-900 border-zinc-700 text-white text-xl font-semibold" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <Button size="lg" onClick={handleNextExercise} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full shadow-lg shadow-green-500/25 text-lg">
                                {currentExerciseIndex < exercises.length - 1 ? (<>Next Exercise<ArrowRight className="h-5 w-5 ml-2" /></>) : (<><Check className="h-5 w-5 mr-2" />Finish Workout</>)}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Navigation - Only when not logging */}
                {phase !== "logging" && (
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <Button variant="ghost" size="sm" onClick={handlePrevExercise} disabled={currentExerciseIndex === 0} className="text-zinc-400 hover:text-white disabled:opacity-30">
                            <ChevronLeft className="h-5 w-5 mr-1" /><span className="hidden sm:inline">Prev</span>
                        </Button>
                        <div className="flex gap-1.5 flex-wrap justify-center max-w-[60%]">
                            {exercises.map((ex, idx) => (
                                <button key={ex.id} onClick={() => onExerciseChange(idx)} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", idx === currentExerciseIndex ? "bg-orange-500 scale-125 ring-2 ring-orange-500/30" : exerciseCompleted[ex.id] ? "bg-green-500" : "bg-zinc-700 hover:bg-zinc-600")} />
                            ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setPhase("logging")} className="text-zinc-400 hover:text-white">
                            <span className="hidden sm:inline">Skip</span><ChevronRight className="h-5 w-5 ml-1" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
