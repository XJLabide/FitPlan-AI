import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>We sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {
                "We've sent you an email with a confirmation link. Please check your inbox and click the link to verify your account."
              }
            </p>
            <Button asChild className="w-full bg-transparent" variant="outline">
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
