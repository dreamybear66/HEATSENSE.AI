import pandas as pd
import os

def get_all_wards():
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'bengaluru_wards_data.csv')
    df = pd.read_csv(csv_path)
    return df.to_dict(orient='records')
