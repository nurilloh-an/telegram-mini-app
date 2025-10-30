import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchProducts, fetchUserOrders } from "./api/client";
import { CartDrawer } from "./components/CartDrawer";
import { CategoryTabs } from "./components/CategoryTabs";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { UserProfileForm } from "./components/UserProfileForm";
import { useCart } from "./context/CartContext";
import type { Category, Order, Product, User } from "./types";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const { state } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "cart" | "profile">("home");

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

  const loadOrders = useCallback(async (userId: number) => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const list = await fetchUserOrders(userId);
      setOrders(list);
    } catch (err) {
      console.error(err);
      setOrdersError("Buyurtma tarixini yuklab bo'lmadi");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadProducts(selectedCategory);
  }, [loadProducts, selectedCategory]);

  useEffect(() => {
    if (user) {
      void loadOrders(user.id);
    } else {
      setOrders([]);
      setOrdersError(null);
    }
  }, [user, loadOrders]);

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
  };

  const totalItems = useMemo(
    () => state.items.reduce((count, item) => count + item.quantity, 0),
    [state.items],
  );

  const handleNavigate = (tab: "home" | "cart" | "profile") => {
    if (!user && tab !== "home") {
      return;
    }
    setActiveTab(tab);
    if (tab === "cart") {
      setIsCartOpen(true);
    } else {
      setIsCartOpen(false);
    }
  };

  const gridColumns = useMemo(() => {
    if (products.length > 2) return "grid-cols-2";
    return "grid-cols-1";
  }, [products.length]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat("ru-RU"), []);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeStyle: "short" }),
    [],
  );

  const handleOrderCreated = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setActiveTab("profile");
    setIsCartOpen(false);
    if (user) {
      void loadOrders(user.id);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f5f7f9] pb-32 text-gray-900">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-6">
        <Header user={user ?? undefined} />

        {user ? null : (
          <div className="mt-8 rounded-[2.5rem] bg-white/95 p-6 shadow-xl ring-1 ring-white/60">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Buyurtma berish uchun ma'lumotlarni kiriting
            </h2>
            <UserProfileForm onReady={setUser} />
          </div>
        )}

        {user ? (
          <div className="mt-8 space-y-8">
            {activeTab === "profile" ? (
              <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60">
                <h2 className="text-xl font-bold text-gray-900">Profil ma'lumotlari</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Mijoz ma'lumotlarini yangilash va buyurtma tarixini bu yerdan kuzatib boring.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Ism</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-800">{user.name}</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Telefon</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-800">{user.phone_number}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 text-sm text-gray-600 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Til</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{user.language.toUpperCase()}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 text-sm text-gray-600 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Telegram ID</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{user.telegram_id}</p>
                  </div>
                </div>
                <div className="mt-8 rounded-3xl bg-white p-5 shadow-inner ring-1 ring-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">Buyurtmalar tarixi</h3>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {orders.length} ta buyurtma
                    </span>
                  </div>
                  {ordersLoading ? (
                    <p className="mt-4 text-sm text-gray-500">Buyurtmalar yuklanmoqda...</p>
                  ) : ordersError ? (
                    <p className="mt-4 text-sm text-red-500">{ordersError}</p>
                  ) : orders.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">
                      Hozircha buyurtma berilmadi. Menyudan tanlab savatga qo'shing.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {orders.map((order) => {
                        const statusLabel = order.status === "completed" ? "Yakunlandi" : "Jarayonda";
                        const statusColor =
                          order.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700";
                        return (
                          <li
                            key={order.id}
                            className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Buyurtma #{order.id}
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {dateFormatter.format(new Date(order.created_at))}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2 text-right">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
                                >
                                  {statusLabel}
                                </span>
                                <span className="text-base font-bold text-emerald-600">
                                  {currencyFormatter.format(order.total_price)} so'm
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-sm text-gray-600"
                                >
                                  <span>
                                    {item.product.name}
                                    <span className="text-gray-400"> × {item.quantity}</span>
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {currencyFormatter.format(item.total_price)} so'm
                                  </span>
                                </div>
                              ))}
                            </div>
                            {order.comment ? (
                              <p className="mt-3 rounded-2xl bg-white p-3 text-xs text-gray-500">
                                Izoh: {order.comment}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            ) : (
              <>
                <section>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Menyular</h2>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {categories.length} ta kategoriya
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Siz Market mijozlari uchun maxsus takliflar. Sevimli taomlaringizni tanlang va savatga qo'shing.
                  </p>
                </section>

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
                  <div className={`grid gap-5 ${gridColumns} md:grid-cols-3`}>
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={() => {
                          setIsCartOpen(true);
                          setActiveTab("cart");
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>

      {user ? (
        <CartDrawer
          user={user}
          open={isCartOpen}
          onClose={() => {
            setIsCartOpen(false);
            setActiveTab("home");
          }}
          onOrderCreated={handleOrderCreated}
        />
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 pb-4">
        <div className="mx-auto max-w-3xl px-4">
          <div className="grid grid-cols-3 items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-xl shadow-emerald-100/80 backdrop-blur">
            <button
              type="button"
              onClick={() => handleNavigate("home")}
              className={`flex flex-col items-center rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === "home" ? "text-emerald-600" : "text-gray-500"}`}
            >
              <span className="text-lg">🏠</span>
              Bosh sahifa
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("cart")}
              disabled={!user}
              className={`relative flex flex-col items-center rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === "cart" ? "text-emerald-600" : "text-gray-500"} ${!user ? "opacity-60" : ""}`}
            >
              <span className="text-lg">🛒</span>
              Savat
              {totalItems ? (
                <span className="absolute -top-1 right-4 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("profile")}
              disabled={!user}
              className={`flex flex-col items-center rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === "profile" ? "text-emerald-600" : "text-gray-500"} ${!user ? "opacity-60" : ""}`}
            >
              <span className="text-lg">👤</span>
              Profil
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default App;
