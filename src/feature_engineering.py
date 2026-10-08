from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split


def encode_data(df):

    encoder = LabelEncoder()

    for column in df.select_dtypes(include="object").columns:
        df[column] = encoder.fit_transform(df[column])

    return df


def split_data(df):

    X = df.drop("Churn", axis=1)

    y = df["Churn"]

    return train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )