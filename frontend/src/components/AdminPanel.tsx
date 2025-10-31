import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateCategory,
  updateProduct,
} from "../api/client";
import type { Category, Product } from "../types";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB, resolveMediaUrl } from "../utils/media";

interface Props {
  categories: Category[];
  products: Product[];
  adminTelegramId?: number | null;
  adminPhoneNumber?: string | null;
  onCategoryCreated?: (category: Category) => void;
  onCategoryUpdated?: (category: Category) => void;
  onCategoryDeleted?: (categoryId: number) => void;
  onProductCreated?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
  onProductDeleted?: (productId: number) => void;
}

export const AdminPanel: React.FC<Props> = ({
  categories,
  products,
  adminTelegramId,
  adminPhoneNumber,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
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

  const [categoryListError, setCategoryListError] = useState<string | null>(null);
  const [categoryListSuccess, setCategoryListSuccess] = useState<string | null>(null);
  const [categoryListSaving, setCategoryListSaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryImage, setEditingCategoryImage] = useState<File | null>(null);

  const [productListError, setProductListError] = useState<string | null>(null);
  const [productListSuccess, setProductListSuccess] = useState<string | null>(null);
  const [productListSaving, setProductListSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductCategoryId, setEditingProductCategoryId] = useState<number | null>(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [editingProductPrice, setEditingProductPrice] = useState("");
  const [editingProductDetail, setEditingProductDetail] = useState("");
  const [editingProductImage, setEditingProductImage] = useState<File | null>(null);

  const formattedLimit = Number.isInteger(MAX_UPLOAD_SIZE_MB)
    ? MAX_UPLOAD_SIZE_MB.toString()
    : MAX_UPLOAD_SIZE_MB.toFixed(1);
  const fileLimitMessage = `Fayl hajmi ${formattedLimit} MB dan oshmasligi kerak`;

  const handleCategoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
      setCategoryImage(null);
      setCategoryError(fileLimitMessage);
      event.target.value = "";
      return;
    }
    setCategoryError((prev) => (prev === fileLimitMessage ? null : prev));
    setCategoryImage(file);
  };

  const handleProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
      setProductImage(null);
      setProductError(fileLimitMessage);
      event.target.value = "";
      return;
    }
    setProductError((prev) => (prev === fileLimitMessage ? null : prev));
    setProductImage(file);
  };

  const handleEditingCategoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
      setEditingCategoryImage(null);
      setCategoryListError(fileLimitMessage);
      event.target.value = "";
      return;
    }
    setCategoryListError((prev) => (prev === fileLimitMessage ? null : prev));
    setEditingCategoryImage(file);
  };

  const handleEditingProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
      setEditingProductImage(null);
      setProductListError(fileLimitMessage);
      event.target.value = "";
      return;
    }
    setProductListError((prev) => (prev === fileLimitMessage ? null : prev));
    setEditingProductImage(file);
  };

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

  const categoryLookup = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((category) => {
      map.set(category.id, category);
    });
    return map;
  }, [categories]);

  const priceFormatter = useMemo(() => new Intl.NumberFormat("ru-RU"), []);

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
        adminPhoneNumber,
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
        adminPhoneNumber,
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

  const resetCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCategoryImage(null);
  };

  const beginCategoryEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryImage(null);
    setCategoryListError(null);
    setCategoryListSuccess(null);
  };

  const handleCategoryUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingCategoryId) return;

    const nextName = editingCategoryName.trim();
    if (!nextName) {
      setCategoryListError("Kategoriya nomi kiritilishi kerak");
      return;
    }

    setCategoryListSaving(true);
    setCategoryListError(null);
    setCategoryListSuccess(null);
    try {
      const updated = await updateCategory(
        editingCategoryId,
        { name: nextName, image: editingCategoryImage ?? undefined },
        adminTelegramId,
        adminPhoneNumber,
      );
      setCategoryListSuccess("Kategoriya yangilandi");
      onCategoryUpdated?.(updated);
      resetCategoryEdit();
    } catch (error) {
      console.error(error);
      setCategoryListError("Kategoriya yangilanishida xatolik yuz berdi");
    } finally {
      setCategoryListSaving(false);
    }
  };

  const handleCategoryDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `"${category.name}" kategoriyasini o'chirishni istaysizmi?`,
    );
    if (!confirmed) {
      return;
    }

    setCategoryListSaving(true);
    setCategoryListError(null);
    setCategoryListSuccess(null);
    try {
      await deleteCategory(category.id, adminTelegramId, adminPhoneNumber);
      setCategoryListSuccess("Kategoriya o'chirildi");
      onCategoryDeleted?.(category.id);
      if (editingCategoryId === category.id) {
        resetCategoryEdit();
      }
    } catch (error) {
      console.error(error);
      setCategoryListError("Kategoriya o'chirishda xatolik yuz berdi");
    } finally {
      setCategoryListSaving(false);
    }
  };

  const resetProductEdit = () => {
    setEditingProductId(null);
    setEditingProductCategoryId(null);
    setEditingProductName("");
    setEditingProductPrice("");
    setEditingProductDetail("");
    setEditingProductImage(null);
  };

  const beginProductEdit = (product: Product) => {
    setEditingProductId(product.id);
    setEditingProductCategoryId(product.category_id);
    setEditingProductName(product.name);
    setEditingProductPrice(String(product.price));
    setEditingProductDetail(product.detail ?? "");
    setEditingProductImage(null);
    setProductListError(null);
    setProductListSuccess(null);
  };

  const handleProductUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProductId || !editingProductCategoryId) return;

    const nextName = editingProductName.trim();
    if (!nextName) {
      setProductListError("Mahsulot nomi kiritilishi kerak");
      return;
    }

    const parsedPrice = Number(editingProductPrice);
    if (Number.isNaN(parsedPrice)) {
      setProductListError("Narx noto'g'ri kiritilgan");
      return;
    }

    setProductListSaving(true);
    setProductListError(null);
    setProductListSuccess(null);
    try {
      const updated = await updateProduct(
        editingProductId,
        {
          category_id: editingProductCategoryId,
          name: nextName,
          price: parsedPrice,
          detail: editingProductDetail.trim() || undefined,
          image: editingProductImage ?? undefined,
        },
        adminTelegramId,
        adminPhoneNumber,
      );
      setProductListSuccess("Mahsulot yangilandi");
      onProductUpdated?.(updated);
      resetProductEdit();
    } catch (error) {
      console.error(error);
      setProductListError("Mahsulot yangilanishida xatolik yuz berdi");
    } finally {
      setProductListSaving(false);
    }
  };

  const handleProductDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `"${product.name}" mahsulotini o'chirishni istaysizmi?`,
    );
    if (!confirmed) {
      return;
    }

    setProductListSaving(true);
    setProductListError(null);
    setProductListSuccess(null);
    try {
      await deleteProduct(product.id, adminTelegramId, adminPhoneNumber);
      setProductListSuccess("Mahsulot o'chirildi");
      onProductDeleted?.(product.id);
      if (editingProductId === product.id) {
        resetProductEdit();
      }
    } catch (error) {
      console.error(error);
      setProductListError("Mahsulot o'chirishda xatolik yuz berdi");
    } finally {
      setProductListSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60">
        <h2 className="text-xl font-bold text-gray-900">Kategoriya qo'shish</h2>
        <p className="mt-1 text-sm text-gray-500">
          Siz Market menyusiga yangi kategoriyalarni shu yerda qo'shing. Rasm tanlash ixtiyoriy.
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
              onChange={handleCategoryImageChange}
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">Maksimal fayl hajmi {formattedLimit} MB.</p>
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
              onChange={handleProductImageChange}
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">Maksimal fayl hajmi {formattedLimit} MB.</p>
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

      <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Mavjud kategoriyalar</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            {categories.length} ta
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Kategoriyalar ro'yxatidan keraklisini tahrirlang yoki o'chiring. O'zgarishlar barcha mijozlar uchun darhol qo'llanadi.
        </p>
        {categoryListError ? (
          <p className="mt-4 text-sm text-red-500">{categoryListError}</p>
        ) : null}
        {categoryListSuccess ? (
          <p className="mt-4 text-sm text-emerald-600">{categoryListSuccess}</p>
        ) : null}
        {categories.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700">
            Hozircha kategoriya yaratilmagan. Yuqoridagi forma orqali yangi kategoriya qo'shing.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {categories.map((category) => {
              const isEditing = editingCategoryId === category.id;
              const imageUrl = resolveMediaUrl(category.image_path);
              return (
                <div
                  key={category.id}
                  className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-inner shadow-emerald-100/40"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={category.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl text-emerald-500">
                          📂
                        </div>
                      )}
                      <div>
                        <p className="text-base font-semibold text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">ID: {category.id}</p>
                      </div>
                    </div>
                    {!isEditing ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => beginCategoryEdit(category)}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow"
                        >
                          Tahrirlash
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCategoryDelete(category)}
                          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-600"
                          disabled={categoryListSaving}
                        >
                          O'chirish
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {isEditing ? (
                    <form className="mt-4 space-y-3" onSubmit={handleCategoryUpdate}>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Kategoriya nomi</label>
                        <input
                          value={editingCategoryName}
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Yangi rasm (ixtiyoriy)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditingCategoryImageChange}
                          className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">Maksimal fayl hajmi {formattedLimit} MB.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={categoryListSaving}
                          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          Saqlash
                        </button>
                        <button
                          type="button"
                          onClick={resetCategoryEdit}
                          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-600 shadow"
                          disabled={categoryListSaving}
                        >
                          Bekor qilish
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-emerald-100/60 ring-1 ring-white/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Mahsulotlarni boshqarish</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            {products.length} ta
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Mahsulotlar ro'yxatini ko'rib chiqing, narx yoki tavsifni yangilang, kerak bo'lsa o'chiring.
        </p>
        {productListError ? (
          <p className="mt-4 text-sm text-red-500">{productListError}</p>
        ) : null}
        {productListSuccess ? (
          <p className="mt-4 text-sm text-emerald-600">{productListSuccess}</p>
        ) : null}
        {products.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700">
            Hozircha mahsulotlar mavjud emas. Avval kategoriya tanlab mahsulot qo'shing.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {products.map((product) => {
              const isEditing = editingProductId === product.id;
              const categoryName = categoryLookup.get(product.category_id)?.name ?? "Noma'lum kategoriya";
              const productImageUrl = resolveMediaUrl(product.image_path);
              return (
                <div
                  key={product.id}
                  className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-inner shadow-emerald-100/40"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                      {productImageUrl ? (
                        <img
                          src={productImageUrl}
                          alt={product.name}
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-500">
                          🛒
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">ID: {product.id}</p>
                        <p className="text-xs text-gray-500">Kategoriya: {categoryName}</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {priceFormatter.format(product.price)} so'm
                        </p>
                        {product.detail ? (
                          <p className="text-xs text-gray-500">{product.detail}</p>
                        ) : null}
                      </div>
                    </div>
                    {!isEditing ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => beginProductEdit(product)}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow"
                        >
                          Tahrirlash
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProductDelete(product)}
                          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-600"
                          disabled={productListSaving}
                        >
                          O'chirish
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {isEditing ? (
                    <form className="mt-4 space-y-3" onSubmit={handleProductUpdate}>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Kategoriya</label>
                        <select
                          value={editingProductCategoryId ?? ""}
                          onChange={(event) =>
                            setEditingProductCategoryId(Number(event.target.value) || null)
                          }
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
                          value={editingProductName}
                          onChange={(event) => setEditingProductName(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Narx (so'm)</label>
                        <input
                          value={editingProductPrice}
                          onChange={(event) => setEditingProductPrice(event.target.value)}
                          inputMode="numeric"
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Tavsif</label>
                        <textarea
                          value={editingProductDetail}
                          onChange={(event) => setEditingProductDetail(event.target.value)}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Yangi rasm (ixtiyoriy)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditingProductImageChange}
                          className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">Maksimal fayl hajmi {formattedLimit} MB.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={productListSaving}
                          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          Saqlash
                        </button>
                        <button
                          type="button"
                          onClick={resetProductEdit}
                          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-600 shadow"
                          disabled={productListSaving}
                        >
                          Bekor qilish
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
