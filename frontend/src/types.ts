export type Language = "uz" | "ru" | "en";

export interface User {
  id: number;
  telegram_id: number;
  name: string;
  phone_number: string;
  language: Language;
}

export interface Category {
  id: number;
  name: string;
  image_path?: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  price: number;
  image_path?: string | null;
  detail?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  comment?: string | null;
  user?: User;
  items: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: Product;
  }>;
}
