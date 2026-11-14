import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/env";

export default function SetupPage() {
  if (supabaseConfigured) redirect("/");
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-10">
      <h1 className="h1">Connect Supabase</h1>
      <p className="muted">The app can&apos;t find its database settings yet.</p>
      <ol className="card list-decimal space-y-3 pl-8 text-xs">
        <li>In the Supabase SQL Editor, run each file in <code>supabase/migrations/</code> in order.</li>
        <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill in the project URL and publishable key (Project Settings → API).</li>
        <li>Restart the app.</li>
      </ol>
    </main>
  );
}
