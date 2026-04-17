
import { createSupabaseServerClient } from "./supabase-server";

export async function getSession() {
   
    // Create the server client using your createSupabaseServerClient
    const supabase = await createSupabaseServerClient()
    // Call supabase.auth.getUser() — not getSession(), always use getUser() as it validates the token with Supabase servers
    const { data: { user } } = await supabase.auth.getUser()
    // Return the user or null
   return user ?? null
}