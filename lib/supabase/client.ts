import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_FITSUPABASE_URL!, process.env.NEXT_PUBLIC_FITSUPABASE_ANON_KEY!)
}
