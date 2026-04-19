# Portal PW

Wewnętrzny portal webowy do przeglądania i edycji danych Politechniki Warszawskiej.
Uruchamia się lokalnie jako serwer Node.js — dane przechowywane w plikach JSON.

---

## Funkcjonalności

### Mapa obiektów
- Interaktywna mapa 54 budynków i obiektów Politechniki Warszawskiej
- Oparty na Leaflet.js z podkładem OpenStreetMap
- Tooltip z kodem MPK i nazwą obiektu po najechaniu
- Kliknięcie w marker otwiera szczegóły budynku

### Edytor mapy
- Dodawanie nowych obiektów na mapie (klik → formularz)
- Edycja istniejących wpisów (współrzędne, nazwa, kod MPK)
- Zapis przez `POST /api/save-mapa`

### Edytor kodów jednostek
- Lista kodów jednostek organizacyjnych PW
- Edycja nazw i kodów
- Zapis przez `POST /api/save-kody`

### Książka telefoniczna
- Lista osób i jednostek z numerami telefonów
- Edycja wpisów
- Zapis przez `POST /api/save-telefony`

---

## Uruchomienie

### Wymagania
- Node.js (dowolna aktualna wersja LTS)

### Start serwera

```bash
node server.js
```

Aplikacja dostępna pod adresem: **http://localhost:3000**

---

## Struktura projektu

```
portal_PW/
├── server.js                      # Serwer HTTP Node.js (port 3000)
├── docs/                          # Pliki statyczne (public root)
│   ├── index.html                 # Główna strona (zakładka: mapa)
│   ├── edytor.html                # Edytor mapy
│   ├── edytor_kody.html           # Edytor kodów jednostek
│   ├── edytor_telefony.html       # Edytor książki telefonicznej
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   └── [skrypty aplikacji]
│   └── data/
│       ├── mapa_obiektow.json               # Dane budynków + współrzędne
│       ├── data_index_partial_optimized.json # Dane telefoniczne
│       └── kody_jednostek.json              # Kody jednostek organizacyjnych
└── scripts/
    ├── check_excel.py             # Walidacja źródłowego pliku Excel
    ├── process_kody.py            # Przetwarzanie kodów z Excela → JSON
    └── update_kody.py             # Aktualizacja kody_jednostek.json
```

---

## API serwera

| Endpoint | Metoda | Opis |
|---|---|---|
| `GET /` | GET | Serwuje `docs/index.html` |
| `GET /*` | GET | Serwuje pliki statyczne z `docs/` |
| `/api/save-mapa` | POST | Zapisuje `docs/data/mapa_obiektow.json` |
| `/api/save-telefony` | POST | Zapisuje `docs/data/data_index_partial_optimized.json` |
| `/api/save-kody` | POST | Zapisuje `docs/data/kody_jednostek.json` |

Wszystkie endpointy POST przyjmują i zapisują surowy JSON — brak walidacji po stronie serwera.

---

## Technologie

| Technologia | Zastosowanie |
|---|---|
| Node.js (wbudowane `http`, `fs`) | Serwer HTTP bez zewnętrznych frameworków |
| HTML5 / CSS3 / JavaScript | Frontend (vanilla, bez frameworka) |
| [Leaflet.js 1.9.4](https://leafletjs.com) | Interaktywna mapa |
| OpenStreetMap | Podkład kartograficzny |
| JSON | Przechowywanie danych (pliki w `docs/data/`) |

---

## Aktualizacja danych

Dane budynków, telefonów i kodów jednostek można zaktualizować ręcznie przez edytory
w interfejsie webowym lub przez skrypty Pythona w katalogu `scripts/` (źródło: pliki Excel PW).

---

## Licencja

Projekt wewnętrzny — przeznaczony do użytku na Politechnice Warszawskiej.
<!-- test sync Sun, Apr 19, 2026  3:29:38 PM -->
