import Link from "next/link";
import { requireProfile } from "@/lib/supabase/server";
import { ACTIVE_STAGES, STAGES } from "@/lib/types";

/** label, value, bar colour class */
type Row = [string, number, string];

const RANGES = [
  { id: "week", label: "This week", days: 7 },
  { id: "month", label: "This month", days: 30 },
  { id: "all", label: "All time", days: 0 },
];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = RANGES.find((r) => r.id === rangeParam) ?? RANGES[2];
  const { supabase } = await requireProfile();

  let query = supabase.from("leads").select("stage, source").limit(10000);
  if (range.days) query = query.gte("created_at", daysAgo(range.days));
  const { data } = await query;
  const leads = data ?? [];

  const count = (stages: string[]) => leads.filter((l) => stages.includes(l.stage)).length;
  const total = leads.length;
  const booked = count(["booked"]);
  // A booked lead was hot and visited on the way, so each step counts everyone who got at least that far.
  const funnel: Row[] = [
    ["All leads", total, "bg-brand"],
    ["Hot", count(["hot", "visited", "booked"]), "bar-hot"],
    ["Visited", count(["visited", "booked"]), "bar-visited"],
    ["Booked", booked, "bar-booked"],
  ];
  const byStatus: Row[] = STAGES.map((st) => [st.label, count([st.id]), `bar-${st.id}`]);
  const bySource = (stages: string[]) => {
    const m = new Map<string, number>();
    for (const l of leads) if (stages.includes(l.stage)) m.set(l.source || "Not set", (m.get(l.source || "Not set") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]): Row => [label, value, "bg-brand"]);
  };
  const activeBySource = bySource(ACTIVE_STAGES);
  const bookedBySource = bySource(["booked"]);
  const rate = total ? Math.round((booked / total) * 1000) / 10 : 0;

  return (
    <>
      <h1 className="h1">Analytics</h1>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Link
            key={r.id}
            href={r.id === "all" ? "/analytics" : `/analytics?range=${r.id}`}
            className={`chip border px-3 py-1.5 ${r.id === range.id ? "border-brand bg-brand text-on-brand" : "border-line bg-card text-ink"}`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {total === 0 ? (
        <p className="card muted">No leads {range.days ? "added in this period" : "yet"}. Numbers show up here as you add leads and move them along.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Tile label="Total leads" value={String(total)} />
            <Tile label="Hot right now" value={String(count(["hot"]))} tone="status-hot" />
            <Tile label="Conversion" value={`${rate}%`} />
          </div>

          <section className="card space-y-3">
            <h2 className="font-bold">Conversion funnel</h2>
            <Bars rows={funnel} max={total} showShare />
            <p className="muted">{booked} of {total} leads booked. Cold and lost leads count only in the first bar.</p>
          </section>

          <section className="card space-y-3">
            <h2 className="font-bold">Leads by status</h2>
            <Bars rows={byStatus} max={total} />
          </section>

          <section className="card space-y-3">
            <h2 className="font-bold">Active leads by source</h2>
            {activeBySource.length ? <Bars rows={activeBySource} /> : <p className="muted">No active leads in this period.</p>}
          </section>

          <section className="card space-y-3">
            <h2 className="font-bold">Bookings by source</h2>
            {bookedBySource.length ? <Bars rows={bookedBySource} /> : <p className="muted">No bookings in this period.</p>}
          </section>
        </>
      )}
    </>
  );
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString();
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`card !p-3 ${tone ? `${tone} border-transparent` : ""}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className={`text-xs ${tone ? "" : "text-muted"}`}>{label}</p>
    </div>
  );
}

function Bars({ rows, max, showShare = false }: { rows: Row[]; max?: number; showShare?: boolean }) {
  const top = max ?? Math.max(...rows.map((r) => r[1]), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map(([label, value, color]) => (
        <li key={label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span>{label}</span>
            <span className="font-semibold tabular-nums">
              {value}
              {showShare && top > 0 && <span className="ml-1.5 font-normal text-muted">{Math.round((value / top) * 100)}%</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-subtle">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${top ? Math.max((value / top) * 100, value ? 2 : 0) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
