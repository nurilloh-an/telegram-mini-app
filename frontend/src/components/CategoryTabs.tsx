import clsx from "clsx";
import type { Category } from "../types";

interface Props {
  categories: Category[];
  activeId: number | null;
  onSelect: (category: Category | null) => void;
}

export const CategoryTabs: React.FC<Props> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={clsx(
          "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
          activeId === null
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
            : "bg-white text-gray-600 shadow",
        )}
      >
        Hammasi
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category)}
          className={clsx(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
            activeId === category.id
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
              : "bg-white text-gray-600 shadow",
          )}
        >
          {category.image_path ? (
            <img src={category.image_path} alt={category.name} className="h-6 w-6 rounded-full object-cover" />
          ) : null}
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
};
