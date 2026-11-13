import type { Lead, Listing } from "./types";

/** 8500000 -> "₹85 L", 12500000 -> "₹1.25 Cr" */
export function formatINR(n: number | null | undefined) {
  if (n == null) return "";
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Accepts "85L", "85 lakh", "1.2cr", "8500000", "85,00,000". */
export function parseINR(input: unknown): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input) : null;
  const s = String(input).toLowerCase().replace(/[₹,\s]|rs\.?|inr/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)(cr|crore|crores|l|lac|lacs|lakh|lakhs|k)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] ?? "";
  const mult = unit.startsWith("c") ? 1e7 : unit.startsWith("l") ? 1e5 : unit === "k" ? 1e3 : 1;
  return Math.round(n * mult);
}

export function budgetText(l: Pick<Lead, "budget_min" | "budget_max">) {
  if (l.budget_min && l.budget_max) return `${formatINR(l.budget_min)} – ${formatINR(l.budget_max)}`;
  if (l.budget_max) return `Up to ${formatINR(l.budget_max)}`;
  if (l.budget_min) return `From ${formatINR(l.budget_min)}`;
  return "";
}

export function listingSummary(l: Pick<Listing, "bhk" | "property_type" | "carpet_area_sqft" | "locality" | "city">) {
  return [
    [l.bhk ? `${l.bhk} BHK` : "", l.property_type].filter(Boolean).join(" "),
    l.carpet_area_sqft ? `${l.carpet_area_sqft.toLocaleString("en-IN")} sq ft` : "",
    [l.locality, l.city].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Digits only, with India's country code added to bare 10-digit numbers. */
export function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^0+/, "");
  return d.length === 10 ? `91${d}` : d;
}

const IST = "Asia/Kolkata";
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());
}
export function formatDate(d: string) {
  const date = d.length === 10 ? new Date(d + "T00:00:00+05:30") : new Date(d);
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short" }).format(date);
}
export function formatDateTime(d: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

/**
 * Which available listings suit this lead? Filters on BHK, property type, budget
 * (10% stretch above, 20% below) and preferred localities; cheapest first.
 * A blank field on either side never rules a listing out.
 */
export function matchListings<T extends Listing>(lead: Lead, listings: T[]): T[] {
  const wanted = lead.locations
    .toLowerCase()
    .split(/[,/;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const inArea = (l: Listing) => {
    const hay = `${l.locality} ${l.city} ${l.project}`.toLowerCase();
    return wanted.some((w) => hay.includes(w));
  };
  return listings
    .filter((l) => l.status === "available")
    .filter((l) => !lead.bhk || !l.bhk || l.bhk === lead.bhk)
    .filter((l) => !lead.budget_max || !l.price || l.price <= lead.budget_max * 1.1)
    .filter((l) => !lead.budget_min || !l.price || l.price >= lead.budget_min * 0.8)
    .filter((l) => !lead.property_type || l.property_type === lead.property_type)
    .filter((l) => wanted.length === 0 || inArea(l))
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
}
