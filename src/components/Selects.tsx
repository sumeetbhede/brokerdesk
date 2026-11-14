"use client";

import { useTransition } from "react";
import { setLeadStage, setListingStatus } from "@/app/actions";
import { LISTING_STATUSES, STAGES } from "@/lib/types";

export function StageSelect({ leadId, stage }: { leadId: string; stage: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Lead stage"
      className="input"
      defaultValue={stage}
      disabled={pending}
      onChange={(e) => start(() => setLeadStage(leadId, e.target.value))}
    >
      {STAGES.map((s) => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );
}

export function StatusSelect({ listingId, status }: { listingId: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Property status"
      className="input"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setListingStatus(listingId, e.target.value))}
    >
      {LISTING_STATUSES.map((s) => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );
}

export function ConfirmButton({
  action,
  message,
  children,
  className = "text-sm font-semibold text-danger",
}: {
  action: () => Promise<void>;
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (window.confirm(message)) start(() => action());
      }}
    >
      {children}
    </button>
  );
}
