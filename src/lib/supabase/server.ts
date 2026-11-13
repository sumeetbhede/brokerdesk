import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./env";
import type { Profile } from "../types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a Server Component; the proxy refreshes the session instead
        }
      },
    },
  });
}

/** Signed-in user's profile, or a redirect to /login. */
export async function requireProfile() {
  if (!supabaseConfigured) redirect("/setup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, full_name, phone, role, organizations(name)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login?error=" + encodeURIComponent("Profile not found. Was the database migration run?"));
  return { supabase, user, profile: profile as unknown as Profile };
}
