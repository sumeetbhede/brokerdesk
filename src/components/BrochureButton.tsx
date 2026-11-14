"use client";

import { useState } from "react";
import { formatINR, listingSummary } from "@/lib/format";
import type { Listing } from "@/lib/types";

async function toDataUrl(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    return { data: canvas.toDataURL("image/jpeg", 0.85), w: bitmap.width, h: bitmap.height };
  } catch {
    return null;
  }
}

export function BrochureButton({
  listing,
  photoUrls,
  broker,
}: {
  listing: Listing;
  photoUrls: string[];
  broker: { name: string; phone: string; business: string };
}) {
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, M = 15;
      // jsPDF's built-in fonts have no rupee glyph
      const price = formatINR(listing.price).replace("₹", "Rs. ");

      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, W, 26, "F");
      doc.setTextColor(194, 161, 78);
      doc.setFont("helvetica", "bold").setFontSize(15);
      doc.text(broker.business || broker.name, M, 12);
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(235);
      doc.text([broker.name, broker.phone].filter(Boolean).join("  |  "), M, 19);

      let y = 34;
      const images = (await Promise.all(photoUrls.slice(0, 3).map(toDataUrl))).filter((x) => x !== null);
      if (images[0]) {
        const h = Math.min(100, ((W - 2 * M) * images[0].h) / images[0].w);
        const w = (h * images[0].w) / images[0].h;
        doc.addImage(images[0].data, "JPEG", M + (W - 2 * M - w) / 2, y, w, h);
        y += h + 6;
      }
      const thumbs = images.slice(1);
      if (thumbs.length) {
        const tw = (W - 2 * M - 4) / 2;
        let rowH = 0;
        thumbs.forEach((img, i) => {
          const h = Math.min(55, (tw * img.h) / img.w);
          const w = (h * img.w) / img.h;
          doc.addImage(img.data, "JPEG", M + i * (tw + 4), y, w, h);
          rowH = Math.max(rowH, h);
        });
        y += rowH + 6;
      }

      doc.setTextColor(28, 25, 23);
      doc.setFont("helvetica", "bold").setFontSize(18);
      const titleLines = doc.splitTextToSize(listing.title, W - 2 * M);
      doc.text(titleLines, M, y + 4);
      y += titleLines.length * 8 + 2;
      if (price) {
        doc.setFontSize(16).setTextColor(138, 109, 31);
        doc.text(price, M, y + 4);
        y += 10;
      }
      doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(87, 83, 78);
      doc.text(listingSummary(listing).replaceAll("·", "|"), M, y + 2);
      y += 10;

      const facts: [string, string][] = [
        ["Project", listing.project],
        ["Builder", listing.builder],
        ["Floor", listing.floor],
      ];
      doc.setTextColor(28, 25, 23);
      for (const [k, v] of facts) {
        if (!v) continue;
        doc.setFont("helvetica", "bold").text(`${k}:`, M, y);
        doc.setFont("helvetica", "normal").text(v, M + 24, y);
        y += 6;
      }
      if (listing.description) {
        y += 2;
        const lines = doc.splitTextToSize(listing.description, W - 2 * M);
        doc.text(lines.slice(0, Math.max(0, Math.floor((270 - y) / 5.2))), M, y);
      }

      doc.setFontSize(10).setTextColor(87, 83, 78);
      doc.text(`Contact ${broker.name}${broker.phone ? " on " + broker.phone : ""}`, M, 287);
      doc.save(`${listing.title.replace(/[^\w]+/g, "-").slice(0, 50) || "property"}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn-secondary" onClick={build} disabled={busy}>
      {busy ? "Building PDF…" : "PDF brochure"}
    </button>
  );
}
