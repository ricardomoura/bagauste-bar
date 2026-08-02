import { unstable_noStore as noStore } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import MenuView from "@/components/MenuView";

// O menu deve refletir sempre as últimas alterações do backoffice.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  // Garante que esta página nunca é servida a partir de cache.
  noStore();

  const supabase = getServerSupabase();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <MenuView
      categories={(categories ?? []) as Category[]}
      products={(products ?? []) as Product[]}
    />
  );
}
