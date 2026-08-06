"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAdmin } from "@/components/admin/AdminContext";

export default function QrPage() {
  const { bars, barId } = useAdmin();
  const [selSlug, setSelSlug] = useState<string>("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [svgString, setSvgString] = useState("");

  const base = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    if (configured && configured.length > 0) return configured.replace(/\/$/, "");
    return typeof window !== "undefined" ? window.location.origin : "";
  }, []);

  useEffect(() => {
    const current = bars.find((b) => b.id === barId);
    setSelSlug((prev) => prev || current?.slug || bars[0]?.slug || "");
  }, [bars, barId]);

  const url = selSlug ? `${base}/${selSlug}` : base;

  useEffect(() => {
    if (!url) return;
    const opts = { width: 1024, margin: 2, color: { dark: "#1F2D44", light: "#FFFFFF" } } as const;
    QRCode.toDataURL(url, opts).then(setPngDataUrl).catch(() => {});
    QRCode.toString(url, { ...opts, type: "svg" }).then(setSvgString).catch(() => {});
  }, [url]);

  function download(filename: string, href: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function downloadSvg() {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    download(`${selSlug || "menu"}-qrcode.svg`, href);
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-navy">QR Code</h1>
      <p className="mb-6 text-sm text-brand-navy/60">
        Escolha o bar, imprima o QR e coloque-o nas mesas. Cada bar tem o seu próprio código.
      </p>

      <div className="rounded-2xl border border-brand-sand bg-white p-6">
        <label className="mb-1 block text-sm font-semibold text-brand-navy">Bar</label>
        <select
          value={selSlug}
          onChange={(e) => setSelSlug(e.target.value)}
          className="input mb-4"
        >
          {bars.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-semibold text-brand-navy">Endereço do menu</label>
        <input value={url} readOnly className="input mb-6 text-brand-navy/70" />

        <div className="flex flex-col items-center gap-5">
          <div className="rounded-2xl border border-brand-sand p-4">
            {pngDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pngDataUrl} alt="QR Code do menu" className="h-56 w-56" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-brand-navy/40">A gerar…</div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => download(`${selSlug || "menu"}-qrcode.png`, pngDataUrl)} disabled={!pngDataUrl} className="btn-primary disabled:opacity-50">
              Descarregar PNG
            </button>
            <button onClick={downloadSvg} disabled={!svgString} className="btn-ghost border border-brand-navy/15 disabled:opacity-50">
              Descarregar SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
