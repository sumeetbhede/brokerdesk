import Link from "next/link";
import { createListing } from "@/app/actions";
import { Banner } from "@/components/Banner";
import { ListingFields } from "@/components/Forms";

export default async function NewListingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="h1">New property</h1>
        <Link href="/properties" className="text-sm font-semibold text-muted">Cancel</Link>
      </header>
      <Banner error={error} />
      <form action={createListing} className="card space-y-4">
        <ListingFields />
        <p className="muted">You can add photos on the next screen.</p>
        <button className="btn w-full">Save property</button>
      </form>
    </>
  );
}
