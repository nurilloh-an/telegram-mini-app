import axios from "axios";

const baseURL = `${__BACKEND_URL__}/api`;

export const apiClient = axios.create({
  baseURL,
});

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

export const fetchProducts = async (categoryId?: number) => {
  const response = await apiClient.get("/products", {
    params: { category_id: categoryId },
  });
  return response.data;
};

export const createOrder = async (payload: { user_id: number; items: Array<{ product_id: number; quantity: number }>; comment?: string | null }) => {
  const response = await apiClient.post("/orders", payload);
  return response.data;
};
