import pandas as pd


def clean_data(df):
    """
    Clean dataset.
    """

    df["TotalCharges"] = pd.to_numeric(
        df["TotalCharges"],
        errors="coerce"
    )

    df.dropna(inplace=True)

    df.drop("customerID", axis=1, inplace=True)

    return df