import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchProducts } from "./api/client";
import { CartDrawer } from "./components/CartDrawer";
import { CategoryTabs } from "./components/CategoryTabs";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { UserProfileForm } from "./components/UserProfileForm";
import type { Category, Product, User } from "./types";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const list = await fetchCategories();
      setCategories(list);
    } catch (err) {
      console.error(err);
      setError("Kategoriyalarni yuklab bo'lmadi");
    }
  }, []);

  const loadProducts = useCallback(async (category?: Category | null) => {
    try {
      setLoading(true);
      const list = await fetchProducts(category?.id ?? undefined);
      setProducts(list);
    } catch (err) {
      console.error(err);
      setError("Mahsulotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadProducts(selectedCategory);
  }, [loadProducts, selectedCategory]);

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
  };

  const gridColumns = useMemo(() => {
    if (products.length > 2) return "grid-cols-2";
    return "grid-cols-1";
  }, [products.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-32">
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <Header user={user ?? undefined} />

        {user ? null : (
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Buyurtma berish uchun ma'lumotlarni kiriting</h2>
            <UserProfileForm onReady={setUser} />
          </div>
        )}

        {user ? (
          <div className="mt-6 space-y-6">
            <CategoryTabs
              categories={categories}
              activeId={selectedCategory?.id ?? null}
              onSelect={handleCategorySelect}
            />

            {loading ? (
              <p className="text-center text-sm text-gray-500">Yuklanmoqda...</p>
            ) : error ? (
              <p className="text-center text-sm text-red-500">{error}</p>
            ) : (
              <div className={`grid gap-4 ${gridColumns} md:grid-cols-3`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {user ? <CartDrawer user={user} /> : null}
    </div>
  );
};

export default App;
