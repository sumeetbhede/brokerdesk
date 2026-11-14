import { LogoMark, Wordmark } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <div>
        <LogoMark size={56} />
        <h1 className="mt-3 text-3xl"><Wordmark /></h1>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Everything your property business needs</p>
      </div>
      {children}
    </main>
  );
}
