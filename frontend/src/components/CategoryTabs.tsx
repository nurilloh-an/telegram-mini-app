import clsx from "clsx";
import type { Category } from "../types";

interface Props {
  categories: Category[];
  activeId: number | null;
  onSelect: (category: Category | null) => void;
}

export const CategoryTabs: React.FC<Props> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={clsx(
          "flex min-w-[88px] flex-col items-center rounded-3xl px-3 pb-3 pt-4 text-xs font-semibold uppercase tracking-wide transition",
          activeId === null
            ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200"
            : "bg-white/90 text-gray-600 shadow",
        )}
      >
        <span
          className={clsx(
            "mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border text-lg",
            activeId === null
              ? "border-white/40 bg-white/20"
              : "border-gray-100 bg-gray-50 text-gray-500",
          )}
        >
          🍽️
        </span>
        Hammasi
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category)}
          className={clsx(
            "flex min-w-[88px] flex-col items-center rounded-3xl px-3 pb-3 pt-4 text-xs font-semibold uppercase tracking-wide transition",
            activeId === category.id
              ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200"
              : "bg-white/90 text-gray-600 shadow",
          )}
        >
          <span
            className={clsx(
              "mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border",
              activeId === category.id
                ? "border-white/40 bg-white/15"
                : "border-gray-100 bg-gray-50",
            )}
          >
            {category.image_path ? (
              <img src={category.image_path} alt={category.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">🥗</span>
            )}
          </span>
          <span
            className="text-center leading-tight"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
};
