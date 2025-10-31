import axios from "axios";
import type { Category, Order, Product } from "../types";

const normalizedBackendUrl = __BACKEND_URL__.replace(/\/+$/, "");
const normalizedPrefix = (__BACKEND_API_PREFIX__ || "").trim();
const sanitizedPrefix = normalizedPrefix
  ? `/${normalizedPrefix.replace(/^\/+/, "").replace(/\/+$/, "")}`
  : "";
const effectivePrefix = sanitizedPrefix === "/" ? "" : sanitizedPrefix;

const baseURL = `${normalizedBackendUrl}${effectivePrefix}` || normalizedBackendUrl;

export const apiClient = axios.create({
  baseURL,
});

const buildAdminHeaders = (
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const headers: Record<string, string> = {};
  if (typeof adminTelegramId === "number" && !Number.isNaN(adminTelegramId)) {
    headers["X-Telegram-User-Id"] = adminTelegramId.toString();
  }
  if (adminPhoneNumber) {
    headers["X-Admin-Phone-Number"] = adminPhoneNumber;
  }
  return headers;
};

export interface UserPayload {
  telegram_id: number;
  name: string;
  phone_number: string;
  language: string;
}

export const upsertUser = async (payload: UserPayload) => {
  const response = await apiClient.post("/users", payload);
  return response.data;
};

export const fetchCategories = async () => {
  const response = await apiClient.get("/categories");
  return response.data;
};

export const createCategory = async (
  payload: { name: string; image?: File | null },
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const headers = buildAdminHeaders(adminTelegramId, adminPhoneNumber);
  const response = await apiClient.post<Category>("/categories", formData, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
  return response.data;
};

export const fetchProducts = async (categoryId?: number) => {
  const response = await apiClient.get("/products", {
    params: { category_id: categoryId },
  });
  return response.data;
};

export const createProduct = async (
  payload: {
    category_id: number;
    name: string;
    price: number;
    detail?: string | null;
    image?: File | null;
  },
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const formData = new FormData();
  formData.append("category_id", String(payload.category_id));
  formData.append("name", payload.name);
  formData.append("price", String(payload.price));
  if (payload.detail) {
    formData.append("detail", payload.detail);
  }
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const headers = buildAdminHeaders(adminTelegramId, adminPhoneNumber);
  const response = await apiClient.post<Product>("/products", formData, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
  return response.data;
};

export const updateCategory = async (
  categoryId: number,
  payload: { name: string; image?: File | null },
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const headers = buildAdminHeaders(adminTelegramId, adminPhoneNumber);
  const response = await apiClient.put<Category>(`/categories/${categoryId}`, formData, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
  return response.data;
};

export const deleteCategory = async (
  categoryId: number,
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const headers = buildAdminHeaders(adminTelegramId, adminPhoneNumber);
  await apiClient.delete(`/categories/${categoryId}`, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
};

export const updateProduct = async (
  productId: number,
  payload: {
    category_id: number;
    name: string;
    price: number;
    detail?: string | null;
    image?: File | null;
  },
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const formData = new FormData();
  formData.append("category_id", String(payload.category_id));
  formData.append("name", payload.name);
  formData.append("price", String(payload.price));
  if (payload.detail) {
    formData.append("detail", payload.detail);
  }
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const headers = buildAdminHeaders(adminTelegramId, adminPhoneNumber);
  const response = await apiClient.put<Product>(`/products/${productId}`, formData, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
  return response.data;
};

export const deleteProduct = async (
  productId: number,
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const headers = buildAdminHeaders(adminTelegramId, adminPhoneNumber);
  await apiClient.delete(`/products/${productId}`, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
};

export const createOrder = async (payload: {
  user_id: number;
  items: Array<{ product_id: number; quantity: number }>;
  comment?: string | null;
}) => {
  const response = await apiClient.post<Order>("/orders", payload);
  return response.data;
};

export const fetchUserOrders = async (userId: number) => {
  const response = await apiClient.get<Order[]>(`/orders/user/${userId}`);
  return response.data;
};

export const fetchAllOrders = async (
  adminTelegramId?: number | null,
  adminPhoneNumber?: string | null,
) => {
  const headers = buildAdminHeaders(adminTelegramId ?? undefined, adminPhoneNumber ?? undefined);
  const response = await apiClient.get<Order[]>("/orders", {
    headers: Object.keys(headers).length ? headers : undefined,
  });
  return response.data;
};
