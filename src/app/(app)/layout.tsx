import { BottomNav } from "@/components/BottomNav";
import { requireProfile } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();
  return (
    <>
      <main className="mx-auto max-w-xl space-y-4 px-4 pb-24 pt-5">{children}</main>
      <BottomNav />
    </>
  );
}
