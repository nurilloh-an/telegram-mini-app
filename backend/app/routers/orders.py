from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_session
from ..models import Order, OrderItem, Product, User
from ..schemas import OrderCreate, OrderRead, OrderStatusUpdate
from ..utils import ensure_admin

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead)
async def create_order(payload: OrderCreate, session: AsyncSession = Depends(get_session)):
    user = await session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order = Order(user_id=user.id, comment=payload.comment)
    session.add(order)
    total = Decimal("0.00")

    for item in payload.items:
        product = await session.get(Product, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        unit_price = Decimal(product.price)
        item_total = unit_price * item.quantity
        order_item = OrderItem(
            order=order,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=unit_price,
            total_price=item_total,
        )
        session.add(order_item)
        total += item_total

    order.total_price = total
    await session.commit()
    await session.refresh(order)
    await session.refresh(order, attribute_names=["items", "user"])
    for order_item in order.items:
        await session.refresh(order_item, attribute_names=["product"])
    return order


@router.get("", response_model=List[OrderRead])
async def list_orders(
    status: str | None = None,
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    session: AsyncSession = Depends(get_session),
):
    ensure_admin(x_telegram_user_id)

    stmt = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
    )
    if status:
        stmt = stmt.where(Order.status == status)

    result = await session.execute(stmt)
    orders = result.scalars().unique().all()
    return orders


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    session: AsyncSession = Depends(get_session),
):
    ensure_admin(x_telegram_user_id)

    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    await session.commit()
    await session.refresh(order)
    return order


@router.get("/user/{user_id}", response_model=List[OrderRead])
async def get_user_orders(user_id: int, session: AsyncSession = Depends(get_session)):
    stmt = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    result = await session.execute(stmt)
    orders = result.scalars().unique().all()
    return orders
