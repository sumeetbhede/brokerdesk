export const STAGES = [
  { id: "warm", label: "Warm" },
  { id: "hot", label: "Hot" },
  { id: "visited", label: "Visited" },
  { id: "booked", label: "Booked" },
  { id: "cold", label: "Cold" },
  { id: "lost", label: "Lost" },
] as const;
export type Stage = (typeof STAGES)[number]["id"];
export const stageLabel = (s: string) => STAGES.find((x) => x.id === s)?.label ?? s;

export const LISTING_STATUSES = [
  { id: "available", label: "Available" },
  { id: "hold", label: "On hold" },
  { id: "sold", label: "Sold" },
] as const;
export const statusLabel = (s: string) => LISTING_STATUSES.find((x) => x.id === s)?.label ?? s;

export const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Row house", "Office", "Shop"];
export const LEAD_SOURCES = ["Referral", "Walk-in", "MagicBricks", "99acres", "Housing", "NoBroker", "Social media", "Hoarding", "Existing client", "Other"];
/** Leads still being worked: not yet booked, and not written off. */
export const ACTIVE_STAGES = ["warm", "hot", "visited"];

export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  phone: string;
  role: string;
  organizations: { name: string } | null;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  budget_min: number | null;
  budget_max: number | null;
  locations: string;
  bhk: number | null;
  property_type: string;
  source: string;
  stage: Stage;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
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
  status: "available" | "hold" | "sold";
  description: string;
  private_notes: string;
  created_at: string;
  listing_photos?: { id: string; path: string; sort: number }[];
}
