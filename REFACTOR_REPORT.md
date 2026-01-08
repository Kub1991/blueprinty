# Raport Analizy Kodu: Top 3 pliki do refaktoryzacji

Po głębokiej analizie projektu blueprinty, zidentyfikowałem trzy obszary, które najbardziej wymagają uwagi programistycznej. Skupiłem się na zasadzie **Single Responsibility Principle (SRP)** oraz modularności.

---

## 1. `components/UserApp.tsx` (Typ: "God Component")
**Rozmiar:** 639 linii
**Problem:** To serce aplikacji dla użytkownika końcowego, które robi zdecydowanie za dużo.
- **Mieszanie widoków:** Obsługuje jednocześnie logikę Desktopową i Mobile w jednym wielkim bloku JSX.
- **Dane testowe:** Zawiera `MOCK_REVIEWS`, które zaśmiecają kod komponentu.
- **Złożoność stanowa:** Zarządza wieloma nakładającymi się stanami drawerów, szczegółów punktów i filtrów.

### Propozycja refaktoryzacji:
- Rozbicie na mniejsze pod-komponenty: `UserAppDesktop.tsx` i `UserAppMobile.tsx`.
- Przeniesienie `MOCK_REVIEWS` do osobnego pliku `src/data/mockData.ts`.
- Wydzielenie logiki zarządzania "aktywnym punktem" do dedykowanego hooka `useActivePoint`.

---

## 2. `convex/actions/ytProcessor.ts` (Typ: "Spaghetti Action")
**Rozmiar:** 463 linie
**Problem:** Ten plik jest mózgiem backendu, ale cierpi na ekstremalne przeładowanie obowiązkami.
- **Orkiestracja wszystkiego:** W jednej funkcji `processVideo` miesza się pobieranie transkrypcji (Supadata), analiza AI (Gemini) oraz wzbogacanie danych o adresy (Google Places).
- **Trudność testowania:** Przez to, że logiki są ze sobą splecione, bardzo trudno jest testować np. samo filtrowanie Shortsów bez wywoływania API YouTube.
- **Długie funkcje:** Handlery po 200+ linii są trudne w nawigacji i debugowaniu.

### Propozycja refaktoryzacji:
- Stworzenie folderu `convex/services/` i wydzielenie tam klas/funkcji: `YoutubeService.ts`, `GeminiService.ts`, `PlacesService.ts`.
- Akcja `ytProcessor` powinna jedynie wywoływać te usługi i zapisywać wyniki, a nie zawierać logikę parsowania stringów czy budowania URLi API.

---

## 3. `components/CreatorDashboard.tsx` (Typ: "Logic Leak")
**Rozmiar:** 369 linii
**Problem:** Komponent UI, który zawiera bardzo dużo logiki biznesowej i zarządzania danymi.
- **Zduplikowane dane:** Zawiera twardo zakodowane tablice dla wykresów `recharts`.
- **Zbyt wiele odpowiedzialności:** Zarządza podłączaniem kanału, listą wideo, procesowaniem AI i usuwaniem blueprintów jednocześnie.

### Propozycja refaktoryzacji:
- Wydzielenie sekcji statystyk do `CreatorStats.tsx`.
- Przeniesienie logiki zarządzania listą filmów i ich statusem do dedykowanego hooka (np. `useCreatorVideos`).
- Ujednolicenie sposobu obsługi błędów (aktualnie rozsiane po wielu funkcjach `handle...`).

---

### Honorowe wyróżnienie: `hooks/useVerifier.ts`
Plik ten zarządza całym procesem weryfikacji punktów przez twórcę. Jest bardzo gęsty od stanów (`points`, `currentIndex`, `isEditing`, `inputValue`). Warto rozważyć rozbicie go na mniejszy zestaw hooków: `usePointEditor` i `useExtractionFlow`.
