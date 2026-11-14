import Link from "next/link";
import { completeFollowUp } from "@/app/actions";
import { StageChip } from "@/components/Chips";
import { formatDate, formatDateTime, todayIST, waNumber } from "@/lib/format";
import { requireProfile } from "@/lib/supabase/server";
import { ACTIVE_STAGES } from "@/lib/types";

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
    supabase.from("leads").select("id, name, phone, created_at").eq("stage", "hot").order("updated_at", { ascending: false }).limit(5),
    supabase
      .from("share_views")
      .select("id, viewed_at, shares(listing_id, listings(title), leads(id, name))")
      .order("viewed_at", { ascending: false })
      .limit(8),
    Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).in("stage", ACTIVE_STAGES),
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
        <h1 className="h1">{greeting()}{firstName ? `, ${firstName}` : ""}</h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Follow-ups due" value={due.length} href="#followups" />
        <Stat label="Active leads" value={counts[0].count ?? 0} href="/leads" />
        <Stat label="Available units" value={counts[1].count ?? 0} href="/properties" />
      </div>

      <section id="followups" className="space-y-2">
        <h2 className="text-sm font-medium">Follow-ups</h2>
        {due.length === 0 && <p className="card muted">Nothing due. Add a follow-up date on any lead and it shows up here.</p>}
        {due.map((f) => (
          <div key={f.id} className="card space-y-3">
            <Link href={`/leads/${f.lead_id}`} className="block">
              <p className="text-sm font-medium">{f.leads?.name}</p>
              <p className="muted">
                {f.due_on < today && <span className="font-medium text-danger">Overdue since {formatDate(f.due_on)} · </span>}
                {f.note || "Follow up"}
              </p>
            </Link>
            <div className="flex gap-2">
              {f.leads?.phone && <a href={`tel:${f.leads.phone}`} className="btn-secondary btn-sm flex-1">Call</a>}
              {f.leads?.phone && <a href={`https://wa.me/${waNumber(f.leads.phone)}`} className="btn-secondary btn-sm flex-1">WhatsApp</a>}
              <form action={completeFollowUp.bind(null, f.id, f.lead_id)} className="flex-1">
                <button className="btn btn-sm w-full">Done</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Links opened</h2>
        {recentViews.length === 0 && <p className="card muted">When a client opens a property you shared, you&apos;ll see it here.</p>}
        {recentViews.length > 0 && (
          <ul className="card divide-y divide-line !p-0">
            {recentViews.map((v) => (
              <li key={v.id}>
                <Link
                  href={v.shares?.leads ? `/leads/${v.shares.leads.id}` : `/properties/${v.shares?.listing_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{v.shares?.leads?.name ?? "Someone"} opened</span>
                    <span className="muted block truncate">{v.shares?.listings?.title}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">{formatDateTime(v.viewed_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(newLeads.data?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Hot leads</h2>
          <ul className="card divide-y divide-line !p-0">
            {newLeads.data!.map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">{l.name}</span>
                  <StageChip stage="hot" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/leads/new" className="btn">+ Add lead</Link>
        <Link href="/properties/new" className="btn-secondary">+ Add property</Link>
      </div>
    </>
  );
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card !p-3">
      <p className="text-2xl font-medium tabular-nums">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </Link>
  );
}
