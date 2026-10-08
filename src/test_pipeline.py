from data_loader import load_dataset
from preprocessing import clean_data
from feature_engineering import encode_data, split_data

df = load_dataset()

df = clean_data(df)

df = encode_data(df)

X_train, X_test, y_train, y_test = split_data(df)

print("Train:", X_train.shape)
print("Test :", X_test.shape)