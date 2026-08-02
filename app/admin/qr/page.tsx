"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrPage() {
  const [url, setUrl] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [svgString, setSvgString] = useState("");

  // URL por defeito: variável de ambiente, ou o domínio atual.
  useEffect(() => {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    const fallback =
      typeof window !== "undefined" ? window.location.origin : "";
    setUrl(configured && configured.length > 0 ? configured : fallback);
  }, []);

  useEffect(() => {
    if (!url) return;
    const opts = {
      width: 1024,
      margin: 2,
      color: { dark: "#1F2D44", light: "#FFFFFF" },
    } as const;

    QRCode.toDataURL(url, opts).then(setPngDataUrl).catch(() => {});
    QRCode.toString(url, { ...opts, type: "svg" })
      .then(setSvgString)
      .catch(() => {});
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
    download("bagauste-bar-qrcode.svg", href);
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-navy">QR Code</h1>
      <p className="mb-6 text-sm text-brand-navy/60">
        Imprima este código e coloque-o nas mesas. Os clientes leem-no com o
        telemóvel e abrem o menu.
      </p>

      <div className="rounded-2xl border border-brand-sand bg-white p-6">
        <label className="mb-1 block text-sm font-semibold text-brand-navy">
          Endereço do menu (para onde o QR aponta)
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input mb-6"
          placeholder="https://o-seu-site.vercel.app"
        />

        <div className="flex flex-col items-center gap-5">
          <div className="rounded-2xl border border-brand-sand p-4">
            {pngDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngDataUrl}
                alt="QR Code do menu"
                className="h-56 w-56"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-brand-navy/40">
                A gerar…
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                download("bagauste-bar-qrcode.png", pngDataUrl)
              }
              disabled={!pngDataUrl}
              className="btn-primary disabled:opacity-50"
            >
              Descarregar PNG
            </button>
            <button
              onClick={downloadSvg}
              disabled={!svgString}
              className="btn-ghost border border-brand-navy/15 disabled:opacity-50"
            >
              Descarregar SVG
            </button>
          </div>
          <p className="text-center text-xs text-brand-navy/50">
            PNG é ideal para imprimir. SVG mantém a qualidade em qualquer
            tamanho (cartazes, cavaletes).
          </p>
        </div>
      </div>
    </div>
  );
}
