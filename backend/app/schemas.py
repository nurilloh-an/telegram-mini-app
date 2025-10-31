from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    telegram_id: int
    name: str
    phone_number: str
    language: str = Field(default="uz")


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str
    image_path: Optional[str] = None


class CategoryRead(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    category_id: int
    name: str
    price: float
    image_path: Optional[str] = None
    detail: Optional[str] = None


class ProductRead(ProductBase):
    id: int

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: ProductRead

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    user_id: int
    items: List[OrderItemCreate]
    comment: Optional[str] = None


class OrderRead(BaseModel):
    id: int
    user: UserRead
    status: str
    total_price: float
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
