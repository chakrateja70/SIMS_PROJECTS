
import os
import pandas as pd

from ..core.exceptions import (
    CSVNotFoundError, MissingColumnsError, EncodingError,
    ParseError, AllRowsRemovedError, EmptyFileError
)

REQUIRED_COLUMNS = {
    "InvoiceNo", "StockCode", "Description",
    "Quantity", "InvoiceDate", "UnitPrice",
    "CustomerID", "Country",
}

DTYPE_MAP = {
    "InvoiceNo":   "category",
    "StockCode":   "category",
    "Description": "object",
    "Quantity":    "int32",
    "UnitPrice":   "float32",
    "CustomerID":  "float32",
    "Country":     "category",
}


def load_raw(filepath: str, encoding: str = "ISO-8859-1") -> pd.DataFrame:
    if not os.path.exists(filepath):
        raise CSVNotFoundError(filepath)
    try:
        chunks = list(pd.read_csv(
            filepath, dtype=DTYPE_MAP, parse_dates=["InvoiceDate"],
            encoding=encoding, chunksize=50_000, on_bad_lines="skip",
        ))
    except UnicodeDecodeError as e:
        raise EncodingError(encoding, str(e))
    except pd.errors.ParserError as e:
        raise ParseError(str(e))

    if not chunks:
        raise EmptyFileError("File produced zero chunks — it may be empty or unreadable.")

    df = pd.concat(chunks, ignore_index=True)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise MissingColumnsError(list(missing), list(df.columns))

    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    original_count = len(df)
    df = df.copy()
    df.dropna(subset=["CustomerID", "Description"], inplace=True)
    df["Description"] = df["Description"].str.strip()
    df = df[df["Description"] != ""]
    df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]
    df = df[df["Quantity"] > 0]
    df = df[df["UnitPrice"] > 0]
    df["CustomerID"] = df["CustomerID"].astype("int32")
    df["TotalPrice"] = (df["Quantity"] * df["UnitPrice"]).astype("float32")
    df.reset_index(drop=True, inplace=True)

    if df.empty:
        raise AllRowsRemovedError(original_count)

    return df


def get_summary(df: pd.DataFrame) -> dict:
    return {
        "total_rows":       int(len(df)),
        "unique_invoices":  int(df["InvoiceNo"].nunique()),
        "unique_customers": int(df["CustomerID"].nunique()),
        "unique_products":  int(df["StockCode"].nunique()),
        "date_from":        str(df["InvoiceDate"].min().date()),
        "date_to":          str(df["InvoiceDate"].max().date()),
        "total_revenue":    round(float(df["TotalPrice"].sum()), 2),
        "countries":        int(df["Country"].nunique()),
    }


def load_and_clean(filepath: str, encoding: str = "ISO-8859-1") -> pd.DataFrame:
    return clean(load_raw(filepath, encoding))
