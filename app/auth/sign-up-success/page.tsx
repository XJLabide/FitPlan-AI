import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
            <CardDescription className="text-zinc-400">We sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              {
                "We've sent you an email with a confirmation link. Please check your inbox and click the link to verify your account."
              }
            </p>
            <Button asChild className="w-full bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
