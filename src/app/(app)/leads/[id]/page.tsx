import Link from "next/link";
import { notFound } from "next/navigation";
import { addFollowUp, addNote, completeFollowUp, deleteLead, updateLead } from "@/app/actions";
import { Banner } from "@/components/Banner";
import { LeadFields } from "@/components/Forms";
import { ConfirmButton, StageSelect } from "@/components/Selects";
import { ShareButton } from "@/components/ShareButton";
import { budgetText, formatDate, formatDateTime, formatINR, listingSummary, matchListings, todayIST, waNumber } from "@/lib/format";
import { requireProfile } from "@/lib/supabase/server";
import type { Lead, Listing } from "@/lib/types";

interface ShareRow {
  id: string;
  created_at: string;
  listing_id: string;
  listings: { title: string } | null;
  share_views: { viewed_at: string }[];
}

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const { id } = await params;
  const { edit, error } = await searchParams;
  const { supabase, profile } = await requireProfile();

  const { data } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const lead = data as Lead;

  if (edit) {
    return (
      <>
        <header className="flex items-center justify-between">
          <h1 className="h1">Edit lead</h1>
          <Link href={`/leads/${id}`} className="text-sm font-semibold text-muted">Cancel</Link>
        </header>
        <Banner error={error} />
        <form action={updateLead.bind(null, id)} className="card space-y-4">
          <LeadFields lead={lead} />
          <button className="btn w-full">Save changes</button>
        </form>
        <div className="text-center">
          <ConfirmButton action={deleteLead.bind(null, id)} message={`Delete ${lead.name} and all their notes?`}>
            Delete lead
          </ConfirmButton>
        </div>
      </>
    );
  }

  const [notes, followUps, listings, shares] = await Promise.all([
    supabase.from("lead_notes").select("id, body, created_at").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("follow_ups").select("id, due_on, note").eq("lead_id", id).is("done_at", null).order("due_on"),
    supabase.from("listings").select("*").eq("status", "available").limit(500),
    supabase
      .from("shares")
      .select("id, created_at, listing_id, listings(title), share_views(viewed_at)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const matches = matchListings(lead, (listings.data ?? []) as Listing[]).slice(0, 10);
  const sent = (shares.data ?? []) as unknown as ShareRow[];
  const sentIds = new Set(sent.map((s) => s.listing_id));
  const today = todayIST();
  const requirements = [
    lead.bhk ? `${lead.bhk} BHK` : "",
    lead.property_type,
    budgetText(lead),
    lead.locations,
  ].filter(Boolean);
  const greeting = `Hi ${lead.name.split(" ")[0]}, ${profile.full_name.split(" ")[0] || "here"} this side.`;

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/leads" className="text-sm font-semibold text-muted">‹ Leads</Link>
          <h1 className="h1 truncate">{lead.name}</h1>
          <p className="muted">{[lead.phone, lead.source].filter(Boolean).join(" · ")}</p>
        </div>
        <Link href={`/leads/${id}?edit=1`} className="btn-secondary btn-sm">Edit</Link>
      </header>

      {lead.phone && (
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${lead.phone}`} className="btn-secondary">Call</a>
          <a href={`https://wa.me/${waNumber(lead.phone)}`} className="btn-secondary">WhatsApp</a>
        </div>
      )}

      <section className="card space-y-3">
        <div>
          <p className="label">Stage</p>
          <StageSelect leadId={id} stage={lead.stage} />
        </div>
        <div>
          <p className="label">Looking for</p>
          <p className="text-sm">{requirements.length ? requirements.join(" · ") : "No requirements yet. Tap Edit to add budget, BHK and areas."}</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Follow-ups</h2>
        {(followUps.data ?? []).map((f) => (
          <div key={f.id} className="card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${f.due_on < today ? "text-danger" : ""}`}>
                {f.due_on === today ? "Today" : formatDate(f.due_on)}
                {f.due_on < today && " (overdue)"}
              </p>
              {f.note && <p className="muted truncate">{f.note}</p>}
            </div>
            <form action={completeFollowUp.bind(null, f.id, id)}>
              <button className="btn btn-sm">Done</button>
            </form>
          </div>
        ))}
        <form action={addFollowUp.bind(null, id)} className="card flex flex-wrap items-end gap-2">
          <div className="min-w-32 flex-1">
            <label className="label" htmlFor="due_on">Next follow-up</label>
            <input className="input" id="due_on" name="due_on" type="date" min={today} required />
          </div>
          <div className="min-w-32 flex-[2]">
            <label className="label" htmlFor="fu_note">About</label>
            <input className="input" id="fu_note" name="note" placeholder="Confirm Saturday site visit" />
          </div>
          <button className="btn-secondary">Add</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Matching properties</h2>
        {matches.length === 0 && (
          <p className="card muted">No available property fits these requirements right now.</p>
        )}
        {matches.map((l) => (
          <div key={l.id} className="card space-y-2">
            <Link href={`/properties/${l.id}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{l.title}</p>
                <p className="shrink-0 font-bold text-accent">{formatINR(l.price)}</p>
              </div>
              <p className="muted">{listingSummary(l)}</p>
            </Link>
            <div className="flex items-center gap-3">
              <ShareButton
                listingId={l.id}
                leadId={id}
                leadPhone={lead.phone}
                className="btn btn-sm"
                text={`${greeting} This one fits what you're looking for: ${l.title}${l.price ? ", " + formatINR(l.price) : ""}.`}
              >
                Send on WhatsApp
              </ShareButton>
              {sentIds.has(l.id) && <span className="text-xs font-semibold text-muted">Already sent</span>}
            </div>
          </div>
        ))}
      </section>

      {sent.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">Sent to {lead.name.split(" ")[0]}</h2>
          <ul className="card divide-y divide-line !p-0">
            {sent.map((s) => {
              const last = s.share_views.map((v) => v.viewed_at).sort().at(-1);
              return (
                <li key={s.id}>
                  <Link href={`/properties/${s.listing_id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{s.listings?.title}</span>
                      <span className="muted block">Sent {formatDate(s.created_at)}</span>
                    </span>
                    {last ? (
                      <span className="chip shrink-0 bg-good-bg text-good-ink">
                        Opened {s.share_views.length}× · {formatDateTime(last)}
                      </span>
                    ) : (
                      <span className="chip shrink-0 bg-subtle text-muted">Not opened</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-bold">Notes</h2>
        <form action={addNote.bind(null, id)} className="flex gap-2">
          <input className="input" name="body" placeholder="Add a note" aria-label="Add a note" required />
          <button className="btn-secondary">Save</button>
        </form>
        {(notes.data ?? []).map((n) => (
          <div key={n.id} className="card">
            <p className="whitespace-pre-wrap text-sm">{n.body}</p>
            <p className="mt-1 text-xs text-muted">{formatDateTime(n.created_at)}</p>
          </div>
        ))}
      </section>
    </>
  );
}
