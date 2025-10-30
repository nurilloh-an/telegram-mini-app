import { useEffect, useMemo, useState } from "react";
import { createOrder } from "../api/client";
import { useCart } from "../context/CartContext";
import type { Order, User } from "../types";

interface Props {
  user: User;
  open: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

export const CartDrawer: React.FC<Props> = ({ user, open, onClose, onOrderCreated }) => {
  const { state, setQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!state.items.length) return;

    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({ user_id: user.id, items: itemsForPayload });
      setSuccess(true);
      clearCart();
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

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-4 pt-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[2.25rem] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Siz Market</p>
            <h2 className="text-lg font-semibold text-gray-900">Savat</h2>
          </div>
          <div className="flex items-center gap-3">
            {state.items.length ? (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
              >
                Tozalash
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {state.items.length ? (
          <div className="max-h-[45vh] overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {state.items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-3"
                >
                  {item.product.image_path ? (
                    <img
                      src={item.product.image_path}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      🍱
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <h3 className="text-sm font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-xs text-gray-500">{item.product.detail ?? "Mazali taom"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-600 shadow">
                        {new Intl.NumberFormat("ru-RU").format(item.product.price)} so'm
                      </div>
                      <div className="flex items-center gap-2">
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
                    className="text-xs font-semibold uppercase tracking-wide text-red-500"
                  >
                    O'chirish
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Savatda hozircha mahsulot yo'q. Menyudan tanlab qo'shing.
          </div>
        )}

        {error ? <p className="px-6 text-sm text-red-500">{error}</p> : null}
        {success ? (
          <div className="px-6 pb-3">
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Buyurtmangiz qabul qilindi! Operator tez orada bog'lanadi.
            </p>
          </div>
        ) : null}

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-700">
            <span>Umumiy summa</span>
            <span className="text-lg font-bold text-emerald-600">
              {new Intl.NumberFormat("ru-RU").format(totalPrice)} so'm
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-full bg-emerald-500 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={!state.items.length || submitting || success}
          >
            {submitting ? "Yuborilmoqda..." : success ? "Buyurtma yuborildi" : "Buyurtma berish"}
          </button>
        </div>
      </div>
    </div>
  );
};
