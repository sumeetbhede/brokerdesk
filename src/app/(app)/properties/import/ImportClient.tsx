"use client";

import Link from "next/link";
import { useState } from "react";
import { importListings, type ImportRow } from "@/app/actions";
import { formatINR, parseINR } from "@/lib/format";

// header text (lowercased, punctuation stripped) -> our field
const ALIASES: Record<keyof ImportRow, string[]> = {
  title: ["title", "name", "unit name", "listing"],
  project: ["project", "project name", "society", "building", "tower"],
  builder: ["builder", "developer"],
  locality: ["locality", "location", "area name", "micro market", "sector"],
  city: ["city"],
  property_type: ["type", "property type", "unit type"],
  bhk: ["bhk", "config", "configuration", "bedrooms", "typology"],
  carpet_area_sqft: ["carpet area", "carpet", "carpet area sqft", "area", "area sqft", "sqft", "size"],
  price: ["price", "cost", "agreement value", "total price", "all in price", "rate"],
  floor: ["floor", "floor no"],
  status: ["status", "availability"],
  description: ["description", "remarks", "notes"],
};
const UNIT_KEYS = ["unit", "unit no", "flat", "flat no", "unit number"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const num = (v: unknown) => {
  const m = String(v ?? "").replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Math.round(parseFloat(m[0])) : null;
};
function toStatus(v: string) {
  const s = v.toLowerCase();
  if (/sold|booked/.test(s)) return "sold";
  if (/hold|block/.test(s)) return "hold";
  return "available";
}

function mapRow(raw: Record<string, unknown>): ImportRow | null {
  const byHeader = new Map(Object.entries(raw).map(([k, v]) => [norm(k), v]));
  const pick = (names: string[]) => {
    for (const n of names) {
      const v = byHeader.get(n);
      if (v != null && String(v).trim() !== "") return v;
    }
    return undefined;
  };
  const text = (k: keyof ImportRow) => String(pick(ALIASES[k]) ?? "").trim();

  const bhk = num(pick(ALIASES.bhk));
  const project = text("project");
  const locality = text("locality");
  const unit = String(pick(UNIT_KEYS) ?? "").trim();
  const title =
    text("title") ||
    [bhk ? `${bhk} BHK` : "", project ? `in ${project}` : "", unit ? `(${unit})` : "", !project && locality ? `in ${locality}` : ""]
      .filter(Boolean)
      .join(" ");
  if (!title) return null;

  return {
    title,
    project,
    builder: text("builder"),
    locality,
    city: text("city"),
    property_type: text("property_type") || "Apartment",
    bhk: bhk && bhk <= 10 ? bhk : null,
    carpet_area_sqft: num(pick(ALIASES.carpet_area_sqft)),
    price: parseINR(pick(ALIASES.price)),
    floor: text("floor"),
    status: toStatus(text("status")),
    description: text("description"),
  };
}

const TEMPLATE =
  "Title,Project,Builder,Locality,City,Type,BHK,Carpet Area,Price,Floor,Status,Description\n" +
  '"2 BHK in Skyline Towers (A-704)",Skyline Towers,Skyline Group,Baner,Pune,Apartment,2,780,85 L,7,Available,"East facing, covered parking"\n';

export function ImportClient() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const mapped = raw.map(mapRow);
      const good = mapped.filter((r): r is ImportRow => r !== null);
      setRows(good);
      setSkipped(mapped.length - good.length);
      if (good.length === 0) setMsg({ kind: "error", text: "Couldn't find any usable rows. Check that the first row has column headings like Project, BHK, Price." });
    } catch {
      setRows([]);
      setMsg({ kind: "error", text: "That file couldn't be read. Use .xlsx, .xls or .csv." });
    }
  }

  async function save() {
    setBusy(true);
    const res = await importListings(rows);
    setBusy(false);
    if (res.ok) {
      setMsg({ kind: "ok", text: `Imported ${res.count} properties.` });
      setRows([]);
    } else {
      setMsg({ kind: "error", text: res.error });
    }
  }

  return (
    <>
      <div className="card space-y-3">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} aria-label="Inventory file" className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:font-medium file:text-on-brand" />
        <p className="muted">
          Columns are matched by heading: Project, Builder, Locality, City, Type, BHK, Carpet Area, Price, Floor, Status, Unit No. Prices like
          &ldquo;85 L&rdquo;, &ldquo;1.2 Cr&rdquo; or 8500000 all work.{" "}
          <a className="font-medium text-accent" download="properties-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}>
            Download a template
          </a>
        </p>
      </div>

      {msg && (
        <p role={msg.kind === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-xs ${msg.kind === "error" ? "bg-bad-bg text-bad-ink" : "bg-good-bg text-good-ink"}`}>
          {msg.text} {msg.kind === "ok" && <Link href="/properties" className="font-medium underline">View properties</Link>}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <p className="text-sm font-medium">
            {rows.length} rows ready{skipped > 0 && `, ${skipped} skipped (no title, project or BHK)`}. Showing the first {Math.min(rows.length, 20)}.
          </p>
          <div className="card overflow-x-auto !p-0">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="text-[11px] uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Area</th>
                  <th className="px-3 py-2">Locality</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{r.title}</td>
                    <td className="px-3 py-2 tabular-nums">{formatINR(r.price) || "–"}</td>
                    <td className="px-3 py-2 tabular-nums">{r.carpet_area_sqft ?? "–"}</td>
                    <td className="px-3 py-2">{r.locality || "–"}</td>
                    <td className="px-3 py-2 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn w-full" onClick={save} disabled={busy}>
            {busy ? "Importing…" : `Import ${rows.length} properties`}
          </button>
        </>
      )}
    </>
  );
}
