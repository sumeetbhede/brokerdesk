import Image from "next/image";
import Link from "next/link";
import { StatusChip } from "@/components/Chips";
import { formatINR, listingSummary } from "@/lib/format";
import { photoUrl } from "@/lib/supabase/env";
import { requireProfile } from "@/lib/supabase/server";
import { LISTING_STATUSES, type Listing } from "@/lib/types";

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const { supabase } = await requireProfile();

  let query = supabase
    .from("listings")
    .select("*, listing_photos(id, path, sort)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const term = q?.replace(/[%,()]/g, " ").trim();
  if (term) query = query.or(`title.ilike.%${term}%,locality.ilike.%${term}%,project.ilike.%${term}%,builder.ilike.%${term}%`);
  const { data } = await query;
  const listings = (data ?? []) as Listing[];

  const filterHref = (s: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/properties?${qs}` : "/properties";
  };

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="h1">Properties</h1>
        <div className="flex gap-2">
          <Link href="/properties/import" className="btn-secondary btn-sm">Import</Link>
          <Link href="/properties/new" className="btn btn-sm">+ Add</Link>
        </div>
      </header>

      <form>
        {status && <input type="hidden" name="status" value={status} />}
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search title, area, project or builder" aria-label="Search properties" />
      </form>

      <div className="flex gap-2">
        {[{ id: "", label: "All" }, ...LISTING_STATUSES].map((s) => {
          const active = (status ?? "") === s.id;
          return (
            <Link
              key={s.id}
              href={filterHref(s.id)}
              className={`chip border px-3 py-1.5 ${active ? "border-brand bg-brand text-on-brand" : "border-line bg-card text-ink"}`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {listings.length === 0 ? (
        <p className="card muted">{q || status ? "No properties match." : "No properties yet. Add one, or import a builder's inventory sheet."}</p>
      ) : (
        <ul className="space-y-2">
          {listings.map((l) => {
            const cover = [...(l.listing_photos ?? [])].sort((a, b) => a.sort - b.sort)[0];
            return (
              <li key={l.id}>
                <Link href={`/properties/${l.id}`} className="card flex gap-3 !p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-subtle">
                    {cover ? (
                      <Image src={photoUrl(cover.path)} alt="" fill sizes="80px" className="object-cover" unoptimized />
                    ) : (
                      <span className="flex h-full items-center justify-center text-2xl text-faint">⌂</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{l.title}</p>
                    <p className="font-bold text-accent">{formatINR(l.price) || "Price on request"}</p>
                    <p className="muted truncate">{listingSummary(l)}</p>
                    {l.status !== "available" && <StatusChip status={l.status} />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
