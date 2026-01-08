# 🚀 Przewodnik Deploymentu (Netlify + Convex)

Ten dokument opisuje, jak przenieść aplikację z trybu lokalnego (DEV) na produkcję (PROD).

## 1. Dlaczego izolujemy DEV od PROD?

Aktualnie pracujesz na środowisku `dev:aware-robin-638`. W Convex środowiska są odizolowane:

- **DEV**: Szybkie zmiany, automatyczna synchronizacja kodu, testowe dane.
- **PROD**: Stabilny URL, ręczny deployment komendą `npx convex deploy`, produkcyjne dane.

Dzięki temu zmiany, które robisz teraz lokalnie, nie popsują działającej strony dla użytkowników, dopóki nie będziesz na to gotowy.

---

## 2. Krok po kroku: Backend (Convex)

1. **Ustaw zmienne środowiskowe**:
   Wejdź do [Convex Dashboard](https://dashboard.convex.dev). Wybierz swój projekt i przejdź do **Settings > Environment Variables**.
   Dodaj tam klucze, które masz w pliku `.env.local`:
   - `GEMINI_API_KEY`
   - `YOUTUBE_API_KEY`
   - `SUPADATA_API_KEY`

2. **Wdróż kod**:
   W terminalu (główny folder projektu) wpisz:

   ```bash
   npx convex deploy
   ```

   To skopiuje Twój aktualny schemat i funkcje do środowiska produkcyjnego.

3. **Pobierz Production URL**:
   Adres URL produkcji znajdziesz w Dashboardzie lub po wpisaniu:
   ```bash
   npx convex dev # Pokaże adresy w konsoli, szukaj "Production URL"
   ```

---

## 3. Krok po kroku: Frontend (Netlify)

W panelu Netlify (**Site Settings > Environment variables**) dodaj:

| Nazwa zmiennej             | Skąd wziąć?                                                 |
| :------------------------- | :---------------------------------------------------------- |
| `VITE_CONVEX_URL`          | Adres URL produkcji z Convex (zaczyna się od `https://...`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Twój klucz API Google Maps                                  |

---

## 4. Zabezpieczenie Map Google (WAŻNE)

Klucz Map musi być publiczny we frontendzie. Aby nikt go nie ukradł:

1. Idź do [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials).
2. Edytuj klucz API.
3. W sekcji **Application restrictions** wybierz **Websites (HTTP referrers)**.
4. Dodaj adres swojej domeny z Netlify (np. `https://twoja-apka.netlify.app/*`).

---

## 5. Komendy CLI

| Akcja                       | Komenda                                                         |
| :-------------------------- | :-------------------------------------------------------------- |
| Praca lokalna               | `npm run dev` oraz `npx convex dev`                             |
| Wysłanie zmian na produkcję | `npx convex deploy`                                             |
| Budowanie frontendu         | `npm run build` (Netlify robi to automatycznie po pushu do Git) |
