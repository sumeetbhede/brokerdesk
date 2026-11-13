"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseINR } from "@/lib/format";
import { createClient, requireProfile } from "@/lib/supabase/server";
import { LISTING_STATUSES, STAGES } from "@/lib/types";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const n = parseInt(str(fd, k).replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const fail = (path: string, message: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);

// ---------- auth ----------
export async function signIn(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(fd, "email"),
    password: str(fd, "password"),
  });
  if (error) fail("/login", error.message);
  redirect("/");
}

export async function signUp(fd: FormData) {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const { data, error } = await supabase.auth.signUp({
    email: str(fd, "email"),
    password: str(fd, "password"),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: str(fd, "full_name"),
        phone: str(fd, "phone"),
        business_name: str(fd, "business_name"),
      },
    },
  });
  if (error) fail("/signup", error.message);
  if (!data.session) {
    redirect("/login?message=" + encodeURIComponent("Check your email for a confirmation link, then log in."));
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(fd: FormData) {
  const { supabase, profile } = await requireProfile();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: str(fd, "full_name"), phone: str(fd, "phone") })
    .eq("id", profile.id);
  if (error) fail("/more", error.message);
  const business = str(fd, "business_name");
  if (business && profile.role === "owner") {
    await supabase.from("organizations").update({ name: business }).eq("id", profile.org_id);
  }
  revalidatePath("/more");
  redirect("/more?message=" + encodeURIComponent("Saved"));
}

