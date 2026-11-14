import Link from "next/link";
import { createLead } from "@/app/actions";
import { Banner } from "@/components/Banner";
import { LeadFields } from "@/components/Forms";

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="h1">New lead</h1>
        <Link href="/leads" className="text-sm font-semibold text-muted">Cancel</Link>
      </header>
      <Banner error={error} />
      <form action={createLead} className="card space-y-4">
        <LeadFields />
        <div>
          <label className="label" htmlFor="note">First note</label>
          <textarea className="input py-2" id="note" name="note" rows={2} placeholder="Wants possession by March, has a home loan pre-approved" />
        </div>
        <div>
          <label className="label" htmlFor="follow_up_on">Follow up on</label>
          <input className="input" id="follow_up_on" name="follow_up_on" type="date" />
        </div>
        <button className="btn w-full">Save lead</button>
      </form>
    </>
  );
}
