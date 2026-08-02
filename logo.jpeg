"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Category } from "@/lib/types";

export default function CategoryModal({
  category,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  category: Category | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [namePt, setNamePt] = useState(category?.name_pt ?? "");
  const [nameEn, setNameEn] = useState(category?.name_en ?? "");
  const [sortOrder, setSortOrder] = useState<number>(
    category?.sort_order ?? nextSortOrder
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) {
      setError("O nome em português é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name_pt: namePt.trim(),
      name_en: nameEn.trim(),
      sort_order: Number(sortOrder) || 0,
    };

    const { error } = category
      ? await supabaseBrowser
          .from("categories")
          .update(payload)
          .eq("id", category.id)
      : await supabaseBrowser.from("categories").insert(payload);

    setSaving(false);
    if (error) {
      setError("Não foi possível guardar. Verifique a ligação.");
      return;
    }
    onSaved();
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="mb-4 text-lg font-extrabold text-brand-navy">
        {category ? "Editar categoria" : "Nova categoria"}
      </h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="Nome (Português) *">
          <input
            value={namePt}
            onChange={(e) => setNamePt(e.target.value)}
            className="input"
            placeholder="Ex.: Vinhos do Douro"
          />
        </Field>
        <Field label="Nome (Inglês)">
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="input"
            placeholder="Ex.: Douro Wines"
          />
        </Field>
        <Field label="Ordem">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="input w-28"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
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
