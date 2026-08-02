"use client";

import { useMemo, useState } from "react";
import type { Category, Product, Lang } from "@/lib/types";

const T = {
  pt: {
    tagline: "Douro Valley",
    empty: "Menu a ser preparado. Volte em breve!",
    noItems: "Sem itens nesta categoria.",
    expandAll: "Expandir tudo",
    collapseAll: "Colapsar tudo",
  },
  en: {
    tagline: "Douro Valley",
    empty: "Menu coming soon. Check back shortly!",
    noItems: "No items in this category.",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
  },
};

function formatPrice(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "pt" ? "pt-PT" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function MenuView({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [lang, setLang] = useState<Lang>("pt");
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const t = T[lang];

  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const c of categories) map.set(c.id, []);
    for (const p of products) {
      if (p.category_id && map.has(p.category_id)) {
        map.get(p.category_id)!.push(p);
      }
    }
    return map;
  }, [categories, products]);

  const visibleCategories = categories.filter(
    (c) => (productsByCategory.get(c.id)?.length ?? 0) > 0
  );

  const toggleCat = (id: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () =>
    setOpenCats(new Set(visibleCategories.map((c) => c.id)));
  const collapseAll = () => setOpenCats(new Set());

  const openAndScroll = (id: string) => {
    setOpenCats((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-${id}`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  };

  return (
    <div className="min-h-screen">
      {/* Cabeçalho */}
      <header className="brand-gradient text-white">
        <div className="mx-auto max-w-3xl px-5 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-44 w-44 items-center justify-center rounded-full bg-white shadow-xl overflow-hidden sm:h-52 sm:w-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="Bagaúste Bar"
              className="h-full w-full object-contain p-3"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            BAGAÚSTE BAR
          </h1>
          <p className="mt-1 text-sm font-medium text-white/90">{t.tagline}</p>
        </div>
      </header>

      {/* Barra de idioma + categorias (fixa) */}
      <div className="sticky top-0 z-20 border-b border-brand-sand bg-brand-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
          <nav className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {visibleCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => openAndScroll(c.id)}
                className="whitespace-nowrap rounded-full border border-brand-navy/15 bg-white px-4 py-1.5 text-sm font-semibold text-brand-navy transition hover:border-brand-orange hover:text-brand-orange"
              >
                {lang === "pt" ? c.name_pt : c.name_en || c.name_pt}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 overflow-hidden rounded-full border border-brand-navy/15 bg-white text-xs font-bold">
            <button
              onClick={() => setLang("pt")}
              className={`px-3 py-1.5 transition ${
                lang === "pt"
                  ? "bg-brand-navy text-white"
                  : "text-brand-navy hover:bg-brand-sand"
              }`}
            >
              PT
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition ${
                lang === "en"
                  ? "bg-brand-navy text-white"
                  : "text-brand-navy hover:bg-brand-sand"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo do menu */}
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-5">
        {visibleCategories.length === 0 && (
          <p className="py-20 text-center text-brand-navy/60">{t.empty}</p>
        )}

        {visibleCategories.length > 0 && (
          <div className="mb-4 flex justify-end gap-4 text-xs font-semibold text-brand-navy/60">
            <button onClick={expandAll} className="hover:text-brand-orange">
              {t.expandAll}
            </button>
            <span className="text-brand-navy/20">·</span>
            <button onClick={collapseAll} className="hover:text-brand-orange">
              {t.collapseAll}
            </button>
          </div>
        )}

        {visibleCategories.map((c) => {
          const items = productsByCategory.get(c.id) ?? [];
          const isOpen = openCats.has(c.id);
          return (
            <section
              key={c.id}
              id={`cat-${c.id}`}
              className="mb-3 scroll-mt-24 overflow-hidden rounded-2xl border border-brand-sand bg-white/60"
            >
              <button
                onClick={() => toggleCat(c.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <h2 className="text-lg font-extrabold text-brand-navy">
                  {lang === "pt" ? c.name_pt : c.name_en || c.name_pt}
                </h2>
                <span className="rounded-full bg-brand-sand px-2 py-0.5 text-xs font-bold text-brand-navy/60">
                  {items.length}
                </span>
                <span className="h-px flex-1 bg-brand-sand" />
                <svg
                  className={`h-5 w-5 shrink-0 text-brand-orange transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen && (
                <div className="space-y-3 px-3 pb-3">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} lang={lang} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <footer className="border-t border-brand-sand py-6 text-center text-xs text-brand-navy/50">
        Bagaúste Bar · {T[lang].tagline}
      </footer>
    </div>
  );
}

function ProductCard({ product: p, lang }: { product: Product; lang: Lang }) {
  const name = lang === "pt" ? p.name_pt : p.name_en || p.name_pt;
  const description =
    lang === "pt" ? p.description_pt : p.description_en || p.description_pt;

  return (
    <article className="flex gap-4 rounded-2xl border border-brand-sand bg-white p-3 shadow-sm">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-sand">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image_url}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-orange/50">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="9" r="3.2" />
              <path d="M4 20c1.2-4 5-6 8-6s6.8 2 8 6" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-tight text-brand-navy">{name}</h3>
          <span className="whitespace-nowrap font-extrabold text-brand-orange">
            {formatPrice(p.price, lang)}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-sm leading-snug text-brand-navy/70">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}
