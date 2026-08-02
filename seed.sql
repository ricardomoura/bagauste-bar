"use client";

import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Category, Product } from "@/lib/types";

export default function ProductModal({
  product,
  categories,
  defaultCategoryId,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  defaultCategoryId: string | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>(
    product?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [namePt, setNamePt] = useState(product?.name_pt ?? "");
  const [nameEn, setNameEn] = useState(product?.name_en ?? "");
  const [descPt, setDescPt] = useState(product?.description_pt ?? "");
  const [descEn, setDescEn] = useState(product?.description_en ?? "");
  const [price, setPrice] = useState<string>(
    product ? String(product.price) : ""
  );
  const [sortOrder, setSortOrder] = useState<number>(
    product?.sort_order ?? nextSortOrder
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.image_url ?? null
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `produtos/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabaseBrowser.storage
      .from("menu")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (upErr) {
      setUploading(false);
      setError("Falha no upload da imagem.");
      return;
    }

    const { data } = supabaseBrowser.storage.from("menu").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) {
      setError("O nome em português é obrigatório.");
      return;
    }
    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      category_id: categoryId,
      name_pt: namePt.trim(),
      name_en: nameEn.trim(),
      description_pt: descPt.trim(),
      description_en: descEn.trim(),
      price: Number(String(price).replace(",", ".")) || 0,
      image_url: imageUrl,
      sort_order: Number(sortOrder) || 0,
    };

    const { error } = product
      ? await supabaseBrowser
          .from("products")
          .update(payload)
          .eq("id", product.id)
      : await supabaseBrowser.from("products").insert(payload);

    setSaving(false);
    if (error) {
      setError("Não foi possível guardar. Verifique a ligação.");
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-extrabold text-brand-navy">
          {product ? "Editar produto" : "Novo produto"}
        </h2>

        <form onSubmit={save} className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-sand">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-brand-navy/40">
                  sem foto
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-ghost border border-brand-navy/15"
              >
                {uploading ? "A carregar…" : imageUrl ? "Trocar foto" : "Carregar foto"}
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="block text-sm font-semibold text-red-600"
                >
                  Remover foto
                </button>
              )}
            </div>
          </div>

          <Field label="Categoria *">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_pt}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome (Português) *">
              <input
                value={namePt}
                onChange={(e) => setNamePt(e.target.value)}
                className="input"
                placeholder="Ex.: Tosta mista"
              />
            </Field>
            <Field label="Nome (Inglês)">
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="input"
                placeholder="Ex.: Ham & cheese toast"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Descrição (Português)">
              <textarea
                value={descPt}
                onChange={(e) => setDescPt(e.target.value)}
                rows={2}
                className="input resize-none"
              />
            </Field>
            <Field label="Descrição (Inglês)">
              <textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={2}
                className="input resize-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço (€) *">
              <input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input"
                placeholder="0,00"
              />
            </Field>
            <Field label="Ordem">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary"
            >
              {saving ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-brand-navy">
        {label}
      </span>
      {children}
    </label>
  );
}
