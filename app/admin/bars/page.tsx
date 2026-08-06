"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "@/components/admin/AdminContext";
import type { Bar } from "@/lib/types";

type Draft = {
  id?: string;
  slug: string;
  name: string;
  subtitle: string;
  primary_color: string;
  header_mode: "light" | "brand";
  logo_url: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

const empty = (sort: number): Draft => ({
  slug: "",
  name: "",
  subtitle: "",
  primary_color: "#800605",
  header_mode: "light",
  logo_url: null,
  is_active: true,
  is_default: false,
  sort_order: sort,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BarsPage() {
  const { isAdmin, bars, reloadBars } = useAdmin();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [membersFor, setMembersFor] = useState<Bar | null>(null);

  if (!isAdmin) {
    return <p className="py-16 text-center text-brand-navy/60">Sem permissão.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Bares</h1>
          <p className="text-sm text-brand-navy/60">{bars.length} bares</p>
        </div>
        <button onClick={() => setDraft(empty(bars.length + 1))} className="rounded-lg brand-gradient px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          + Novo bar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {bars.map((b) => (
          <div key={b.id} className="rounded-2xl border border-brand-sand bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-brand-sand" style={{ background: b.primary_color }}>
                {b.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-brand-navy">
                  {b.name}
                  {b.is_default && <span className="ml-2 rounded-full bg-brand-sand px-2 py-0.5 text-xs font-semibold text-brand-navy/60">raiz</span>}
                  {!b.is_active && <span className="ml-2 rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-semibold text-brand-navy/60">inativo</span>}
                </p>
                <p className="truncate text-sm text-brand-navy/60">/{b.slug}</p>
              </div>
              <span className="h-5 w-5 shrink-0 rounded-full border border-brand-sand" style={{ background: b.primary_color }} />
            </div>
            <div className="mt-3 flex gap-2 text-sm">
              <button onClick={() => setDraft({ ...b } as Draft)} className="rounded-lg border border-brand-navy/15 px-3 py-1.5 font-semibold text-brand-navy hover:bg-brand-sand">
                Editar
              </button>
              <button onClick={() => setMembersFor(b)} className="rounded-lg border border-brand-navy/15 px-3 py-1.5 font-semibold text-brand-navy hover:bg-brand-sand">
                Membros
              </button>
              <a href={`/${b.slug}`} target="_blank" className="rounded-lg px-3 py-1.5 font-semibold text-brand-navy hover:bg-brand-sand">
                Ver ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <BarModal
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={async () => {
            setDraft(null);
            await reloadBars();
          }}
        />
      )}
      {membersFor && <MembersModal bar={membersFor} onClose={() => setMembersFor(null)} />}
    </div>
  );
}

function BarModal({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Draft, v: any) => setD((p) => ({ ...p, [k]: v }));

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `bars/${(d.slug || "bar")}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseBrowser.storage.from("menu").upload(path, file, { upsert: false });
    if (upErr) {
      setUploading(false);
      setError("Falha no upload do logótipo.");
      return;
    }
    const { data } = supabaseBrowser.storage.from("menu").getPublicUrl(path);
    set("logo_url", data.publicUrl);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) return setError("O nome é obrigatório.");
    const slug = slugify(d.slug || d.name);
    if (!slug) return setError("O endereço (slug) é inválido.");
    setSaving(true);
    setError(null);

    const payload = {
      slug,
      name: d.name.trim(),
      subtitle: d.subtitle.trim(),
      primary_color: d.primary_color,
      header_mode: d.header_mode,
      logo_url: d.logo_url,
      is_active: d.is_active,
      is_default: d.is_default,
      sort_order: Number(d.sort_order) || 0,
    };

    const res = d.id
      ? await supabaseBrowser.from("bars").update(payload).eq("id", d.id)
      : await supabaseBrowser.from("bars").insert(payload);

    if (res.error) {
      setSaving(false);
      setError(res.error.message.includes("duplicate") ? "Já existe um bar com esse endereço (slug)." : "Não foi possível guardar.");
      return;
    }

    // Garante um único bar por defeito (raiz)
    if (d.is_default) {
      await supabaseBrowser.from("bars").update({ is_default: false }).eq("is_default", true).neq("slug", slug);
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-extrabold text-brand-navy">{d.id ? "Editar bar" : "Novo bar"}</h2>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-brand-sand" style={{ background: d.primary_color }}>
              {d.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.logo_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-ghost border border-brand-navy/15">
                {uploading ? "A carregar…" : d.logo_url ? "Trocar logótipo" : "Carregar logótipo"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome *"><input value={d.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="Ex.: LADO Porto" /></Field>
            <Field label="Endereço (slug)"><input value={d.slug} onChange={(e) => set("slug", e.target.value)} onBlur={(e) => set("slug", slugify(e.target.value))} className="input" placeholder="lado-porto" /></Field>
          </div>
          <Field label="Subtítulo"><input value={d.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="input" placeholder="Ex.: Boutique Wines · Porto" /></Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cor principal">
              <div className="flex items-center gap-2">
                <input type="color" value={d.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-14 rounded-lg border border-brand-navy/15" />
                <input value={d.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="input" />
              </div>
            </Field>
            <Field label="Estilo do cabeçalho">
              <select value={d.header_mode} onChange={(e) => set("header_mode", e.target.value)} className="input">
                <option value="light">Claro (logótipo destaca-se)</option>
                <option value="brand">Cor da marca (gradiente)</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <input type="checkbox" checked={d.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Ativo
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <input type="checkbox" checked={d.is_default} onChange={(e) => set("is_default", e.target.checked)} /> Raiz (/)
            </label>
            <Field label="Ordem"><input type="number" value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} className="input" /></Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary">{saving ? "A guardar…" : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ bar, onClose }: { bar: Bar; onClose: () => void }) {
  const [members, setMembers] = useState<{ user_id: string; email: string }[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabaseBrowser.rpc("bar_members_list", { p_bar: bar.id });
    setMembers((data ?? []) as any);
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bar.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabaseBrowser.rpc("assign_member", { p_email: email.trim(), p_bar: bar.id });
    if (error) {
      setMsg(error.message);
      return;
    }
    setEmail("");
    load();
  }
  async function remove(user_id: string) {
    await supabaseBrowser.rpc("remove_member", { p_user: user_id, p_bar: bar.id });
    load();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-lg font-extrabold text-brand-navy">Membros · {bar.name}</h2>
        <p className="mb-4 text-sm text-brand-navy/60">
          Quem pode gerir este bar. Crie primeiro o utilizador em Supabase (Authentication → Users) e depois adicione-o aqui pelo email.
        </p>

        <form onSubmit={add} className="mb-4 flex gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="email@exemplo.pt" className="input" />
          <button type="submit" className="btn-primary shrink-0">Adicionar</button>
        </form>
        {msg && <p className="mb-3 text-sm text-red-600">{msg}</p>}

        {loading ? (
          <p className="text-sm text-brand-navy/50">A carregar…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-brand-navy/50">Ainda sem membros. (O administrador acede sempre a todos os bares.)</p>
        ) : (
          <ul className="divide-y divide-brand-sand">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-brand-navy">{m.email}</span>
                <button onClick={() => remove(m.user_id)} className="font-semibold text-red-600 hover:underline">Remover</button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="btn-ghost">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-brand-navy">{label}</span>
      {children}
    </label>
  );
}
