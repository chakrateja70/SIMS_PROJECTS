"""
models.py — Pydantic models for filter requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class CustomerFilters(BaseModel):
    customer_id: Optional[str] = None
    segment: Optional[List[str]] = None  # ["Champions", "Loyal", etc.]
    recency_min: Optional[int] = Field(None, ge=1, le=5)
    recency_max: Optional[int] = Field(None, ge=1, le=5)
    frequency_min: Optional[int] = Field(None, ge=1, le=5)
    frequency_max: Optional[int] = Field(None, ge=1, le=5)
    monetary_min: Optional[float] = None
    monetary_max: Optional[float] = None
    country: Optional[str] = None


class ProductFilters(BaseModel):
    product_name: Optional[str] = None
    stock_code: Optional[str] = None
    category: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    sort_by: Optional[str] = "quantity_desc"  # quantity_desc, quantity_asc, revenue_desc, revenue_asc, etc.
    order: Optional[str] = "desc"  # asc, desc
    limit: Optional[int] = Field(10, ge=1, le=1000)


class DateFilters(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    day_of_week: Optional[List[str]] = None  # ["Monday", "Friday"]
    month: Optional[List[int]] = None  # [1, 2, 12]
    quick_filter: Optional[str] = None  # "last_7_days", "last_30_days", "last_3_months"


class TransactionFilters(BaseModel):
    invoice_number: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    min_quantity: Optional[int] = None
    max_quantity: Optional[int] = None


class CombinedFilters(BaseModel):
    customer_filters: Optional[CustomerFilters] = None
    product_filters: Optional[ProductFilters] = None
    date_filters: Optional[DateFilters] = None
    transaction_filters: Optional[TransactionFilters] = None


class CustomerProductAnalysis(BaseModel):
    customer_id: str
    analysis_type: str = "top_products"  # top_products, least_products, all_products
    limit: int = Field(10, ge=1, le=100)
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class ProductCustomerAnalysis(BaseModel):
    product_name: Optional[str] = None
    stock_code: Optional[str] = None
    analysis_type: str = "top_customers"  # top_customers, segment_breakdown
    limit: int = Field(10, ge=1, le=100)