"use client";

import { useState } from "react";
import { createShare } from "@/app/actions";
import { waNumber } from "@/lib/format";

/**
 * Creates a tracked link for one listing, then either opens WhatsApp with the
 * message ready to send, or copies the link.
 */
export function ShareButton({
  listingId,
  text,
  leadId = null,
  leadPhone = "",
  mode = "whatsapp",
  className = "btn",
  children,
}: {
  listingId: string;
  text: string;
  leadId?: string | null;
  leadPhone?: string;
  mode?: "whatsapp" | "copy";
  className?: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">("idle");

  async function onClick() {
    setState("busy");
    const res = await createShare(listingId, leadId);
    if (!res.ok) return setState("error");
    const url = `${window.location.origin}/p/${res.token}`;
    if (mode === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setState("copied");
      } catch {
        window.prompt("Copy this link", url);
        setState("idle");
      }
      return;
    }
    const phone = waNumber(leadPhone);
    const message = encodeURIComponent(`${text}\n${url}`);
    setState("idle");
    window.location.href = `https://wa.me/${phone}?text=${message}`;
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={state === "busy"}>
      {state === "busy" ? "Creating link…" : state === "copied" ? "Link copied" : state === "error" ? "Failed, tap to retry" : children}
    </button>
  );
}
