"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Category, Product } from "@/lib/types";
import CategoryModal from "./CategoryModal";
import ProductModal from "./ProductModal";

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const [catModal, setCatModal] = useState<{
    open: boolean;
    category: Category | null;
  }>({ open: false, category: null });

  const [prodModal, setProdModal] = useState<{
    open: boolean;
    product: Product | null;
    categoryId: string | null;
  }>({ open: false, product: null, categoryId: null });

  // silent = atualiza os dados sem mostrar o ecrã "A carregar…",
  // para não perder a posição de scroll depois de cada ação.
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabaseBrowser
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabaseBrowser
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);
    setCategories((cats ?? []) as Category[]);
    setProducts((prods ?? []) as Product[]);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCat = (id: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const expandAll = () => setOpenCats(new Set(categories.map((c) => c.id)));
  const collapseAll = () => setOpenCats(new Set());

  async function deleteCategory(c: Category) {
    if (
      !confirm(
        `Eliminar a categoria "${c.name_pt}" e todos os seus produtos? Esta ação é irreversível.`
      )
    )
      return;
    await supabaseBrowser.from("categories").delete().eq("id", c.id);
    load(true);
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Eliminar o produto "${p.name_pt}"?`)) return;
    await supabaseBrowser.from("products").delete().eq("id", p.id);
    load(true);
  }

  async function toggleProductActive(p: Product) {
    await supabaseBrowser
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    load(true);
  }

  async function toggleCategoryActive(c: Category) {
    await supabaseBrowser
      .from("categories")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    load(true);
  }

  if (loading) {
    return <p className="py-16 text-center text-brand-navy/60">A carregar…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">
            Gestão do Menu
          </h1>
          <p className="text-sm text-brand-navy/60">
            {categories.length} categorias · {products.length} produtos
          </p>
        </div>
        <button
          onClick={() => setCatModal({ open: true, category: null })}
          className="rounded-lg brand-gradient px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          + Nova categoria
        </button>
      </div>

      {categories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-navy/20 bg-white p-10 text-center text-brand-navy/60">
          Ainda não há categorias. Comece por criar uma.
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-3 flex justify-end gap-4 text-xs font-semibold text-brand-navy/60">
          <button onClick={expandAll} className="hover:text-brand-orange">
            Expandir tudo
          </button>
          <span className="text-brand-navy/20">·</span>
          <button onClick={collapseAll} className="hover:text-brand-orange">
            Colapsar tudo
          </button>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((c) => {
          const items = products.filter((p) => p.category_id === c.id);
          const isOpen = openCats.has(c.id);
          return (
            <section
              key={c.id}
              className="overflow-hidden rounded-2xl border border-brand-sand bg-white"
            >
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <button
                  onClick={() => toggleCat(c.id)}
                  aria-expanded={isOpen}
                  className="flex flex-1 items-center gap-2 text-left"
                >
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
                  <span className="font-extrabold text-brand-navy">
                    {c.name_pt}
                  </span>
                  <span className="rounded-full bg-brand-sand px-2 py-0.5 text-xs font-bold text-brand-navy/60">
                    {items.length}
                  </span>
                  {!c.is_active && (
                    <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-semibold text-brand-navy/60">
                      Oculta
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1 text-sm">
                  <button
                    onClick={() => toggleCategoryActive(c)}
                    className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-navy hover:bg-brand-sand"
                    title={c.is_active ? "Ocultar" : "Mostrar"}
                  >
                    {c.is_active ? "👁" : "🚫"}
                  </button>
                  <button
                    onClick={() => setCatModal({ open: true, category: c })}
                    className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-navy hover:bg-brand-sand"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteCategory(c)}
                    className="rounded-lg px-2.5 py-1.5 font-semibold text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-brand-sand">
                  <div className="divide-y divide-brand-sand">
                    {items.length === 0 && (
                      <p className="px-4 py-5 text-sm text-brand-navy/50">
                        Sem produtos nesta categoria.
                      </p>
                    )}
                    {items.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-sand">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-brand-navy/30">
                              sem foto
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-brand-navy">
                            {p.name_pt}
                            {!p.is_active && (
                              <span className="ml-2 rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-semibold text-brand-navy/60">
                                Oculto
                              </span>
                            )}
                          </p>
                          {p.description_pt && (
                            <p className="truncate text-sm text-brand-navy/60">
                              {p.description_pt}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-extrabold text-brand-orange">
                          {new Intl.NumberFormat("pt-PT", {
                            style: "currency",
                            currency: "EUR",
                          }).format(p.price)}
                        </span>
                        <div className="flex shrink-0 items-center gap-1 text-sm">
                          <button
                            onClick={() => toggleProductActive(p)}
                            className="rounded-lg px-2 py-1.5 text-brand-navy hover:bg-brand-sand"
                            title={p.is_active ? "Ocultar" : "Mostrar"}
                          >
                            {p.is_active ? "👁" : "🚫"}
                          </button>
                          <button
                            onClick={() =>
                              setProdModal({
                                open: true,
                                product: p,
                                categoryId: c.id,
                              })
                            }
                            className="rounded-lg px-2.5 py-1.5 font-semibold text-brand-navy hover:bg-brand-sand"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteProduct(p)}
                            className="rounded-lg px-2.5 py-1.5 font-semibold text-red-600 hover:bg-red-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-brand-sand px-4 py-3">
                    <button
                      onClick={() =>
                        setProdModal({
                          open: true,
                          product: null,
                          categoryId: c.id,
                        })
                      }
                      className="rounded-lg border border-brand-orange px-3 py-1.5 text-sm font-bold text-brand-orange hover:bg-brand-orange hover:text-white"
                    >
                      + Adicionar produto
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {catModal.open && (
        <CategoryModal
          category={catModal.category}
          nextSortOrder={categories.length + 1}
          onClose={() => setCatModal({ open: false, category: null })}
          onSaved={() => {
            setCatModal({ open: false, category: null });
            load(true);
          }}
        />
      )}

      {prodModal.open && (
        <ProductModal
          product={prodModal.product}
          categories={categories}
          defaultCategoryId={prodModal.categoryId}
          nextSortOrder={
            products.filter((p) => p.category_id === prodModal.categoryId)
              .length + 1
          }
          onClose={() =>
            setProdModal({ open: false, product: null, categoryId: null })
          }
          onSaved={() => {
            setProdModal({ open: false, product: null, categoryId: null });
            load(true);
          }}
        />
      )}
    </div>
  );
}
