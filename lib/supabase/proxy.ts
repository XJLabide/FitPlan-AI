import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_FITSUPABASE_URL!,
    process.env.NEXT_PUBLIC_FITSUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to onboarding if user is authenticated but hasn't completed onboarding
  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: onboardingData } = await supabase
      .from("onboarding_data")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!onboardingData && !request.nextUrl.pathname.startsWith("/onboarding")) {
      const url = request.nextUrl.clone()
      url.pathname = "/onboarding"
      return NextResponse.redirect(url)
    }
  }

  // Redirect to login if trying to access protected routes without auth
  if (
    (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/onboarding")) &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
