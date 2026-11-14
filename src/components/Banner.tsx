export function Banner({ error, message }: { error?: string; message?: string }) {
  if (error) return <p role="alert" className="rounded-xl bg-bad-bg px-3 py-2 text-xs text-bad-ink">{error}</p>;
  if (message) return <p role="status" className="rounded-xl bg-good-bg px-3 py-2 text-xs text-good-ink">{message}</p>;
  return null;
}
