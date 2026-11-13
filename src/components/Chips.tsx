import { stageLabel, statusLabel } from "@/lib/types";

const STAGE_COLORS: Record<string, string> = {
  new: "bg-sky-100 text-sky-800",
  contacted: "bg-indigo-100 text-indigo-800",
  site_visit: "bg-amber-100 text-amber-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed: "bg-emerald-100 text-emerald-800",
  lost: "bg-stone-200 text-stone-600",
};
const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  hold: "bg-amber-100 text-amber-800",
  sold: "bg-stone-200 text-stone-600",
};

export const StageChip = ({ stage }: { stage: string }) => (
  <span className={`chip ${STAGE_COLORS[stage] ?? ""}`}>{stageLabel(stage)}</span>
);
export const StatusChip = ({ status }: { status: string }) => (
  <span className={`chip ${STATUS_COLORS[status] ?? ""}`}>{statusLabel(status)}</span>
);
