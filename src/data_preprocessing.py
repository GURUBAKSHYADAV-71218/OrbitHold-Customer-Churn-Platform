import pandas as pd


def load_data(file_path):
    """
    Load the customer churn dataset.
    """
    df = pd.read_csv(file_path)
    return df


def display_basic_info(df):
    """
    Display basic information about the dataset.
    """
    print("=" * 60)
    print("Dataset Shape")
    print("=" * 60)
    print(df.shape)

    print("\n" + "=" * 60)
    print("First 5 Rows")
    print("=" * 60)
    print(df.head())

    print("\n" + "=" * 60)
    print("Column Information")
    print("=" * 60)
    print(df.info())

    print("\n" + "=" * 60)
    print("Missing Values")
    print("=" * 60)
    print(df.isnull().sum())

    print("\n" + "=" * 60)
    print("Duplicate Rows")
    print("=" * 60)
    print(df.duplicated().sum())

    print("\n" + "=" * 60)
    print("Statistical Summary")
    print("=" * 60)
    print(df.describe(include="all"))


def clean_data(df):
    """
    Clean the dataset.
    """

    # Convert TotalCharges to numeric
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    # Check missing values
    print("\nMissing Values After Conversion:")
    print(df.isnull().sum())

    # Remove rows with missing TotalCharges
    df.dropna(inplace=True)

    # Remove Customer ID
    df.drop("customerID", axis=1, inplace=True)

    return df


def main():
    file_path = "data/customer_churn.csv"

    df = load_data(file_path)

    # Step 3: Updated part here
    display_basic_info(df)
    df = clean_data(df)
    print("\nDataset Shape After Cleaning:")
    print(df.shape)


if __name__ == "__main__":
    main()