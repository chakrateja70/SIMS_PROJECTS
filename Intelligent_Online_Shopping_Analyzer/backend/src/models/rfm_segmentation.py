"""
rfm_segmentation.py — Phase 3: RFM + K-Means Customer Segmentation
Raises custom exceptions from exceptions.py.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

from ..core.exceptions import (
    InvalidParameterError, InsufficientCustomersError, ClusteringError
)

SEGMENT_LABELS = ["Champions", "Loyal Customers", "At-Risk", "Lost Customers", "Potential Loyalists"]
SEGMENT_COLORS = {
    "Champions":           "#16a34a",
    "Loyal Customers":     "#4f46e5",
    "At-Risk":             "#d97706",
    "Lost Customers":      "#dc2626",
    "Potential Loyalists": "#7c3aed",
}


def compute_rfm(df: pd.DataFrame) -> pd.DataFrame:
    snapshot = df["InvoiceDate"].max() + pd.Timedelta(days=1)
    rfm = (
        df.groupby("CustomerID")
        .agg(
            Recency  =("InvoiceDate", lambda x: (snapshot - x.max()).days),
            Frequency=("InvoiceNo",   "nunique"),
            Monetary =("TotalPrice",  "sum"),
        )
        .reset_index()
    )
    rfm["Monetary"] = rfm["Monetary"].round(2)
    return rfm


def segment_customers(df: pd.DataFrame, n_clusters: int = 5) -> pd.DataFrame:
    if not isinstance(n_clusters, int) or not (2 <= n_clusters <= 10):
        raise InvalidParameterError("n_clusters", n_clusters, "integer between 2 and 10")

    rfm = compute_rfm(df)

    if len(rfm) < n_clusters:
        raise InsufficientCustomersError(len(rfm), n_clusters)

    features = rfm[["Recency", "Frequency", "Monetary"]].copy()
    features["Recency"]   = np.log1p(features["Recency"])
    features["Frequency"] = np.log1p(features["Frequency"])
    features["Monetary"]  = np.log1p(features["Monetary"])

    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    try:
        km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        rfm["Cluster"] = km.fit_predict(scaled)
    except Exception as e:
        raise ClusteringError(str(e))

    centroids = rfm.groupby("Cluster")[["Recency", "Frequency", "Monetary"]].mean()
    max_r = centroids["Recency"].max() or 1
    max_f = centroids["Frequency"].max() or 1
    max_m = centroids["Monetary"].max() or 1
    centroids["score"] = (
        -centroids["Recency"]   / max_r
        +centroids["Frequency"] / max_f
        +centroids["Monetary"]  / max_m
    )
    rank_map = centroids["score"].rank(ascending=False).astype(int) - 1
    labels   = SEGMENT_LABELS[:n_clusters]
    label_map = {cid: labels[min(r, len(labels)-1)] for cid, r in rank_map.items()}
    rfm["Segment"] = rfm["Cluster"].map(label_map)
    return rfm


def segment_summary(rfm: pd.DataFrame) -> pd.DataFrame:
    summary = (
        rfm.groupby("Segment")
        .agg(
            Customers    =("CustomerID", "count"),
            Avg_Recency  =("Recency",    "mean"),
            Avg_Frequency=("Frequency",  "mean"),
            Avg_Monetary =("Monetary",   "mean"),
            Total_Revenue=("Monetary",   "sum"),
        )
        .round(2)
        .reset_index()
    )
    summary["Color"] = summary["Segment"].map(SEGMENT_COLORS)
    return summary
