"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { importLeads, type LeadImportRow } from "@/app/actions";
import { formatINR, parseINR } from "@/lib/format";

const ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "lead name", "customer", "customer name", "client", "client name"],
  phone: ["phone", "mobile", "mobile no", "mobile number", "phone number", "phone no", "contact", "contact no", "contact number", "whatsapp"],
  email: ["email", "email id", "e mail", "mail"],
  budget: ["budget", "max budget", "budget max", "budget upto"],
  bhk: ["bhk", "bhk requirement", "requirement", "config", "configuration"],
  locations: ["location", "locations", "locality", "area", "preferred location", "preferred area"],
  source: ["source", "lead source"],
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);
const PHONE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/;

/** "Rahul Mehta, 98200 11223" or "98200 11223 Rahul Mehta" or tab-separated, one lead per line. */
function parsePasted(text: string): LeadImportRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const phone = line.match(PHONE)?.[0] ?? "";
      const rest = (phone ? line.replace(phone, " ") : line).split(/[,\t;|]+/).map((s) => s.trim()).filter(Boolean);
      const email = rest.find((s) => /\S+@\S+\.\S+/.test(s)) ?? "";
      const name = rest.find((s) => s !== email && /[a-zA-Zऀ-ॿ]/.test(s)) ?? "";
      return { name: name.replace(/^[-–:\s]+|[-–:\s]+$/g, ""), phone: phone.trim(), email };
    })
    .filter((r) => r.name);
}

function mapSheetRow(raw: Record<string, unknown>): LeadImportRow | null {
  const byHeader = new Map(Object.entries(raw).map(([k, v]) => [norm(k), String(v ?? "").trim()]));
  const pick = (key: string) => ALIASES[key].map((a) => byHeader.get(a)).find((v) => v) ?? "";
  const name = pick("name");
  if (!name) return null;
  const bhk = parseInt(pick("bhk").match(/\d+/)?.[0] ?? "", 10);
  return {
    name,
    phone: pick("phone"),
    email: pick("email"),
    budget_max: parseINR(pick("budget")),
    bhk: bhk >= 1 && bhk <= 10 ? bhk : null,
    locations: pick("locations"),
    source: pick("source"),
  };
}

const TEMPLATE = "Name,Mobile,Email,Budget,BHK,Location,Source\nRahul Mehta,9820011223,,90 L,2,\"Baner, Wakad\",Referral\n";

export function LeadImportClient({ existingPhones }: { existingPhones: string[] }) {
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [text, setText] = useState("");
  const [fileRows, setFileRows] = useState<LeadImportRow[]>([]);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (mode === "paste" ? parsePasted(text) : fileRows), [mode, text, fileRows]);
  const marked = useMemo(() => {
    const seen = new Set(existingPhones);
    return rows.map((r) => {
      const key = last10(r.phone ?? "");
      const duplicate = key.length === 10 && seen.has(key);
      if (key.length === 10) seen.add(key);
      return { ...r, duplicate };
    });
  }, [rows, existingPhones]);
  const fresh = marked.filter((r) => !r.duplicate);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });
      const good = raw.map(mapSheetRow).filter((r): r is LeadImportRow => r !== null);
      setFileRows(good);
      if (good.length === 0) setMsg({ kind: "error", text: "No leads found. The first row needs headings, and one of them should be Name." });
    } catch {
      setFileRows([]);
      setMsg({ kind: "error", text: "That file couldn't be read. Use .xlsx, .xls or .csv." });
    }
  }

  async function save() {
    setBusy(true);
    const res = await importLeads(rows.filter((_, i) => !marked[i].duplicate));
    setBusy(false);
    if (res.ok) {
      setMsg({ kind: "ok", text: `Added ${res.count} lead${res.count === 1 ? "" : "s"}.` });
      setText("");
      setFileRows([]);
    } else {
      setMsg({ kind: "error", text: res.error });
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-subtle p-1" role="tablist">
        {(["paste", "file"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setMsg(null); }}
            className={`min-h-10 rounded-lg text-sm font-medium ${mode === m ? "bg-card text-ink shadow-sm" : "text-muted"}`}
          >
            {m === "paste" ? "Paste a list" : "Excel / CSV"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <div className="card space-y-2">
          <label className="label" htmlFor="paste">One lead per line</label>
          <textarea
            id="paste"
            className="input py-2 font-mono text-xs"
            rows={6}
            value={text}
            onChange={(e) => { setText(e.target.value); setMsg(null); }}
            placeholder={"Rahul Mehta, 98200 11223\nPriya Nair 9987044556\nImran Shaikh, 90040 77889, imran@example.com"}
          />
          <p className="muted">Name and mobile number in any order. Copy straight from WhatsApp, notes or a spreadsheet.</p>
        </div>
      ) : (
        <div className="card space-y-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} aria-label="Leads file" className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:font-medium file:text-on-brand" />
          <p className="muted">
            Columns are matched by heading: Name, Mobile, Email, Budget, BHK, Location, Source.{" "}
            <a className="font-medium text-accent" download="leads-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}>
              Download a template
            </a>
          </p>
        </div>
      )}

      {msg && (
        <p role={msg.kind === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-xs ${msg.kind === "error" ? "tone-bad" : "tone-good"}`}>
          {msg.text} {msg.kind === "ok" && <Link href="/leads" className="font-medium underline">View leads</Link>}
        </p>
      )}

      {marked.length > 0 && (
        <>
          <p className="text-sm font-medium">
            {fresh.length} new{marked.length - fresh.length > 0 && `, ${marked.length - fresh.length} already in your leads`}
          </p>
          <ul className="card divide-y divide-line !p-0">
            {marked.slice(0, 30).map((r, i) => (
              <li key={i} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${r.duplicate ? "opacity-60" : ""}`}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="muted block truncate">
                    {[r.phone || "No number", r.bhk ? `${r.bhk} BHK` : "", r.budget_max ? `Up to ${formatINR(r.budget_max)}` : "", r.locations].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {r.duplicate && <span className="chip tone-neutral shrink-0">Already in your leads</span>}
              </li>
            ))}
          </ul>
          {marked.length > 30 && <p className="muted">Showing the first 30 of {marked.length}.</p>}
          <button className="btn w-full" onClick={save} disabled={busy || fresh.length === 0}>
            {busy ? "Adding…" : fresh.length === 0 ? "Nothing new to add" : `Add ${fresh.length} lead${fresh.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </>
  );
}
