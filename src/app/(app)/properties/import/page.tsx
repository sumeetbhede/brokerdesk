import Link from "next/link";
import { ImportClient } from "./ImportClient";

export default function ImportPage() {
  return (
    <>
      <header>
        <Link href="/properties" className="text-sm font-medium text-muted">‹ Properties</Link>
        <h1 className="h1">Import properties</h1>
        <p className="muted">Upload a builder&apos;s inventory sheet (Excel or CSV). One row per unit.</p>
      </header>
      <ImportClient />
    </>
  );
}
