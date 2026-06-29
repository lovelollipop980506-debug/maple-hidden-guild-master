import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-side Supabase client using the service_role key.
 * This BYPASSES Row Level Security — only ever import this from server code
 * (server components, server actions, route handlers, Netlify functions).
 * Never expose the service role key to the browser.
 */
export function supabaseAdmin() {
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
