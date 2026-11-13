import Link from "next/link";
import { completeFollowUp } from "@/app/actions";
import { formatDate, formatDateTime, todayIST, waNumber } from "@/lib/format";
import { requireProfile } from "@/lib/supabase/server";

interface FollowUpRow {
  id: string;
  due_on: string;
  note: string;
  lead_id: string;
  leads: { name: string; phone: string } | null;
}
interface ViewRow {
  id: string;
  viewed_at: string;
  shares: { listing_id: string; listings: { title: string } | null; leads: { id: string; name: string } | null } | null;
}

export default async function TodayPage() {
  const { supabase, profile } = await requireProfile();
  const today = todayIST();

  const [followUps, newLeads, views, counts] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("id, due_on, note, lead_id, leads(name, phone)")
      .is("done_at", null)
      .lte("due_on", today)
      .order("due_on")
      .limit(50),
    supabase.from("leads").select("id, name, phone, created_at").eq("stage", "new").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("share_views")
      .select("id, viewed_at, shares(listing_id, listings(title), leads(id, name))")
      .order("viewed_at", { ascending: false })
      .limit(8),
    Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).not("stage", "in", "(closed,lost)"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "available"),
    ]),
  ]);

  const due = (followUps.data ?? []) as unknown as FollowUpRow[];
  const recentViews = (views.data ?? []) as unknown as ViewRow[];
  const firstName = profile.full_name.split(" ")[0];

  return (
    <>
      <header>
        <p className="muted">{formatDate(today)}</p>
        <h1 className="h1">{firstName ? `Hi ${firstName}` : "Today"}</h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Follow-ups due" value={due.length} href="#followups" />
        <Stat label="Active leads" value={counts[0].count ?? 0} href="/leads" />
        <Stat label="Available units" value={counts[1].count ?? 0} href="/listings" />
      </div>

      <section id="followups" className="space-y-2">
        <h2 className="font-bold">Follow-ups</h2>
        {due.length === 0 && <p className="card muted">Nothing due. Add a follow-up date on any lead and it shows up here.</p>}
        {due.map((f) => (
          <div key={f.id} className="card flex items-center gap-3">
            <Link href={`/leads/${f.lead_id}`} className="min-w-0 flex-1">
              <p className="truncate font-semibold">{f.leads?.name}</p>
              <p className="muted truncate">
                {f.due_on < today && <span className="font-semibold text-red-600">Overdue since {formatDate(f.due_on)} · </span>}
                {f.note || "Follow up"}
              </p>
            </Link>
            {f.leads?.phone && (
              <a href={`tel:${f.leads.phone}`} className="btn-secondary btn-sm" aria-label={`Call ${f.leads.name}`}>Call</a>
            )}
            {f.leads?.phone && (
              <a href={`https://wa.me/${waNumber(f.leads.phone)}`} className="btn-secondary btn-sm" aria-label={`WhatsApp ${f.leads.name}`}>WA</a>
            )}
            <form action={completeFollowUp.bind(null, f.id, f.lead_id)}>
              <button className="btn btn-sm">Done</button>
            </form>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Links opened</h2>
        {recentViews.length === 0 && <p className="card muted">When a client opens a listing you shared, you&apos;ll see it here.</p>}
        {recentViews.length > 0 && (
          <ul className="card divide-y divide-stone-100 !p-0">
            {recentViews.map((v) => (
              <li key={v.id}>
                <Link
                  href={v.shares?.leads ? `/leads/${v.shares.leads.id}` : `/listings/${v.shares?.listing_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{v.shares?.leads?.name ?? "Someone"} opened</span>
                    <span className="muted block truncate">{v.shares?.listings?.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-stone-500">{formatDateTime(v.viewed_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(newLeads.data?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">New leads to contact</h2>
          <ul className="card divide-y divide-stone-100 !p-0">
            {newLeads.data!.map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">{l.name}</span>
                  <span className="text-xs text-stone-500">Added {formatDate(l.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/leads/new" className="btn">+ Add lead</Link>
        <Link href="/listings/new" className="btn-secondary">+ Add listing</Link>
      </div>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card !p-3">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </Link>
  );
}
