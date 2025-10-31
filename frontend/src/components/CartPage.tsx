import { useEffect, useMemo, useState } from "react";
import { createOrder } from "../api/client";
import { useCart } from "../context/CartContext";
import type { Order, User } from "../types";

interface CartPageProps {
  user: User | null;
  activeView: "cart" | "history";
  onViewChange: (view: "cart" | "history") => void;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  onOrderCreated?: (order: Order) => void;
  onRequireProfile: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  user,
  activeView,
  onViewChange,
  orders,
  ordersLoading,
  ordersError,
  onOrderCreated,
  onRequireProfile,
}) => {
  const { state, setQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat("ru-RU"), []);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeStyle: "short" }),
    [],
  );

  useEffect(() => {
    if (state.items.length) {
      setSuccess(false);
    }
  }, [state.items.length]);

  const itemsForPayload = useMemo(
    () => state.items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
    [state.items],
  );

  const handleSubmit = async () => {
    if (!state.items.length) {
      return;
    }

    if (!user) {
      onRequireProfile();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({ user_id: user.id, items: itemsForPayload });
      setSuccess(true);
      clearCart();
      onViewChange("history");
      if (order) {
        onOrderCreated?.(order);
      }
    } catch (err) {
      console.error(err);
      setError("Buyurtma yuborilmadi. Iltimos qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCartItems = () => {
    if (!state.items.length) {
      return <p className="text-center text-sm text-gray-500">Savatda hozircha mahsulot yo'q.</p>;
    }

    return (
      <div className="space-y-4">
        {state.items.map((item) => (
          <div
            key={item.product.id}
            className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-gray-50/80 p-4 md:flex-row md:items-start"
          >
            {item.product.image_path ? (
              <img
                src={item.product.image_path}
                alt={item.product.name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-600">
                🍱
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{item.product.name}</h3>
                <p className="text-xs text-gray-500">{item.product.detail ?? "Mazali taom"}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-600 shadow">
                  {currencyFormatter.format(item.product.price)} so'm
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.product, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-600"
                  >
                    −
                  </button>
                  <span className="text-base font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.product, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFromCart(item.product.id)}
              className="self-start text-xs font-semibold uppercase tracking-wide text-red-500"
            >
              O'chirish
            </button>
          </div>
        ))}
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-inner ring-1 ring-gray-100">
          <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
            <span>Umumiy summa</span>
            <span className="text-lg font-bold text-emerald-600">
              {currencyFormatter.format(totalPrice)} so'm
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
            >
              Savatni tozalash
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || success || !state.items.length}
              className="flex-1 rounded-full bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? "Yuborilmoqda..." : success ? "Buyurtma yuborildi" : "Buyurtma berish"}
            </button>
          </div>
          {!user ? (
            <p className="text-xs text-emerald-600">
              Buyurtma berishdan avval profil bo'limida ism va telefon raqamingizni saqlang.
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {success ? (
          <p className="rounded-3xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            Buyurtmangiz qabul qilindi! Operator tez orada bog'lanadi.
          </p>
        ) : null}
      </div>
    );
  };

  const renderHistory = () => {
    if (!user) {
      return (
        <p className="text-sm text-gray-500">
          Buyurtma tarixini ko'rish uchun avval profil ma'lumotlarini to'ldiring.
        </p>
      );
    }

    if (ordersLoading) {
      return <p className="text-sm text-gray-500">Buyurtmalar yuklanmoqda...</p>;
    }

    if (ordersError) {
      return <p className="text-sm text-red-500">{ordersError}</p>;
    }

    if (!orders.length) {
      return <p className="text-sm text-gray-500">Hozircha buyurtma tarixi mavjud emas.</p>;
    }

    return (
      <ul className="space-y-4">
        {orders.map((order) => {
          const statusLabel = order.status === "completed" ? "Yakunlandi" : "Jarayonda";
          const statusColor =
            order.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
          return (
            <li key={order.id} className="rounded-3xl border border-gray-100 bg-gray-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Buyurtma #{order.id}</p>
                  <p className="font-semibold text-gray-900">{dateFormatter.format(new Date(order.created_at))}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    {currencyFormatter.format(order.total_price)} so'm
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-gray-600">
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
                <p className="mt-3 rounded-2xl bg-white p-3 text-xs text-gray-500">Izoh: {order.comment}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="rounded-[2.5rem] bg-white/95 p-6 shadow-xl ring-1 ring-white/60">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Savat va buyurtmalar</h2>
          <p className="text-sm text-gray-500">Tanlangan mahsulotlarni boshqaring va buyurtma tarixini ko'ring.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
          <span>🛒 {state.items.length}</span>
          <span>•</span>
          <span>📦 {orders.length}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-emerald-50 p-1">
        <button
          type="button"
          onClick={() => onViewChange("cart")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeView === "cart" ? "bg-white text-emerald-600 shadow" : "text-emerald-500"
          }`}
        >
          Savat
        </button>
        <button
          type="button"
          onClick={() => onViewChange("history")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeView === "history" ? "bg-white text-emerald-600 shadow" : "text-emerald-500"
          }`}
        >
          Buyurtma tarixi
        </button>
      </div>

      <div className="mt-6 rounded-3xl bg-gray-50/70 p-6">
        {activeView === "cart" ? renderCartItems() : renderHistory()}
      </div>
    </section>
  );
};
