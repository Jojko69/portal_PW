import json
import pandas as pd

json_path = r'F:\AI_Agent\Gemini\Nowe_wersje\kody_jednostek.json'
csv_path = r'F:\AI_Agent\Gemini\Przykłady\struktura.csv'

with open(json_path, 'r', encoding='utf-8') as f:
    json_data = json.load(f)

# Wczytujemy z kodowaniem zgodnym z Windowsem (prawdopodobnie CP1250, ale upewnijmy się i obsłużmy ewentualne UTF-8)
try:
    df = pd.read_csv(csv_path, sep=';', encoding='utf-8')
except UnicodeDecodeError:
    df = pd.read_csv(csv_path, sep=';', encoding='cp1250')

# Słownik do łatwego i szybkiego aktualizowania (po małych literach, bez spacji brzegowych)
json_map = {item['name'].lower().strip(): item for item in json_data}

added_count = 0
updated_count = 0

for index, row in df.iterrows():
    name = str(row['Nazwa jednostki']).strip()
    symbol = str(row['Symbol']).strip()
    kod = str(row['Kod']).strip()
    
    if name == 'nan' or name == '':
        continue
        
    name_key = name.lower()
    
    # Czyszczenie "brak danych"
    clean_symbol = symbol if symbol != 'brak danych' and symbol != 'nan' else ""
    clean_code = kod if kod != 'brak danych' and kod != 'nan' else ""
    
    if name_key in json_map:
        # Zaktualizuj symbol i kod jeśli są dostępne nowe (pomijamy nadpisywanie "brak danych", żeby nie stracić poprzednich danych)
        if clean_symbol:
            json_map[name_key]['symbol'] = clean_symbol
            updated_count += 1
        if clean_code:
            json_map[name_key]['code'] = clean_code
    else:
        # To jest nowy wpis - ustalmy typ i go dodajmy
        typ = "Jednostka"
        if name_key.startswith("wydział") or name_key.startswith("wydz."):
            typ = "Wydział"
        elif name_key.startswith("instytut") or name_key.startswith("inst."):
            typ = "Instytut"
        elif name_key.startswith("zakład") or name_key.startswith("zakł."):
            typ = "Zakład"
        elif name_key.startswith("laboratorium") or name_key.startswith("lab."):
            typ = "Laboratorium"
        elif name_key.startswith("dział") or name_key.startswith("dz."):
            typ = "Administracja"
        elif name_key.startswith("ośrodek") or name_key.startswith("ośr."):
            typ = "Ośrodek"
        elif name_key.startswith("centrum"):
            typ = "Centrum"
        elif name_key.startswith("prorektor") or name_key.startswith("rektor"):
            typ = "Władze"
            
        new_item = {
            "type": typ,
            "name": name,
            "symbol": clean_symbol,
            "code": clean_code
        }
        json_data.append(new_item)
        added_count += 1

# Posortujmy alfabetycznie (np. po nazwie, ułatwi to późniejsze przeglądanie)
json_data.sort(key=lambda x: x['name'])

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)

print(f"Baza Kody Jednostek zaktualizowana! Zaktualizowano (lub zweryfikowano): {updated_count}, Dodano nowych: {added_count}. W sumie rekordów: {len(json_data)}")
