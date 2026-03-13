"""
market_basket.py — Phase 2: FP-Growth Market Basket Analysis
Raises custom exceptions from exceptions.py.
"""
import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

from ..core.exceptions import (
    InvalidParameterError, NoFrequentItemsetsError,
    NoRulesFoundError, FPGrowthError, ProductNotFoundError,
    RulesNotComputedError
)

def _build_basket(df: pd.DataFrame, top_n: int = 100) -> pd.DataFrame:
    top_items = (
        df.groupby("Description")["Quantity"]
        .sum().nlargest(top_n).index.tolist()
    )
    sub = df[df["Description"].isin(top_items)]
    basket_sets = (
        sub.groupby("InvoiceNo")["Description"]
        .apply(list).reset_index(drop=True)
    )
    te = TransactionEncoder()
    te_array = te.fit(basket_sets).transform(basket_sets, sparse=True)
    return pd.DataFrame.sparse.from_spmatrix(te_array, columns=te.columns_)


def run_fpgrowth(
    df: pd.DataFrame,
    min_support: float = 0.05,
    min_confidence: float = 0.3,
    min_lift: float = 1.0,
    top_n_items: int = 100,
) -> pd.DataFrame:
    if not (0 < min_support < 1):
        raise InvalidParameterError("min_support", min_support, 0, 1)
    if not (0 < min_confidence <= 1):
        raise InvalidParameterError("min_confidence", min_confidence, 0, 1)
    if min_lift < 1:
        raise InvalidParameterError("min_lift", min_lift, 1, float("inf"))

    basket = _build_basket(df, top_n=top_n_items)

    try:
        freq_items = fpgrowth(basket, min_support=min_support, use_colnames=True)
    except Exception as e:
        raise FPGrowthError(str(e))

    if freq_items.empty:
        raise NoFrequentItemsetsError(min_support)

    rules = association_rules(freq_items, metric="confidence", min_threshold=min_confidence)
    rules = rules[rules["lift"] >= min_lift]

    if rules.empty:
        raise NoRulesFoundError(min_confidence, min_lift)

    rules.sort_values("lift", ascending=False, inplace=True)
    rules.reset_index(drop=True, inplace=True)
    rules["antecedents"] = rules["antecedents"].apply(lambda x: ", ".join(sorted(x)))
    rules["consequents"] = rules["consequents"].apply(lambda x: ", ".join(sorted(x)))
    for col in ["support", "confidence", "lift"]:
        rules[col] = rules[col].round(4)

    return rules[["antecedents", "consequents", "support", "confidence", "lift"]]


def get_recommendations(rules: pd.DataFrame, product: str, top_k: int = 5) -> list:
    if rules is None or rules.empty:
        raise RulesNotComputedError()
    if not product or not product.strip():
        raise InvalidParameterError("Product name cannot be empty.")

    mask = rules["antecedents"].str.contains(product.strip(), case=False, na=False)
    recs = rules[mask].head(top_k)

    if recs.empty:
        raise ProductNotFoundError(product)

    return recs[["consequents", "confidence", "lift"]].to_dict("records")
