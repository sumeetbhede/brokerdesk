import Link from "next/link";
import { StageChip } from "@/components/Chips";
import { budgetText } from "@/lib/format";
import { requireProfile } from "@/lib/supabase/server";
import { STAGES, type Lead } from "@/lib/types";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const { stage, q } = await searchParams;
  const { supabase } = await requireProfile();

  let query = supabase.from("leads").select("*").order("updated_at", { ascending: false }).limit(200);
  if (stage) query = query.eq("stage", stage);
  const term = q?.replace(/[%,()]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,locations.ilike.%${term}%`);
  const { data } = await query;
  const leads = (data ?? []) as Lead[];

  const filterHref = (s: string) => {
    const p = new URLSearchParams();
    if (s) p.set("stage", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/leads?${qs}` : "/leads";
  };

  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="h1">Leads</h1>
        <Link href="/leads/new" className="btn btn-sm">+ Add</Link>
      </header>

      <form>
        {stage && <input type="hidden" name="stage" value={stage} />}
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search name, phone or area" aria-label="Search leads" />
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: "", label: "All" }, ...STAGES].map((s) => {
          const active = (stage ?? "") === s.id;
          return (
            <Link
              key={s.id}
              href={filterHref(s.id)}
              className={`chip shrink-0 border px-3 py-1.5 ${active ? "border-brand bg-brand text-white" : "border-stone-300 bg-white text-stone-700"}`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <p className="card muted">{q || stage ? "No leads match." : "No leads yet. Add your first one."}</p>
      ) : (
        <ul className="space-y-2">
          {leads.map((l) => (
            <li key={l.id}>
              <Link href={`/leads/${l.id}`} className="card block">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold">{l.name}</p>
                  <StageChip stage={l.stage} />
                </div>
                <p className="muted truncate">
                  {[l.bhk ? `${l.bhk} BHK` : "", budgetText(l), l.locations].filter(Boolean).join(" · ") || l.phone || "No requirements yet"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
