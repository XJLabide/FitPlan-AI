"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <DashboardNav />
            <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 p-4 md:p-6">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 bg-zinc-800" />
                        <Skeleton className="h-4 w-64 bg-zinc-800" />
                    </div>
                    <Skeleton className="h-10 w-32 bg-zinc-800" />
                </div>

                {/* Stats cards skeleton */}
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-zinc-800 bg-zinc-900">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-4 w-24 bg-zinc-800" />
                                <Skeleton className="h-8 w-32 mt-2 bg-zinc-800" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-40 bg-zinc-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main content skeleton */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Workout list skeleton */}
                    <Card className="border-zinc-800 bg-zinc-900">
                        <CardHeader>
                            <Skeleton className="h-6 w-40 bg-zinc-800" />
                            <Skeleton className="h-4 w-32 bg-zinc-800" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                                    <Skeleton className="h-10 w-10 rounded-full bg-zinc-700" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32 bg-zinc-700" />
                                        <Skeleton className="h-3 w-24 bg-zinc-700" />
                                    </div>
                                    <Skeleton className="h-8 w-16 bg-zinc-700" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Calendar skeleton */}
                    <Card className="border-zinc-800 bg-zinc-900">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-32 bg-zinc-800" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8 bg-zinc-800" />
                                    <Skeleton className="h-8 w-32 bg-zinc-800" />
                                    <Skeleton className="h-8 w-8 bg-zinc-800" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-2">
                                {[...Array(7)].map((_, i) => (
                                    <Skeleton key={i} className="h-4 w-full bg-zinc-800" />
                                ))}
                                {[...Array(7)].map((_, i) => (
                                    <Skeleton key={`day-${i}`} className="h-16 w-full bg-zinc-800" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export function WorkoutsSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <DashboardNav />
            <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40 bg-zinc-800" />
                        <Skeleton className="h-4 w-56 bg-zinc-800" />
                    </div>
                    <Skeleton className="h-10 w-36 bg-zinc-800" />
                </div>

                <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-zinc-800 bg-zinc-900">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full bg-zinc-800" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40 bg-zinc-800" />
                                        <Skeleton className="h-4 w-24 bg-zinc-800" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-4 w-full bg-zinc-800" />
                                <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                                <Skeleton className="h-10 w-full mt-4 bg-zinc-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function MealsSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <DashboardNav />
            <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40 bg-zinc-800" />
                        <Skeleton className="h-4 w-48 bg-zinc-800" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-36 bg-zinc-800" />
                        <Skeleton className="h-10 w-24 bg-zinc-800" />
                    </div>
                </div>

                <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-zinc-800 bg-zinc-900">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-4 w-20 bg-zinc-800" />
                                <Skeleton className="h-8 w-24 mt-2 bg-zinc-800" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-2 w-full bg-zinc-800" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader>
                        <Skeleton className="h-6 w-32 bg-zinc-800" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-lg bg-zinc-800/50 space-y-2">
                                <Skeleton className="h-5 w-32 bg-zinc-700" />
                                <Skeleton className="h-4 w-full bg-zinc-700" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-16 bg-zinc-700" />
                                    <Skeleton className="h-4 w-16 bg-zinc-700" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
