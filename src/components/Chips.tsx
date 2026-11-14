import { stageLabel, statusLabel } from "@/lib/types";

const STAGE_TONES: Record<string, string> = {
  warm: "tone-warn",
  hot: "tone-bad",
  visited: "tone-info",
  booked: "tone-good",
  cold: "tone-neutral",
  lost: "tone-neutral",
};
const STATUS_TONES: Record<string, string> = {
  available: "tone-good",
  hold: "tone-warn",
  sold: "tone-neutral",
};

export const StageChip = ({ stage }: { stage: string }) => (
  <span className={`chip ${STAGE_TONES[stage] ?? "tone-neutral"}`}>{stageLabel(stage)}</span>
);
export const StatusChip = ({ status }: { status: string }) => (
  <span className={`chip ${STATUS_TONES[status] ?? "tone-neutral"}`}>{statusLabel(status)}</span>
);
