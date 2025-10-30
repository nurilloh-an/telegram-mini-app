import { useEffect, useMemo, useState } from "react";
import { createCategory, createProduct } from "../api/client";
import type { Category, Product } from "../types";

interface Props {
  categories: Category[];
  adminTelegramId: number;
  onCategoryCreated?: (category: Category) => void;
  onProductCreated?: (product: Product) => void;
}

export const AdminPanel: React.FC<Props> = ({
  categories,
  adminTelegramId,
  onCategoryCreated,
  onProductCreated,
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDetail, setProductDetail] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length && !productCategoryId) {
      setProductCategoryId(categories[0].id);
    }
  }, [categories, productCategoryId]);

  const canCreateCategory = useMemo(() => categoryName.trim().length > 0, [categoryName]);
  const canCreateProduct = useMemo(() => {
    return (
      !!productCategoryId &&
      productName.trim().length > 0 &&
      productPrice.trim().length > 0 &&
      !Number.isNaN(Number(productPrice))
    );
  }, [productCategoryId, productName, productPrice]);

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreateCategory || categorySaving) return;

    setCategorySaving(true);
    setCategoryError(null);
    setCategorySuccess(null);
    try {
      const category = await createCategory(
        { name: categoryName.trim(), image: categoryImage },
        adminTelegramId,
      );
      setCategoryName("");
      setCategoryImage(null);
      setCategorySuccess("Kategoriya yaratildi");
      onCategoryCreated?.(category);
    } catch (error) {
      console.error(error);
      setCategoryError("Kategoriya yaratishda xatolik yuz berdi");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCreateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreateProduct || productSaving || !productCategoryId) return;

    setProductSaving(true);
    setProductError(null);
    setProductSuccess(null);
    try {
      const product = await createProduct(
        {
          category_id: productCategoryId,
          name: productName.trim(),
          price: Number(productPrice),
          detail: productDetail.trim() || undefined,
          image: productImage,
        },
        adminTelegramId,
      );
      setProductName("");
      setProductPrice("");
      setProductDetail("");
      setProductImage(null);
      setProductSuccess("Mahsulot yaratildi");
      onProductCreated?.(product);
    } catch (error) {
      console.error(error);
      setProductError("Mahsulot yaratishda xatolik yuz berdi");
    } finally {
      setProductSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60">
        <h2 className="text-xl font-bold text-gray-900">Kategoriya qo'shish</h2>
        <p className="mt-1 text-sm text-gray-500">
          SuperApp menyusiga yangi kategoriyalarni shu yerda qo'shing. Rasm tanlash ixtiyoriy.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleCreateCategory}>
          <div>
            <label className="block text-sm font-medium text-gray-600">Kategoriya nomi</label>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Masalan, Taomlar"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Rasm</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setCategoryImage(event.target.files?.[0] ?? null);
              }}
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
            />
          </div>
          {categoryError ? <p className="text-sm text-red-500">{categoryError}</p> : null}
          {categorySuccess ? <p className="text-sm text-emerald-600">{categorySuccess}</p> : null}
          <button
            type="submit"
            disabled={!canCreateCategory || categorySaving}
            className="w-full rounded-xl bg-emerald-500 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {categorySaving ? "Saqlanmoqda..." : "Kategoriya yaratish"}
          </button>
        </form>
      </section>

      <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60">
        <h2 className="text-xl font-bold text-gray-900">Mahsulot qo'shish</h2>
        <p className="mt-1 text-sm text-gray-500">
          Mavjud kategoriyalarga mahsulotlar qo'shing. Narxni so'mda kiriting, rasm va tavsif ixtiyoriy.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleCreateProduct}>
          <div>
            <label className="block text-sm font-medium text-gray-600">Kategoriya</label>
            <select
              value={productCategoryId ?? ""}
              onChange={(event) => setProductCategoryId(Number(event.target.value) || null)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            >
              <option value="" disabled>
                Kategoriya tanlang
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Mahsulot nomi</label>
            <input
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Masalan, Palov"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Narxi (so'm)</label>
            <input
              value={productPrice}
              onChange={(event) => setProductPrice(event.target.value)}
              placeholder="40000"
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Tavsif</label>
            <textarea
              value={productDetail}
              onChange={(event) => setProductDetail(event.target.value)}
              placeholder="Mahsulot haqida qisqa ma'lumot"
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Rasm</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setProductImage(event.target.files?.[0] ?? null);
              }}
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
            />
          </div>
          {productError ? <p className="text-sm text-red-500">{productError}</p> : null}
          {productSuccess ? <p className="text-sm text-emerald-600">{productSuccess}</p> : null}
          <button
            type="submit"
            disabled={!canCreateProduct || productSaving}
            className="w-full rounded-xl bg-emerald-500 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {productSaving ? "Saqlanmoqda..." : "Mahsulot yaratish"}
          </button>
          {!categories.length ? (
            <p className="text-xs text-gray-500">
              Avval kategoriya yarating, shundan so'ng mahsulot qo'shish mumkin bo'ladi.
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
};
