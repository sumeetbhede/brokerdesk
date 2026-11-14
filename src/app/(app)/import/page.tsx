import Link from "next/link";
import { requireProfile } from "@/lib/supabase/server";
import { LeadImportClient } from "./LeadImportClient";

export default async function QuickImportPage() {
  const { supabase } = await requireProfile();
  const { data } = await supabase.from("leads").select("phone").neq("phone", "").limit(5000);
  const existing = (data ?? []).map((r) => r.phone.replace(/\D/g, "").slice(-10)).filter((p) => p.length === 10);

  return (
    <>
      <header>
        <h1 className="h1">Quick Import</h1>
        <p className="muted">Add leads in seconds. Paste a list or upload an Excel sheet.</p>
      </header>
      <LeadImportClient existingPhones={existing} />
      <Link href="/properties/import" className="card flex items-center justify-between">
        <span>
          <span className="block font-medium">Import properties instead</span>
          <span className="muted block">Upload a builder&apos;s inventory sheet</span>
        </span>
        <span className="text-accent" aria-hidden>›</span>
      </Link>
    </>
  );
}
