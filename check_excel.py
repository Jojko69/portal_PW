import pandas as pd
import json

df = pd.read_excel(r"F:\AI_Agent\Gemini\Przykłady\Wykaz działów gospodarczych FI 092024.XLSX")

# Wydrukuj kilkanaście wierszy by poznać strukturę
print(df.head(20).to_string())
print("\nWszystkie kolumny:")
print(df.columns.tolist())
