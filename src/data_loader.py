import pandas as pd


def load_dataset(path="data/customer_churn.csv"):
    """
    Load customer churn dataset.
    """
    return pd.read_csv(path)