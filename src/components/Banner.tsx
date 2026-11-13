export function Banner({ error, message }: { error?: string; message?: string }) {
  if (error) return <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (message) return <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>;
  return null;
}
