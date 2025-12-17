import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export const maxDuration = 60

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    // Add timestamp and random seed to prompt for uniqueness
    const uniquePrompt = `${prompt}\n\nGeneration timestamp: ${Date.now()}\nVariation seed: ${Math.random().toString(36).substring(7)}`

    const { text } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      prompt: uniquePrompt,
      temperature: 0.9,
    })

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse workout plan from AI response")
    }

    const plan = JSON.parse(jsonMatch[0])

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("[v0] Error in generate-workout API:", error)

    // Check if API key is loaded (don't log the key itself)
    const hasKey = !!process.env.OPENROUTER_API_KEY;
    console.log("[v0] OPENROUTER_API_KEY present:", hasKey);

    return NextResponse.json({
      error: "Failed to generate workout plan",
      details: error instanceof Error ? error.message : String(error),
      hasKey
    }, { status: 500 })
  }
}
