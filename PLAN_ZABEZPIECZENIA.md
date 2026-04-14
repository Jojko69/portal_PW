# Plan: Zabezpieczenie portalu PW hasłem (static hosting)

## Kontekst

Portal PW to aplikacja HTML/CSS/JS (w katalogu `docs/`) z backendem Node.js.
Na statycznym hostingu działa **tylko folder `docs/`** — serwer Node.js nie jest dostępny.
Użytkownik ma hosting na **Hostinger.com** (shared hosting Apache) — obsługuje `.htaccess` w pełni.
Użytkownik chce zablokować dostęp osobom nieuprawnionym przy minimalnym nakładzie pracy,
bez dedykowanego backendu autentykacji.

Cel: dodać ekran logowania hasłem, który zatrzyma nieupoważnionych użytkowników,
nie wymagając żadnego serwera ani bazy danych.

---

## Podejście: dwie warstwy ochrony

### Warstwa 1 — `.htaccess` HTTP Basic Auth (Apache hosting)
Działa na **większości polskich hostingów** (home.pl, cyber-folks, LH.pl, OVH, linuxpl.com).
Przeglądarka wyświetla natywne okno logowania — bez JavaScript, nie da się ominąć bez hasła.
Hasło jest przechowywane jako hash MD5/bcrypt w pliku `.htpasswd`.

### Warstwa 2 — Własna strona logowania w JS (fallback)
Estetyczniejsza, działa też na GitHub Pages / Netlify / każdym hostingu.
Logika: SHA-256 wpisanego hasła jest porównywana z zakodowanym hashem w `auth.js`.
Po poprawnym logowaniu token trafia do `sessionStorage` — strony portalu sprawdzają jego obecność.
**Ważne:** to zabezpieczenie jest łamliwe przez kogoś, kto analizuje kod JS.
Zatrzymuje nieświadome osoby, nie zatrzyma zdeterminowanego hakera.

---

## Plan implementacji (obie warstwy jednocześnie)

### Pliki do utworzenia

#### 1. `docs/.htaccess` — ochrona HTTP Basic Auth
```
AuthType Basic
AuthName "Portal PW - dostep tylko dla uprawnionych"
AuthUserFile /sciezka/do/.htpasswd
Require valid-user
```
> Ścieżka do `.htpasswd` musi być **bezwzględna** — do uzupełnienia po sprawdzeniu ścieżki na hostingu.

#### 2. `docs/.htpasswd` — plik z hashem hasła
Generowany narzędziem `htpasswd` (online lub lokalnie):
```
admin:$apr1$XXXXXXXXXX$HASH_HASLA
```
> Hasło i login do ustalenia przez użytkownika przed wdrożeniem.

#### 3. `docs/js/auth.js` — moduł JS do ochrony stron (warstwa 2)
```javascript
// SHA-256 hash hasła dostępu (zmień HASH na wynik: sha256("TwojeHaslo"))
const HASH_DOSTEPU = "WSTAW_HASH_SHA256_TUTAJ";
const KLUCZ_SESJI  = "portal_pw_auth";

async function sha256(text) {
    const buf = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Wywołaj na chronionych stronach: guardPage()
async function guardPage() {
    if (sessionStorage.getItem(KLUCZ_SESJI) !== "ok") {
        window.location.replace("login.html");
    }
}

// Wywołaj na login.html: handleLogin(haslo)
async function handleLogin(haslo) {
    const hash = await sha256(haslo);
    if (hash === HASH_DOSTEPU) {
        sessionStorage.setItem(KLUCZ_SESJI, "ok");
        window.location.replace("index.html");
        return true;
    }
    return false;
}
```

#### 4. `docs/login.html` — strona logowania (warstwa 2)
Prosta strona z formularzem hasła, dopasowana wizualnie do portalu PW.
Używa `handleLogin()` z `auth.js`.
Zawiera: pole hasła, przycisk, komunikat błędu, logo/tytuł portalu.

### Pliki do modyfikacji

#### 5. `docs/index.html` — dodaj guard na początku `<body>`
```html
<script src="js/auth.js"></script>
<script>guardPage();</script>
```

