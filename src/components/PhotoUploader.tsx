"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Shrinks phone photos to 1600px JPEG so uploads are quick on mobile data. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function PhotoUploader({ orgId, listingId, startSort }: { orgId: string; listingId: string; startSort: number }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const supabase = createClient();
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      const blob = await shrink(files[i]);
      const path = `${orgId}/${listingId}/${crypto.randomUUID()}.jpg`;
      const up = await supabase.storage.from("listing-photos").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) {
        failed++;
        continue;
      }
      const ins = await supabase.from("listing_photos").insert({ listing_id: listingId, path, sort: startSort + i });
      if (ins.error) failed++;
    }
    setStatus(failed ? `${failed} photo${failed > 1 ? "s" : ""} failed to upload.` : "");
    router.refresh();
  }

  return (
    <div>
      <label className="btn-secondary cursor-pointer">
        + Add photos
        <input type="file" accept="image/*" multiple className="sr-only" onChange={onChange} />
      </label>
      {status && <p className="muted mt-2" role="status">{status}</p>}
    </div>
  );
}
