import { Catalog } from "~/components/Catalog";
import productsData from "../../products.json";

export default async function HomePage() {
  const products = productsData;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <Catalog initialProducts={products} />
    </main>
  );
}
