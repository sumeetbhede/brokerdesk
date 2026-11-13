export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <div>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-2xl text-white">⌂</div>
        <h1 className="h1">BrokerDesk</h1>
        <p className="muted">Leads, listings and WhatsApp sharing in one place.</p>
      </div>
      {children}
    </main>
  );
}
