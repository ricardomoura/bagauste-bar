import { getServerSupabase } from "./supabase/server";
import type { Bar, Category, Product } from "./types";

export type BarMenu = {
  bar: Bar | null;
  categories: Category[];
  products: Product[];
};

// Carrega um bar (por slug, ou o bar por defeito) e o seu menu ativo.
export async function fetchBarMenu(opts: {
  slug?: string;
  useDefault?: boolean;
}): Promise<BarMenu> {
  const supabase = getServerSupabase();

  let q = supabase.from("bars").select("*").eq("is_active", true).limit(1);
  if (opts.slug) q = q.eq("slug", opts.slug);
  else q = q.eq("is_default", true);

  const { data: bars } = await q;
  const bar = (bars?.[0] ?? null) as Bar | null;
  if (!bar) return { bar: null, categories: [], products: [] };

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("bar_id", bar.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("bar_id", bar.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    bar,
    categories: (categories ?? []) as Category[],
    products: (products ?? []) as Product[],
  };
}
