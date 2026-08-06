import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { fetchBarMenu } from "@/lib/menu";
import MenuView from "@/components/MenuView";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function BarPage({
  params,
}: {
  params: { slug: string };
}) {
  noStore();
  const { bar, categories, products } = await fetchBarMenu({
    slug: params.slug,
  });

  if (!bar) notFound();

  return <MenuView bar={bar} categories={categories} products={products} />;
}
