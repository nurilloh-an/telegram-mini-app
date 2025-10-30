import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm">
      {product.image_path ? (
        <img
          src={product.image_path}
          alt={product.name}
          className="h-40 w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
          No image
        </div>
      )}
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        {product.detail ? (
          <p className="mt-1 text-sm text-gray-500" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {product.detail}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xl font-bold text-emerald-600">{product.price.toFixed(2)} so'm</span>
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
          >
            Savatga
          </button>
        </div>
      </div>
    </div>
  );
};
