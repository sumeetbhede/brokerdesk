import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { formatINR, listingSummary, waNumber } from "@/lib/format";
import { photoUrl, supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

interface Shared {
  listing: {
    title: string;
    project: string;
    builder: string;
    locality: string;
    city: string;
    property_type: string;
    bhk: number | null;
    carpet_area_sqft: number | null;
    price: number | null;
    floor: string;
    status: string;
    description: string;
  };
  photos: string[];
  broker: { name: string; phone: string; business: string } | null;
}

// WhatsApp, Facebook etc. fetch the page to build a link preview. Those aren't the client opening it.
const PREVIEW_BOTS = /whatsapp|facebookexternalhit|bot|crawler|spider|preview|slack|telegram|twitter|linkedin/i;

const load = cache(async (token: string, log: boolean, ua: string): Promise<Shared | null> => {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_share", { p_token: token, p_log: log, p_user_agent: ua });
  return (data as Shared | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const data = await load(token, false, "");
  if (!data) return { title: "Property not found" };
  const { listing, photos } = data;
  const title = [listing.title, formatINR(listing.price)].filter(Boolean).join(" · ");
  const description = listingSummary(listing);
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, images: photos[0] ? [photoUrl(photos[0])] : [] },
  };
}

export default async function SharedListingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ua = (await headers()).get("user-agent") ?? "";
  const data = await load(token, !PREVIEW_BOTS.test(ua), ua);
  if (!data) notFound();
  const { listing, photos, broker } = data;
  const wa = broker?.phone
    ? `https://wa.me/${waNumber(broker.phone)}?text=${encodeURIComponent(`Hi, I'm interested in ${listing.title}.`)}`
    : null;

  const facts = [
    ["Type", [listing.bhk ? `${listing.bhk} BHK` : "", listing.property_type].filter(Boolean).join(" ")],
    ["Carpet area", listing.carpet_area_sqft ? `${listing.carpet_area_sqft.toLocaleString("en-IN")} sq ft` : ""],
    ["Floor", listing.floor],
    ["Project", listing.project],
    ["Builder", listing.builder],
    ["Location", [listing.locality, listing.city].filter(Boolean).join(", ")],
  ].filter(([, v]) => v);

  return (
    <main className="mx-auto max-w-xl pb-28">
      {photos.length > 0 ? (
        <ul className="flex snap-x snap-mandatory overflow-x-auto bg-subtle">
          {photos.map((p, i) => (
            <li key={p} className="aspect-[4/3] w-full shrink-0 snap-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p)} alt={`${listing.title}, photo ${i + 1} of ${photos.length}`} className="h-full w-full object-cover" loading={i ? "lazy" : "eager"} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-subtle text-6xl text-faint">⌂</div>
      )}
      {photos.length > 1 && <p className="muted px-4 pt-2 text-[11px]">Swipe for {photos.length} photos</p>}

      <div className="space-y-4 px-4 pt-4">
        <header>
          {listing.status !== "available" && (
            <span className="chip mb-2 bg-warn-bg text-warn-ink">{listing.status === "sold" ? "Sold" : "On hold"}</span>
          )}
          <h1 className="h1">{listing.title}</h1>
          <p className="text-2xl font-medium text-accent">{formatINR(listing.price) || "Price on request"}</p>
        </header>

        <dl className="card grid grid-cols-2 gap-x-4 gap-y-3">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] text-muted">{k}</dt>
              <dd className="text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {listing.description && <p className="card whitespace-pre-wrap text-xs leading-relaxed">{listing.description}</p>}

        {broker && (
          <div className="card">
            <p className="text-[11px] text-muted">Shared by</p>
            <p className="text-sm font-medium">{broker.name}</p>
            {broker.business && broker.business !== broker.name && <p className="muted">{broker.business}</p>}
          </div>
        )}
      </div>

      {broker?.phone && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
            <a href={`tel:${broker.phone}`} className="btn-secondary">Call {broker.name.split(" ")[0]}</a>
            {wa && <a href={wa} className="btn">WhatsApp</a>}
          </div>
        </div>
      )}
    </main>
  );
}
