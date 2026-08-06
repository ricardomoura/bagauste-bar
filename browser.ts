import { unstable_noStore as noStore } from "next/cache";
import { fetchBarMenu } from "@/lib/menu";
import MenuView from "@/components/MenuView";

// A raiz mostra o bar por defeito (mantém o QR já existente do Bagaúste).
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  noStore();
  const { bar, categories, products } = await fetchBarMenu({ useDefault: true });

  if (!bar) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-brand-navy/60">
        Menu a ser preparado. Volte em breve!
      </div>
    );
  }

  return <MenuView bar={bar} categories={categories} products={products} />;
}
