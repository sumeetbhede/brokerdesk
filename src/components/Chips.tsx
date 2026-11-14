import { stageLabel, statusLabel } from "@/lib/types";

const STATUS_TONES: Record<string, string> = {
  available: "tone-good",
  hold: "tone-warn",
  sold: "tone-neutral",
};

export const StageChip = ({ stage }: { stage: string }) => (
  <span className={`status-pill status-${stage}`}>{stageLabel(stage)}</span>
);
export const StatusChip = ({ status }: { status: string }) => (
  <span className={`chip ${STATUS_TONES[status] ?? "tone-neutral"}`}>{statusLabel(status)}</span>
);
