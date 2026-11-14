import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteListing, deletePhoto, updateListing } from "@/app/actions";
import { Banner } from "@/components/Banner";
import { BrochureButton } from "@/components/BrochureButton";
import { ListingFields } from "@/components/Forms";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ConfirmButton, StatusSelect } from "@/components/Selects";
import { ShareButton } from "@/components/ShareButton";
import { formatDate, formatDateTime, formatINR, listingSummary } from "@/lib/format";
import { photoUrl } from "@/lib/supabase/env";
import { requireProfile } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

interface ShareRow {
  id: string;
  created_at: string;
  leads: { id: string; name: string } | null;
  share_views: { viewed_at: string }[];
}

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; error?: string; added?: string }>;
}) {
  const { id } = await params;
  const { edit, error, added } = await searchParams;
  const { supabase, profile } = await requireProfile();

  const { data } = await supabase.from("listings").select("*, listing_photos(id, path, sort)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const listing = data as Listing;
  const photos = [...(listing.listing_photos ?? [])].sort((a, b) => a.sort - b.sort);

  if (edit) {
    return (
      <>
        <header className="flex items-center justify-between">
          <h1 className="h1">Edit property</h1>
          <Link href={`/properties/${id}`} className="text-sm font-medium text-muted">Cancel</Link>
        </header>
        <Banner error={error} />
        <form action={updateListing.bind(null, id)} className="card space-y-4">
          <ListingFields listing={listing} />
          <button className="btn w-full">Save changes</button>
        </form>
        <div className="text-center">
          <ConfirmButton action={deleteListing.bind(null, id)} message="Delete this property? Links you've shared for it will stop working.">
            Delete property
          </ConfirmButton>
        </div>
      </>
    );
  }

  const { data: shareData } = await supabase
    .from("shares")
    .select("id, created_at, leads(id, name), share_views(viewed_at)")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(30);
  const shares = (shareData ?? []) as unknown as ShareRow[];
  const totalViews = shares.reduce((n, s) => n + s.share_views.length, 0);
  const shareText = `${listing.title}${listing.price ? ", " + formatINR(listing.price) : ""}. Photos and details:`;

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/properties" className="text-sm font-medium text-muted">‹ Properties</Link>
          <h1 className="h1">{listing.title}</h1>
          <p className="text-2xl font-medium text-accent">{formatINR(listing.price) || "Price on request"}</p>
          <p className="muted">{listingSummary(listing)}</p>
        </div>
        <Link href={`/properties/${id}?edit=1`} className="btn-secondary btn-sm">Edit</Link>
      </header>

      {added && <Banner message="Property saved. Add a few photos before you share it." />}

      <section className="space-y-2">
        {photos.length > 0 && (
          <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4">
            {photos.map((p) => (
              <li key={p.id} className="relative h-48 w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-subtle">
                <Image src={photoUrl(p.path)} alt="" fill sizes="256px" className="object-cover" unoptimized />
                <ConfirmButton
                  action={deletePhoto.bind(null, p.id, id)}
                  message="Remove this photo?"
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <span aria-hidden>✕</span>
                  <span className="sr-only">Remove photo</span>
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
        <PhotoUploader orgId={profile.org_id} listingId={id} startSort={photos.length} />
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-medium">Share</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ShareButton listingId={id} text={shareText}>WhatsApp</ShareButton>
          <ShareButton listingId={id} text={shareText} mode="copy" className="btn-secondary">Copy link</ShareButton>
          <BrochureButton
            listing={listing}
            photoUrls={photos.map((p) => photoUrl(p.path))}
            broker={{ name: profile.full_name, phone: profile.phone, business: profile.organizations?.name ?? "" }}
          />
        </div>
        <p className="muted">
          Each link is tracked, so you know when it gets opened. To send it to a specific lead, open the lead and use their matching properties.
        </p>
      </section>

      <section className="card space-y-3">
        <div>
          <p className="label">Status</p>
          <StatusSelect listingId={id} status={listing.status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {[
            ["Project", listing.project],
            ["Builder", listing.builder],
            ["Floor", listing.floor],
            ["Added", formatDate(listing.created_at)],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>
        {listing.description && <p className="whitespace-pre-wrap text-xs">{listing.description}</p>}
        {listing.private_notes && (
          <div className="rounded-xl bg-warn-bg p-3">
            <p className="label !text-warn-ink">Private notes</p>
            <p className="whitespace-pre-wrap text-xs">{listing.private_notes}</p>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">
          Shared {shares.length} time{shares.length === 1 ? "" : "s"}, opened {totalViews}
        </h2>
        {shares.length > 0 && (
          <ul className="card divide-y divide-line !p-0">
            {shares.map((s) => {
              const last = s.share_views.map((v) => v.viewed_at).sort().at(-1);
              const row = (
                <>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.leads?.name ?? "General link"}</span>
                    <span className="muted block">Created {formatDate(s.created_at)}</span>
                  </span>
                  {last ? (
                    <span className="chip shrink-0 bg-good-bg text-good-ink">
                      Opened {s.share_views.length}× · {formatDateTime(last)}
                    </span>
                  ) : (
                    <span className="chip shrink-0 bg-subtle text-muted">Not opened</span>
                  )}
                </>
              );
              return (
                <li key={s.id}>
                  {s.leads ? (
                    <Link href={`/leads/${s.leads.id}`} className="flex items-center justify-between gap-3 px-4 py-3">{row}</Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-4 py-3">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
