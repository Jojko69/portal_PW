# portal_PW – kontekst projektu dla Claude Code

## Co to jest
Wewnętrzny portal webowy PW z mapą budynków i edytorami danych.
Stos: Node.js (plain `http` module) + HTML/JS/CSS (vanilla) + Leaflet.js.
Brak frameworków (bez Express, bez React).

## Architektura
- `server.js` – Node.js HTTP server na porcie 3000; serwuje `docs/` jako static root
- `docs/index.html` – mapa 54 obiektów PW (Leaflet + OpenStreetMap)
- `docs/edytor.html` – edytor współrzędnych i atrybutów markerów
- `docs/edytor_kody.html` – edytor kodów jednostek organizacyjnych
- `docs/edytor_telefony.html` – edytor książki telefonicznej
- `docs/data/*.json` – jedyne źródło danych (zapisywane przez POST endpoints)
- `scripts/*.py` – konwertery Python: Excel PW → JSON

## API endpoints
- `POST /api/save-mapa` → zapisuje `docs/data/mapa_obiektow.json`
- `POST /api/save-telefony` → zapisuje `docs/data/data_index_partial_optimized.json`
- `POST /api/save-kody` → zapisuje `docs/data/kody_jednostek.json`
Wszystkie przyjmują surowy JSON body — brak walidacji schema po stronie serwera.

## Dane
- `mapa_obiektow.json` – lista budynków z polami: `id`, `name`, `kod_mpk`, `lat`, `lng`, `opis`
- `data_index_partial_optimized.json` – dane telefoniczne (osoby + jednostki)
- `kody_jednostek.json` – kody jednostek organizacyjnych PW

## Pułapki
- Serwer zapisuje JSON bezpośrednio do pliku bez walidacji — nieprawidłowy JSON zniszczy dane
- Ścieżki statyczne są rozwiązywane względem `docs/` — nie `public/` (zmiana dla GitHub Pages)
- Brak autentykacji — portal przeznaczony do użytku lokalnego/sieci wewnętrznej

## Uruchomienie
```bash
node server.js   # http://localhost:3000
```

## Stan
Gotowy. 54 budynki PW z współrzędnymi, tooltip z kodem MPK, edytory działają.