#### 6. `docs/edytor.html`, `docs/edytor_telefony.html`, `docs/edytor_kody.html`
— analogicznie: dodać ten sam blok `<script>` z `auth.js` i `guardPage()`.

---

## Pliki krytyczne do modyfikacji

| Plik | Akcja |
|------|-------|
| `docs/.htaccess` | NOWY — HTTP Basic Auth |
| `docs/.htpasswd` | NOWY — hash hasła |
| `docs/js/auth.js` | NOWY — logika JS auth |
| `docs/login.html` | NOWY — ekran logowania |
| `docs/index.html` | MODYFIKACJA — dodanie guard |
| `docs/edytor.html` | MODYFIKACJA — dodanie guard |
| `docs/edytor_telefony.html` | MODYFIKACJA — dodanie guard |
| `docs/edytor_kody.html` | MODYFIKACJA — dodanie guard |

---

## Kroki wdrożenia na Hostinger

> **Sytuacja:** Konto `u328857532`. File Browser pokazuje katalog główny — to jest web root
> (odpowiednik `public_html`). Nie można wejść wyżej przez panel. `.htpasswd` umieścimy
> w tym samym katalogu, ale zablokujemy jego pobieranie regułą w `.htaccess`.

### A. Zawartość pliku `.htaccess`
```apache
# --- Ochrona hasłem ---
AuthType Basic
AuthName "Portal PW - dostep tylko dla uprawnionych"
AuthUserFile /home/u328857532/.htpasswd
Require valid-user

# --- Blokada bezpośredniego pobrania pliku .htpasswd ---
<Files ".htpasswd">
    Require all denied
</Files>
```
> Ścieżka `/home/u328857532/.htpasswd` opiera się na widocznym loginie `u328857532`.
> Jest to standardowy format ścieżek na Hostingerze.

### B. Wygenerowanie `.htpasswd`
1. Wejdź na stronę: `hostingcanada.org/htpasswd-generator`
2. Wpisz **login** (np. `admin`) i **hasło** (własne, dowolne)
3. Skopiuj wynik — wygląda tak: `admin:$apr1$XXXX$HASH_HASLA`
4. Utwórz plik `.htpasswd` w File Browser i wklej tę linię

### C. Wgranie plików portalu
1. Wgrać cały folder `docs/` jako zawartość katalogu głównego (pliki prosto do roota, nie w podfolderze)
2. Plik `.htaccess` i `.htpasswd` — do tego samego katalogu co `index.html`

### D. Wygenerowanie SHA-256 do auth.js (warstwa JS)
1. Wejdź na stronę do generowania SHA-256 (np. `emn178.github.io/online-tools/sha256.html`)
2. Wpisz swoje hasło (może być to samo co do `.htpasswd`)
3. Skopiuj hash (64 znaki hex) do pliku `auth.js` w miejscu `WSTAW_HASH_SHA256_TUTAJ`

---

## Weryfikacja

- Otworzyć `index.html` w przeglądarce bez logowania → powinno przekierować na `login.html`
- Wpisać złe hasło → komunikat błędu, brak dostępu
- Wpisać prawidłowe hasło → dostęp do portalu
- Zamknąć kartę i otworzyć ponownie → znowu wymaga hasła (sessionStorage wygasa)
- Sprawdzić, czy ochrona `.htaccess` działa (przeglądarka pytanie natywnym oknem)

---

## Co TO daje, a czego NIE daje

| | HTTP Basic Auth (.htaccess) | JS login (auth.js) |
|---|---|---|
| Zatrzymuje zwykłego użytkownika | ✅ Tak | ✅ Tak |
| Zatrzymuje boty/crawlery | ✅ Tak | ✅ Częściowo |
| Działa bez JS | ✅ Tak | ❌ Nie |
| Chroni pliki .json z danymi | ✅ Tak | ❌ Nie (można pobrać bezpośrednio) |
| Da się ominąć przez analityka JS | N/D | ⚠️ Tak |
| Wymaga serwera | Apache shared | Każdy hosting |

> Dla pełnej ochrony danych JSON (4,5 MB baza kontaktów) — `.htaccess` jest konieczny,
> bo JS login nie chroni bezpośredniego dostępu do pliku `data/data_index_partial_optimized.json`.
