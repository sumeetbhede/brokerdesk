import Link from "next/link";
import { ImportClient } from "./ImportClient";

export default function ImportPage() {
  return (
    <>
      <header>
        <Link href="/listings" className="text-sm font-semibold text-stone-500">‹ Listings</Link>
        <h1 className="h1">Import listings</h1>
        <p className="muted">Upload a builder&apos;s inventory sheet (Excel or CSV). One row per unit.</p>
      </header>
      <ImportClient />
    </>
  );
}
