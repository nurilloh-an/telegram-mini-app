import { useEffect, useMemo, useState } from "react";
import { createOrder } from "../api/client";
import { useCart } from "../context/CartContext";
import type { User } from "../types";

interface Props {
  user: User;
}

export const CartDrawer: React.FC<Props> = ({ user }) => {
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
      await createOrder({ user_id: user.id, items: itemsForPayload });
      setSuccess(true);
      clearCart();
    } catch (err) {
      console.error(err);
      setError("Buyurtma yuborilmadi. Iltimos qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!state.items.length && !success) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-3xl bg-white p-4 shadow-2xl shadow-emerald-200">
      <div className="mx-auto max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Savat</h2>
          {state.items.length ? (
            <button
              type="button"
              onClick={clearCart}
              className="text-sm text-emerald-600 underline"
            >
              Tozalash
            </button>
          ) : null}
        </div>

        {state.items.length ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Mahsulot</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Soni</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Narx</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Jami</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.items.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.product.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.product, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600"
                        >
                          -
                        </button>
                        <span className="text-base font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.product, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {item.product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {(item.product.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-sm text-red-500"
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-right text-sm font-semibold" colSpan={3}>
                    Umumiy
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-emerald-600">
                    {totalPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        {success ? (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            Buyurtmangiz qabul qilindi! Operator tez orada bog'lanadi.
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 w-full rounded-xl bg-emerald-500 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!state.items.length || submitting || success}
        >
          {submitting ? "Yuborilmoqda..." : "Buyurtma berish"}
        </button>
      </div>
    </div>
  );
};