// ---------- leads ----------
function leadFields(fd: FormData) {
  return {
    name: str(fd, "name"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    budget_min: parseINR(str(fd, "budget_min")),
    budget_max: parseINR(str(fd, "budget_max")),
    locations: str(fd, "locations"),
    bhk: int(fd, "bhk"),
    property_type: str(fd, "property_type"),
    source: str(fd, "source"),
  };
}

export async function createLead(fd: FormData) {
  const { supabase } = await requireProfile();
  const fields = leadFields(fd);
  if (!fields.name) fail("/leads/new", "Name is required");
  const { data, error } = await supabase.from("leads").insert(fields).select("id").single();
  if (error || !data) fail("/leads/new", error?.message ?? "Could not save lead");
  const note = str(fd, "note");
  if (note) await supabase.from("lead_notes").insert({ lead_id: data!.id, body: note });
  const due = str(fd, "follow_up_on");
  if (due) await supabase.from("follow_ups").insert({ lead_id: data!.id, due_on: due, note: "First follow-up" });
  revalidatePath("/leads");
  redirect(`/leads/${data!.id}`);
}

export async function updateLead(id: string, fd: FormData) {
  const { supabase } = await requireProfile();
  const fields = leadFields(fd);
  if (!fields.name) fail(`/leads/${id}?edit=1`, "Name is required");
  const { error } = await supabase
    .from("leads")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) fail(`/leads/${id}?edit=1`, error.message);
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function setLeadStage(id: string, stage: string) {
  if (!STAGES.some((s) => s.id === stage)) return;
  const { supabase } = await requireProfile();
  await supabase.from("leads").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function deleteLead(id: string) {
  const { supabase } = await requireProfile();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  redirect("/leads");
}

export async function addNote(leadId: string, fd: FormData) {
  const body = str(fd, "body");
  if (!body) return;
  const { supabase } = await requireProfile();
  await supabase.from("lead_notes").insert({ lead_id: leadId, body });
  revalidatePath(`/leads/${leadId}`);
}

export async function addFollowUp(leadId: string, fd: FormData) {
  const due = str(fd, "due_on");
  if (!due) return;
  const { supabase } = await requireProfile();
  await supabase.from("follow_ups").insert({ lead_id: leadId, due_on: due, note: str(fd, "note") });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

export async function completeFollowUp(id: string, leadId: string) {
  const { supabase } = await requireProfile();
  await supabase.from("follow_ups").update({ done_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

// ---------- listings ----------
function listingFields(fd: FormData) {
  const status = str(fd, "status");
  return {
    title: str(fd, "title"),
    project: str(fd, "project"),
    builder: str(fd, "builder"),
    locality: str(fd, "locality"),
    city: str(fd, "city"),
    property_type: str(fd, "property_type") || "Apartment",
    bhk: int(fd, "bhk"),
    carpet_area_sqft: int(fd, "carpet_area_sqft"),
    price: parseINR(str(fd, "price")),
    floor: str(fd, "floor"),
    status: LISTING_STATUSES.some((s) => s.id === status) ? status : "available",
    description: str(fd, "description"),
    private_notes: str(fd, "private_notes"),
  };
}

export async function createListing(fd: FormData) {
  const { supabase } = await requireProfile();
  const fields = listingFields(fd);
  if (!fields.title) fail("/listings/new", "Title is required");
  const { data, error } = await supabase.from("listings").insert(fields).select("id").single();
  if (error || !data) fail("/listings/new", error?.message ?? "Could not save listing");
  revalidatePath("/listings");
  redirect(`/listings/${data!.id}?added=1`);
}

export async function updateListing(id: string, fd: FormData) {
  const { supabase } = await requireProfile();
  const fields = listingFields(fd);
  if (!fields.title) fail(`/listings/${id}?edit=1`, "Title is required");
  const { error } = await supabase.from("listings").update(fields).eq("id", id);
  if (error) fail(`/listings/${id}?edit=1`, error.message);
  revalidatePath(`/listings/${id}`);
  redirect(`/listings/${id}`);
}

export async function setListingStatus(id: string, status: string) {
  if (!LISTING_STATUSES.some((s) => s.id === status)) return;
  const { supabase } = await requireProfile();
  await supabase.from("listings").update({ status }).eq("id", id);
  revalidatePath(`/listings/${id}`);
  revalidatePath("/listings");
}

export async function deleteListing(id: string) {
  const { supabase } = await requireProfile();
  const { data: photos } = await supabase.from("listing_photos").select("path").eq("listing_id", id);
  if (photos?.length) await supabase.storage.from("listing-photos").remove(photos.map((p) => p.path));
  await supabase.from("listings").delete().eq("id", id);
  revalidatePath("/listings");
  redirect("/listings");
}

export async function deletePhoto(photoId: string, listingId: string) {
  const { supabase } = await requireProfile();
  const { data } = await supabase.from("listing_photos").select("path").eq("id", photoId).single();
  if (data) await supabase.storage.from("listing-photos").remove([data.path]);
  await supabase.from("listing_photos").delete().eq("id", photoId);
  revalidatePath(`/listings/${listingId}`);
}

export interface ImportRow {
  title: string;
  project?: string;
  builder?: string;
  locality?: string;
  city?: string;
  property_type?: string;
  bhk?: number | null;
  carpet_area_sqft?: number | null;
  price?: number | null;
  floor?: string;
  status?: string;
  description?: string;
}

export async function importListings(rows: ImportRow[]) {
  const { supabase } = await requireProfile();
  const clean = rows
    .filter((r) => r.title?.trim())
    .slice(0, 1000)
    .map((r) => ({
      title: r.title.trim().slice(0, 200),
      project: r.project ?? "",
      builder: r.builder ?? "",
      locality: r.locality ?? "",
      city: r.city ?? "",
      property_type: r.property_type || "Apartment",
      bhk: r.bhk ?? null,
      carpet_area_sqft: r.carpet_area_sqft ?? null,
      price: r.price ?? null,
      floor: r.floor ?? "",
      status: LISTING_STATUSES.some((s) => s.id === r.status) ? r.status : "available",
      description: r.description ?? "",
    }));
  if (clean.length === 0) return { ok: false as const, error: "No rows with a title were found." };
  const { error } = await supabase.from("listings").insert(clean);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/listings");
  return { ok: true as const, count: clean.length };
}

// ---------- sharing ----------
export async function createShare(listingId: string, leadId: string | null) {
  const { supabase } = await requireProfile();
  const token = randomBytes(9).toString("base64url");
  const { error } = await supabase.from("shares").insert({ listing_id: listingId, lead_id: leadId, token });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/listings/${listingId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
  return { ok: true as const, token };
}
