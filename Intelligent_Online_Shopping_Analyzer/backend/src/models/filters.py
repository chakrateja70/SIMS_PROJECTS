"""
filters.py — All filtering and search logic for products, customers, and transactions
"""
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from .models import (
    CustomerFilters,
    ProductFilters,
    DateFilters,
    TransactionFilters,
    CombinedFilters,
    CustomerProductAnalysis,
    ProductCustomerAnalysis
)


class DataFilter:
    def __init__(self, df: pd.DataFrame, rfm_df: pd.DataFrame = None):
        """
        Initialize with transaction dataframe and optional RFM dataframe
        """
        self.df = df.copy()
        self.rfm_df = rfm_df.copy() if rfm_df is not None else None
        
    def apply_date_filters(self, filters: DateFilters) -> pd.DataFrame:
        """Apply date range and day-of-week filters"""
        df = self.df.copy()
        
        # Handle quick filters
        if filters.quick_filter:
            today = datetime.now()
            if filters.quick_filter == "last_7_days":
                filters.from_date = (today - timedelta(days=7)).date()
                filters.to_date = today.date()
            elif filters.quick_filter == "last_30_days":
                filters.from_date = (today - timedelta(days=30)).date()
                filters.to_date = today.date()
            elif filters.quick_filter == "last_3_months":
                filters.from_date = (today - timedelta(days=90)).date()
                filters.to_date = today.date()
            elif filters.quick_filter == "last_year":
                filters.from_date = (today - timedelta(days=365)).date()
                filters.to_date = today.date()
        
        # Apply date range
        if filters.from_date:
            df = df[df['InvoiceDate'] >= pd.to_datetime(filters.from_date)]
        if filters.to_date:
            df = df[df['InvoiceDate'] <= pd.to_datetime(filters.to_date)]
        
        # Apply day of week filter
        if filters.day_of_week:
            df['DayOfWeek'] = df['InvoiceDate'].dt.day_name()
            df = df[df['DayOfWeek'].isin(filters.day_of_week)]
            df = df.drop(columns=['DayOfWeek'])
        
        # Apply month filter
        if filters.month:
            df = df[df['InvoiceDate'].dt.month.isin(filters.month)]
        
        return df
    
    def apply_customer_filters(self, filters: CustomerFilters) -> pd.DataFrame:
        """Filter by customer attributes"""
        df = self.df
        
        # Customer ID exact match
        if filters.customer_id:
            df = df[df['CustomerID'].astype(str) == str(filters.customer_id)]
        
        # Country filter
        if filters.country:
            df = df[df['Country'] == filters.country]
        
        # RFM-based filters (requires rfm_df)
        if self.rfm_df is not None:
            filtered_customers = self.rfm_df.copy()
            
            # Segment filter
            if filters.segment and self.rfm_df is not None:
                segment_customers = (
                    self.rfm_df[self.rfm_df['Segment'].isin(filters.segment)]
                    .index
                )
                # Convert both to same type for comparison
                segment_customers = segment_customers.astype(str)
                df_customer_ids = df['CustomerID'].astype(str)
                df = df[df_customer_ids.isin(segment_customers)]
            
            # Recency filter
            if filters.recency_min is not None:
                filtered_customers = filtered_customers[filtered_customers['R_Score'] >= filters.recency_min]
            if filters.recency_max is not None:
                filtered_customers = filtered_customers[filtered_customers['R_Score'] <= filters.recency_max]
            
            # Frequency filter
            if filters.frequency_min is not None:
                filtered_customers = filtered_customers[filtered_customers['F_Score'] >= filters.frequency_min]
            if filters.frequency_max is not None:
                filtered_customers = filtered_customers[filtered_customers['F_Score'] <= filters.frequency_max]
            
            # Monetary filter
            if filters.monetary_min is not None:
                filtered_customers = filtered_customers[filtered_customers['MonetaryValue'] >= filters.monetary_min]
            if filters.monetary_max is not None:
                filtered_customers = filtered_customers[filtered_customers['MonetaryValue'] <= filters.monetary_max]
            
            # Apply other RFM filters only if they were specified (not just segment)
            rfm_filters_applied = any([
                filters.recency_min is not None, filters.recency_max is not None,
                filters.frequency_min is not None, filters.frequency_max is not None,
                filters.monetary_min is not None, filters.monetary_max is not None
            ])
            
            if rfm_filters_applied:
                rfm_customer_ids = filtered_customers.index.astype(str)
                df_customer_ids = df['CustomerID'].astype(str)
                df = df[df_customer_ids.isin(rfm_customer_ids)]
        
        return df
    
    def apply_product_filters(self, filters: ProductFilters) -> pd.DataFrame:
        """Filter by product attributes"""
        df = self.df.copy()
        
        # Product name search (partial match)
        if filters.product_name:
            df = df[df['Description'].str.contains(filters.product_name, case=False, na=False)]
        
        # Stock code exact match
        if filters.stock_code:
            df = df[df['StockCode'] == filters.stock_code]
        
        # Price filter (using UnitPrice)
        if filters.price_min is not None:
            df = df[df['UnitPrice'] >= filters.price_min]
        if filters.price_max is not None:
            df = df[df['UnitPrice'] <= filters.price_max]
        
        return df
    
    def apply_transaction_filters(self, filters: TransactionFilters) -> pd.DataFrame:
        """Filter by transaction attributes"""
        df = self.df.copy()
        
        # Invoice number
        if filters.invoice_number:
            df = df[df['InvoiceNo'] == filters.invoice_number]
        
        # Transaction amount filter
        if 'TotalAmount' not in df.columns:
            df['TotalAmount'] = df['Quantity'] * df['UnitPrice']
        
        if filters.min_amount is not None:
            df = df[df['TotalAmount'] >= filters.min_amount]
        if filters.max_amount is not None:
            df = df[df['TotalAmount'] <= filters.max_amount]
        
        # Quantity filter
        if filters.min_quantity is not None:
            df = df[df['Quantity'] >= filters.min_quantity]
        if filters.max_quantity is not None:
            df = df[df['Quantity'] <= filters.max_quantity]
        
        return df
    
    def apply_combined_filters(self, filters: CombinedFilters) -> pd.DataFrame:
        """Apply all filters in sequence"""
        df = self.df.copy()
        
        if filters.date_filters:
            temp_filter = DataFilter(df, self.rfm_df)
            df = temp_filter.apply_date_filters(filters.date_filters)
        
        if filters.customer_filters:
            temp_filter = DataFilter(df, self.rfm_df)
            df = temp_filter.apply_customer_filters(filters.customer_filters)
        
        if filters.product_filters:
            temp_filter = DataFilter(df, self.rfm_df)
            df = temp_filter.apply_product_filters(filters.product_filters)
        
        if filters.transaction_filters:
            temp_filter = DataFilter(df, self.rfm_df)
            df = temp_filter.apply_transaction_filters(filters.transaction_filters)
        
        return df
    
    def get_top_products(self, limit: int = 10, sort_by: str = "quantity", order: str = "desc") -> List[Dict[str, Any]]:
        """Get most bought products globally with configurable sorting."""
        df = self.df.copy()

        if df.empty:
            return []

        # Compute canonical metrics used by all ranking modes.
        product_stats = df.groupby(["StockCode", "Description"]).agg({
            "Quantity": "sum",
            "UnitPrice": "mean",
            "InvoiceNo": "nunique",
            "CustomerID": "nunique",
        }).reset_index()

        product_stats["Revenue"] = product_stats["Quantity"] * product_stats["UnitPrice"]

        # Support both styles:
        # 1) sort_by="quantity_desc" (combined value from UI)
        # 2) sort_by="quantity", order="desc"
        sort_field = sort_by
        sort_order = order
        if "_" in str(sort_by):
            parts = str(sort_by).rsplit("_", 1)
            if len(parts) == 2 and parts[1] in {"asc", "desc"}:
                sort_field, sort_order = parts[0], parts[1]

        field_map = {
            "quantity":  "Quantity",
            "revenue":   "Revenue",
            "price":     "UnitPrice",
            "orders":    "InvoiceNo",
            "customers": "CustomerID",
            # UI-friendly aliases
            "frequency": "InvoiceNo",     # "Orders" in dropdown
            "name":      "Description",   # Product Name
            "stock":     "StockCode",     # Stock Code
        }
        sort_column = field_map.get(str(sort_field).lower(), "Quantity")
        ascending = str(sort_order).lower() == "asc"

        product_stats = product_stats.sort_values(sort_column, ascending=ascending).head(limit)

        return product_stats.rename(columns={
            "StockCode": "stock_code",
            "Description": "product_name",
            "Quantity": "total_quantity",
            "UnitPrice": "avg_price",
            "InvoiceNo": "times_ordered",
            "CustomerID": "unique_customers",
            "Revenue": "total_revenue",
        }).to_dict("records")

    def get_least_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get least bought products globally."""
        return self.get_top_products(limit=limit, sort_by="quantity", order="asc")

    def get_customer_top_products(self, analysis: CustomerProductAnalysis) -> Dict[str, Any]:
        """Get products a specific customer buys most/least"""
        df = self.df[self.df['CustomerID'].astype(str) == str(analysis.customer_id)].copy()
        
        if df.empty:
            return {"error": "Customer not found"}
        
        # Apply date filters if provided
        if analysis.date_from:
            df = df[df['InvoiceDate'] >= pd.to_datetime(analysis.date_from)]
        if analysis.date_to:
            df = df[df['InvoiceDate'] <= pd.to_datetime(analysis.date_to)]
        
        # Get customer segment info
        customer_info = {}
        if self.rfm_df is not None and int(analysis.customer_id) in self.rfm_df.index:
            rfm_row = self.rfm_df.loc[int(analysis.customer_id)]
            customer_info = {
                "segment": rfm_row['Segment'],
                "recency_score": int(rfm_row['R_Score']),
                "frequency_score": int(rfm_row['F_Score']),
                "monetary_value": float(rfm_row['MonetaryValue'])
            }
        
        # Group by product
        product_stats = df.groupby(['StockCode', 'Description']).agg({
            'Quantity': 'sum',
            'UnitPrice': 'mean',
            'InvoiceNo': 'nunique'
        }).reset_index()
        
        product_stats['TotalSpent'] = product_stats['Quantity'] * product_stats['UnitPrice']
        
        # Sort based on analysis type
        if analysis.analysis_type == "least_products":
            product_stats = product_stats.sort_values('Quantity', ascending=True)
        else:  # top_products or all_products
            product_stats = product_stats.sort_values('Quantity', ascending=False)
        
        # Limit results
        if analysis.analysis_type != "all_products":
            product_stats = product_stats.head(analysis.limit)
        
        products = product_stats.rename(columns={
            'StockCode': 'stock_code',
            'Description': 'product_name',
            'Quantity': 'total_quantity',
            'UnitPrice': 'avg_price',
            'InvoiceNo': 'times_ordered',
            'TotalSpent': 'total_spent'
        }).to_dict('records')
        
        return {
            "customer_id": analysis.customer_id,
            "customer_info": customer_info,
            "products": products,
            "total_products": len(product_stats)
        }
    
    def get_product_top_customers(self, analysis: ProductCustomerAnalysis) -> Dict[str, Any]:
        """Get customers who buy a specific product most"""
        df = self.df.copy()
        
        # Filter by product
        if analysis.product_name:
            df = df[df['Description'].str.contains(analysis.product_name, case=False, na=False)]
        elif analysis.stock_code:
            df = df[df['StockCode'] == analysis.stock_code]
        else:
            return {"error": "Must provide product_name or stock_code"}
        
        if df.empty:
            return {"error": "Product not found"}
        
        # Get product info
        product_info = {
            "stock_code": df['StockCode'].iloc[0],
            "product_name": df['Description'].iloc[0],
            "total_quantity_sold": int(df['Quantity'].sum()),
            "total_revenue": float((df['Quantity'] * df['UnitPrice']).sum())
        }
        
        # Group by customer
        customer_stats = df.groupby('CustomerID').agg({
            'Quantity': 'sum',
            'UnitPrice': 'mean',
            'InvoiceNo': 'nunique'
        }).reset_index()
        
        customer_stats['TotalSpent'] = customer_stats['Quantity'] * customer_stats['UnitPrice']
        customer_stats = customer_stats.sort_values('Quantity', ascending=False).head(analysis.limit)
        
        # Add segment info if available
        if self.rfm_df is not None:
            customer_stats = customer_stats.merge(
                self.rfm_df[['Segment']],
                left_on='CustomerID',
                right_index=True,
                how='left'
            )
        
        customers = customer_stats.rename(columns={
            'CustomerID': 'customer_id',
            'Quantity': 'total_quantity',
            'UnitPrice': 'avg_price',
            'InvoiceNo': 'times_bought',
            'TotalSpent': 'total_spent',
            'Segment': 'segment'
        }).to_dict('records')
        
        return {
            "product_info": product_info,
            "top_customers": customers
        }
    
    def get_segment_top_products(self, segment: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get products that a specific segment buys most"""
        if self.rfm_df is None:
            return []
        
        # Get customers in this segment
        segment_customers = self.rfm_df[self.rfm_df['Segment'] == segment].index.tolist()
        
        # Filter transactions
        df = self.df[self.df['CustomerID'].isin(segment_customers)].copy()
        
        if df.empty:
            return []
        
        # Group by product
        product_stats = df.groupby(['StockCode', 'Description']).agg({
            'Quantity': 'sum',
            'UnitPrice': 'mean',
            'InvoiceNo': 'nunique',
            'CustomerID': 'nunique'  # How many different customers bought it
        }).reset_index()
        
        product_stats['Revenue'] = product_stats['Quantity'] * product_stats['UnitPrice']
        product_stats = product_stats.sort_values('Quantity', ascending=False).head(limit)
        
        return product_stats.rename(columns={
            'StockCode': 'stock_code',
            'Description': 'product_name',
            'Quantity': 'total_quantity',
            'UnitPrice': 'avg_price',
            'InvoiceNo': 'times_ordered',
            'CustomerID': 'unique_customers',
            'Revenue': 'total_revenue'
        }).to_dict('records')
    
    def get_autocomplete_suggestions(self, query: str, field: str, limit: int = 10) -> List[str]:
        """Get autocomplete suggestions for search"""
        if field == "product":
            matches = self.df['Description'].dropna().unique()
            matches = [p for p in matches if query.lower() in str(p).lower()]
            return sorted(matches)[:limit]
        elif field == "customer":
            matches = self.df['CustomerID'].dropna().astype(str).unique()
            matches = [c for c in matches if query in c]
            return sorted(matches)[:limit]
        elif field == "country":
            matches = self.df['Country'].dropna().unique()
            matches = [c for c in matches if query.lower() in c.lower()]
            return sorted(matches)[:limit]
        return []
