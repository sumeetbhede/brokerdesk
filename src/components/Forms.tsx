import { formatINR } from "@/lib/format";
import { LEAD_SOURCES, LISTING_STATUSES, PROPERTY_TYPES, type Lead, type Listing } from "@/lib/types";

const money = (n: number | null | undefined) => (n ? formatINR(n).replace("₹", "") : "");

function Field({ label, name, children, hint }: { label: string; name: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function LeadFields({ lead }: { lead?: Lead }) {
  return (
    <>
      <Field label="Name" name="name">
        <input className="input" id="name" name="name" defaultValue={lead?.name} required autoComplete="off" />
      </Field>
      <Field label="Phone" name="phone">
        <input className="input" id="phone" name="phone" type="tel" inputMode="tel" defaultValue={lead?.phone} autoComplete="off" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Budget from" name="budget_min">
          <input className="input" id="budget_min" name="budget_min" defaultValue={money(lead?.budget_min)} placeholder="70 L" />
        </Field>
        <Field label="Budget up to" name="budget_max">
          <input className="input" id="budget_max" name="budget_max" defaultValue={money(lead?.budget_max)} placeholder="1.2 Cr" />
        </Field>
      </div>
      <Field label="Preferred areas" name="locations" hint="Separate with commas: Baner, Wakad">
        <input className="input" id="locations" name="locations" defaultValue={lead?.locations} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="BHK" name="bhk">
          <select className="input" id="bhk" name="bhk" defaultValue={lead?.bhk ?? ""}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
          </select>
        </Field>
        <Field label="Type" name="property_type">
          <select className="input" id="property_type" name="property_type" defaultValue={lead?.property_type ?? ""}>
            <option value="">Any</option>
            {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Source" name="source">
          <select className="input" id="source" name="source" defaultValue={lead?.source ?? ""}>
            <option value="">Not set</option>
            {LEAD_SOURCES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Email" name="email">
          <input className="input" id="email" name="email" type="email" defaultValue={lead?.email} autoComplete="off" />
        </Field>
      </div>
    </>
  );
}

export function ListingFields({ listing }: { listing?: Listing }) {
  return (
    <>
      <Field label="Title" name="title" hint="What the client sees first">
        <input className="input" id="title" name="title" defaultValue={listing?.title} placeholder="2 BHK in Skyline Towers, Baner" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price" name="price">
          <input className="input" id="price" name="price" defaultValue={money(listing?.price)} placeholder="85 L" />
        </Field>
        <Field label="Status" name="status">
          <select className="input" id="status" name="status" defaultValue={listing?.status ?? "available"}>
            {LISTING_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" name="property_type">
          <select className="input" id="property_type" name="property_type" defaultValue={listing?.property_type ?? "Apartment"}>
            {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="BHK" name="bhk">
          <select className="input" id="bhk" name="bhk" defaultValue={listing?.bhk ?? ""}>
            <option value="">N/A</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Carpet area (sq ft)" name="carpet_area_sqft">
          <input className="input" id="carpet_area_sqft" name="carpet_area_sqft" inputMode="numeric" defaultValue={listing?.carpet_area_sqft ?? ""} />
        </Field>
        <Field label="Floor" name="floor">
          <input className="input" id="floor" name="floor" defaultValue={listing?.floor} placeholder="7 of 22" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Locality" name="locality">
          <input className="input" id="locality" name="locality" defaultValue={listing?.locality} placeholder="Baner" />
        </Field>
        <Field label="City" name="city">
          <input className="input" id="city" name="city" defaultValue={listing?.city} placeholder="Pune" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project" name="project">
          <input className="input" id="project" name="project" defaultValue={listing?.project} />
        </Field>
        <Field label="Builder" name="builder">
          <input className="input" id="builder" name="builder" defaultValue={listing?.builder} />
        </Field>
      </div>
      <Field label="Description" name="description" hint="Shown to clients on the shared link">
        <textarea className="input py-2" id="description" name="description" rows={4} defaultValue={listing?.description} />
      </Field>
      <Field label="Private notes" name="private_notes" hint="Only you see this: owner contact, brokerage terms, key location">
        <textarea className="input py-2" id="private_notes" name="private_notes" rows={2} defaultValue={listing?.private_notes} />
      </Field>
    </>
  );
}
