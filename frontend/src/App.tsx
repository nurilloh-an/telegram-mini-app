import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchProducts, fetchUserOrders } from "./api/client";
import { AdminPanel } from "./components/AdminPanel";
import { CartPage } from "./components/CartPage";
import { CategoryTabs } from "./components/CategoryTabs";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { UserProfileForm } from "./components/UserProfileForm";
import { useCart } from "./context/CartContext";
import { useTelegram } from "./hooks/useTelegram";
import type { Category, Order, Product, User } from "./types";

const App: React.FC = () => {
  const { user: tgUser } = useTelegram();
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
  const [activeTab, setActiveTab] = useState<"home" | "cart" | "profile" | "admin">("home");
  const [cartView, setCartView] = useState<"cart" | "history">("cart");
  const [fulfillmentMode, setFulfillmentMode] = useState<"delivery" | "pickup">("delivery");
  const [destinationInfo, setDestinationInfo] = useState("");

  const adminTelegramIds = useMemo(() => {
    const raw = import.meta.env.VITE_ADMIN_TELEGRAM_IDS ?? "";
    return raw
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value));
  }, []);

  const adminPhoneNumbers = useMemo(() => {
    const raw = import.meta.env.VITE_ADMIN_PHONE_NUMBERS ?? "";
    return raw
      .split(",")
      .map((value) => value.replace(/\D/g, "").trim())
      .filter((value) => value.length > 0);
  }, []);

  const fallbackTelegramId = useMemo(() => {
    const raw = import.meta.env.VITE_FAKE_TELEGRAM_ID;
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, []);

  const adminTelegramId = useMemo(() => {
    const candidates = [user?.telegram_id, tgUser?.id, fallbackTelegramId ?? undefined];
    for (const candidate of candidates) {
      if (candidate && adminTelegramIds.includes(candidate)) {
        return candidate;
      }
    }
    return null;
  }, [adminTelegramIds, fallbackTelegramId, tgUser, user]);

  const adminPhoneNumber = useMemo(() => {
    if (!user?.phone_number) return null;
    const normalized = user.phone_number.replace(/\D/g, "");
    if (!normalized) return null;
    return adminPhoneNumbers.includes(normalized) ? normalized : null;
  }, [adminPhoneNumbers, user?.phone_number]);

  const isAdmin = adminTelegramId !== null || adminPhoneNumber !== null;

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

  const handleNavigate = (tab: "home" | "cart" | "profile" | "admin") => {
    setActiveTab(tab);
    if (tab === "cart") {
      setCartView("cart");
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
    setCartView("history");
    if (user) {
      void loadOrders(user.id);
    }
  };

  const handleCategoryCreated = useCallback(
    (category: Category) => {
      setCategories((prev) => {
        const exists = prev.some((item) => item.id === category.id);
        if (exists) {
          return prev.map((item) => (item.id === category.id ? category : item));
        }
        return [...prev, category];
      });
      setSelectedCategory((prev) => prev ?? category);
      void loadCategories();
    },
    [loadCategories],
  );

  const handleProductCreated = useCallback(
    (_product: Product) => {
      void loadProducts(selectedCategory);
    },
    [loadProducts, selectedCategory],
  );

  const adminNavColumns = isAdmin ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="relative min-h-screen bg-[#f5f7f9] pb-32 text-gray-900">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-6">
        {activeTab === "admin" && isAdmin ? (
          <div className="mt-8 space-y-8">
            <section className="rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-500 p-6 text-white shadow-xl">
              <h2 className="text-2xl font-bold">Siz Market boshqaruvi</h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Tasdiqlangan administrator sifatida katalogni yangilang: yangi kategoriyalar yarating va mahsulotlar qo'shing.
              </p>
            </section>
            <AdminPanel
              categories={categories}
              adminTelegramId={adminTelegramId}
              adminPhoneNumber={adminPhoneNumber}
              onCategoryCreated={handleCategoryCreated}
              onProductCreated={handleProductCreated}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {activeTab === "profile" ? (
              user ? (
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
                <section className="rounded-[2.5rem] bg-white/95 p-6 shadow-xl ring-1 ring-white/60">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">
                    Buyurtma berish uchun ma'lumotlarni kiriting
                  </h2>
                  <UserProfileForm onReady={setUser} />
                </section>
              )
            ) : activeTab === "cart" ? (
              <CartPage
                user={user}
                activeView={cartView}
                onViewChange={setCartView}
                    orders={orders}
                    ordersLoading={ordersLoading}
                    ordersError={ordersError}
                    onOrderCreated={handleOrderCreated}
                    onRequireProfile={() => setActiveTab("profile")}
                  />
            ) : (
              <>
                <Header
                  user={user ?? undefined}
                  fulfillmentMode={fulfillmentMode}
                  onFulfillmentModeChange={setFulfillmentMode}
                  destinationInfo={destinationInfo}
                  onDestinationInfoChange={setDestinationInfo}
                />
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
                  {!user ? (
                    <div className="mt-4 rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/80 p-4 text-sm text-emerald-700">
                      Profilingizni to'ldirish uchun pastdagi <strong>Profil</strong> bo'limiga o'ting. Telefon raqamingiz saqlangach, buyurtma berishingiz mumkin bo'ladi.
                    </div>
                  ) : null}
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
                          setActiveTab("cart");
                          setCartView("cart");
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 pb-4">
        <div className="mx-auto max-w-3xl px-4">
          <div
            className={`grid ${adminNavColumns} items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-xl shadow-emerald-100/80 backdrop-blur`}
          >
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
              className={`relative flex flex-col items-center rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === "cart" ? "text-emerald-600" : "text-gray-500"}`}
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
              className={`flex flex-col items-center rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === "profile" ? "text-emerald-600" : "text-gray-500"}`}
            >
              <span className="text-lg">👤</span>
              Profil
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => handleNavigate("admin")}
                className={`flex flex-col items-center rounded-full px-3 py-2 text-xs font-semibold transition ${activeTab === "admin" ? "text-emerald-600" : "text-gray-500"}`}
              >
                <span className="text-lg">⚙️</span>
                Boshqaruv
              </button>
            ) : null}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default App;
