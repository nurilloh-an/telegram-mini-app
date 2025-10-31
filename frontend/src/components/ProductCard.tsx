import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface Props {
  product: Product;
  onAdd?: () => void;
}

export const ProductCard: React.FC<Props> = ({ product, onAdd }) => {
  const { state, addToCart, setQuantity } = useCart();

  const cartItem = state.items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const handleIncrease = () => {
    addToCart(product);
    if (quantity === 0) {
      onAdd?.();
    }
  };

  const handleDecrease = () => {
    if (quantity <= 0) return;
    setQuantity(product, quantity - 1);
  };

  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="group flex h-full flex-col rounded-[2rem] bg-white/95 p-4 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60 backdrop-blur transition hover:-translate-y-1 hover:shadow-emerald-200/70">
      <div className="relative overflow-hidden rounded-3xl">
        {product.image_path ? (
          <img
            src={product.image_path}
            alt={product.name}
            className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 text-lg text-emerald-700">
            📦
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-70" />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 shadow">
          Siz Market
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-base font-semibold text-gray-900 md:text-lg">{product.name}</h3>
        {product.detail ? (
          <p
            className="mt-2 text-xs text-gray-500 md:text-sm"
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {product.detail}
          </p>
        ) : (
          <p className="mt-2 text-xs text-gray-400">Tavsif tez orada qo'shiladi.</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Narx</span>
            <p className="text-xl font-bold text-emerald-600 md:text-2xl">{formattedPrice} so'm</p>
          </div>
          {quantity > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-emerald-600 shadow-inner">
              <button
                type="button"
                onClick={handleDecrease}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-semibold text-emerald-500 shadow transition hover:bg-emerald-50"
                aria-label="Mahsulotni kamaytirish"
              >
                -
              </button>
              <span className="min-w-[1.5rem] text-center text-base font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrease}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white shadow transition hover:bg-emerald-600"
                aria-label="Mahsulotni ko'paytirish"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleIncrease}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
              aria-label="Savatga qo'shish"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
