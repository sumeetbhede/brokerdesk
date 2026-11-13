import { signOut, updateProfile } from "@/app/actions";
import { Banner } from "@/components/Banner";
import { requireProfile } from "@/lib/supabase/server";

export default async function MorePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const sp = await searchParams;
  const { profile, user } = await requireProfile();
  return (
    <>
      <h1 className="h1">Your details</h1>
      <p className="muted">Clients see your name, number and business name on shared listings and brochures.</p>
      <Banner {...sp} />
      <form action={updateProfile} className="card space-y-4">
        <div>
          <label className="label" htmlFor="full_name">Name</label>
          <input className="input" id="full_name" name="full_name" defaultValue={profile.full_name} required />
        </div>
        <div>
          <label className="label" htmlFor="phone">WhatsApp number</label>
          <input className="input" id="phone" name="phone" type="tel" inputMode="tel" defaultValue={profile.phone} />
        </div>
        <div>
          <label className="label" htmlFor="business_name">Business name</label>
          <input className="input" id="business_name" name="business_name" defaultValue={profile.organizations?.name ?? ""} />
        </div>
        <button className="btn w-full">Save</button>
      </form>
      <form action={signOut} className="card flex items-center justify-between">
        <span className="muted truncate">{user.email}</span>
        <button className="btn-secondary btn-sm">Log out</button>
      </form>
    </>
  );
}
