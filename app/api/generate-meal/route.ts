import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json()

        const { text } = await generateText({
            model: openrouter("google/gemini-2.0-flash-001"),
            prompt,
        })

        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("No valid JSON found in response")
        }

        const plan = JSON.parse(jsonMatch[0])

        return Response.json({ plan })
    } catch (error) {
        console.error("Meal generation error:", error)
        return Response.json(
            {
                error: "Failed to generate meal plan",
                details: error instanceof Error ? error.message : "Unknown error",
                hasApiKey: !!process.env.OPENROUTER_API_KEY,
            },
            { status: 500 }
        )
    }
}
