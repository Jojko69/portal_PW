import pandas as pd
import json
import math

df = pd.read_excel(r"F:\AI_Agent\Gemini\Przykłady\Wykaz działów gospodarczych FI 092024.XLSX")

exceptions = {
    "4000": "90000009",
    "5000": "90000013",
    "6000": "90000007",
    "1000": "90000015",
    "2000": "90000010",
    "3000": "90000008"
}

def determine_type(name):
    name_lower = str(name).lower()
    if name_lower.startswith("wydział") or name_lower.startswith("wydz."):
        return "Wydział"
    if name_lower.startswith("instytut") or name_lower.startswith("inst."):
        return "Instytut"
    if name_lower.startswith("zakład") or name_lower.startswith("zakł."):
        return "Zakład"
    if name_lower.startswith("laboratorium") or name_lower.startswith("lab."):
        return "Laboratorium"
    if name_lower.startswith("dział") or name_lower.startswith("dz."):
        return "Administracja"
    if name_lower.startswith("ośrodek") or name_lower.startswith("ośr."):
        return "Ośrodek"
    if name_lower.startswith("centrum"):
        return "Centrum"
    if name_lower.startswith("prorektor"):
        return "Władze"
    return "Jednostka"

def generate_symbol(name):
    words = str(name).replace(".", " ").replace("-", " ").split()
    acronym = "".join([w[0].upper() for w in words if w and w[0].isalpha() and w.lower() not in ["i", "z", "ds", "na", "o", "w"]])
    return acronym

results = []

for index, row in df.iterrows():
    dzial = str(row['Dział gospodarczy']).strip()
    # Pomiń jeśli to nie jest kod numeryczny (albo pusty wiersz)
    if dzial == 'nan' or not dzial.isdigit():
        continue
        
    name = str(row['Opis działu gospodarczego']).strip()
    if name == 'nan':
        name = "Brak nazwy"
        
    # Zastosuj logikę
    if dzial in exceptions:
        code = exceptions[dzial]
    else:
        code = dzial + "0000"
        
    obj = {
        "type": determine_type(name),
        "name": name,
        "symbol": generate_symbol(name),
        "code": code
    }
    results.append(obj)

# Zapisz do JSON
output_path = r"F:\AI_Agent\Gemini\Nowe_wersje\kody_jednostek.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=4)

print(f"Zapisano {len(results)} kodów do pliku {output_path}")
