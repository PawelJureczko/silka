# Weryfikacja konsultacji AI, 11.10.2026

Zakres: etap 5 oraz jego dwa nowe ekrany, przy istniejącym kierunku `DESIGN.md`. Antislop `during`, ENERGY 2 / RHYTHM 2 / MOTION 1. To ręczna wymiana JSON; przeglądarka nie obsługiwała zewnętrznego LLM. Odpowiedzi użyte w testach UI były jawnie testowe i dotyczyły wyłącznie lokalnej bazy.

## Sprawdzenia funkcjonalne

- `npm test`: 23/23. Pięć nowych testów obejmuje kontrakt, redakcję promptu, granice UTF-8, powiązanie odpowiedzi, wybór serii, brak mutacji wejścia i różnice planu.
- `npm run test:ai`: 8/8. Cztery akcje, RLS dwóch kont i anonima, podmiana właściciela i FK, niedostępne ćwiczenie, ścisła walidacja, rollback, rewizja i ponowienie.
- Regresja: `test:db` 75/75, `test:auth` 2/2, `test:plans` 7/7, `test:workouts` 7/7, `test:progress` 7/7.
- `lint`, `typecheck`, `build`: sukces. Typy wygenerowane z lokalnej bazy przez `db:types`.
- Migracje 009 i 010 zastosowane lokalnie i w chmurze. SQL Editor potwierdził obie wersje w historii migracji i RLS na `ai_consultations`.

## Kliknięcia i wyniki

| Kontrolka lub stan | Zaobserwowany wynik |
| --- | --- |
| Konsultacja AI z planów / Skonsultuj plan z AI z edytora | Formularz; edytor wskazuje zapisany plan. |
| Cel konsultacji, plan, historia, własne instrukcje | Cztery cele; plan wymagany dla zmiany i progresji; prompty z 0 i 10 sesjami; instrukcja weszła do kontekstu. |
| Przygotuj prompt | Osobna konsultacja z trwałym ID, bez zmiany planu. |
| Kopiuj prompt / Zobacz cały prompt | Komunikat kopiowania; rozwinięty pełny tekst dostępny do ręcznego kopiowania. |
| Wklej JSON / Sprawdź odpowiedź | Błąd niepełnego JSON; poprawny JSON pokazuje podgląd. Zmiana tekstu usuwa poprzedni podgląd. |
| Anuluj podgląd | Ukrywa propozycję bez zapisu. |
| Seria dla propozycji / Pokaż zmiany ciężarów | Brak wyboru blokuje zatwierdzenie; wskazana seria pokazuje 80 → 82,5 kg. |
| Zatwierdź propozycję / Zachowaj analizę | Natywny dialog z jawnym potwierdzeniem. |
| Zamknij okno / Escape / Tab | Zamknięcie bez zapisu; Tab przenosi focus na potwierdzenie. |
| Potwierdź zapis / Otwórz zapisany plan | Nowy plan odczytany w edytorze; progresja zapisuje wskazany ciężar. |
| Nowa konsultacja / lista powrotu | Powrót do formularza i otwarcie istniejącej konsultacji. |
| Odświeżenie | Zachowana analiza i wynik zatwierdzenia odczytane ponownie. |
| Nieaktualna rewizja | Czytelny błąd przed podglądem; brak propozycji do zatwierdzenia. |
| Błąd sieci / Spróbuj ponownie na obu ekranach | Zatrzymana wyłącznie lokalna brama Supabase; komunikaty błędu, po przywróceniu udane odczyty. |

## Delivery Gate

### 1. Hard Gate

- PASS R-02: nowe teksty widoków nie zawierają długiej pauzy; nazwy planów są danymi użytkownika.
- PASS R-03: formularz i podgląd bez poziomego przewijania przy 320, 390, 700, 850, 1000 i 1280 px; pomiary szerokości dokumentu równe viewportowi.
- PASS R-17, R-18, R-38: brak marketingowych statystyk i referencji; dane testowe wyłącznie w lokalnym Supabase, nazwane jako testowe.
- PASS R-23: brak nowych grafik, fontów, ikon i głównych pozycji nawigacji.
- PASS R-24, R-26: rzeczywiste trasy i akcje; wyniki kliknięć w tabeli powyżej.
- PASS R-25: istniejące tokeny i obliczenia kontrastu z `LAYOUT_REVIEW.md`: tekst drugorzędny na tle 7,76:1, na powierzchni 6,91:1; główny tekst na tle 19,06:1.
- PASS R-27: zaobserwowane ładowanie, pusta lista konsultacji, błędny JSON, konflikt i błąd połączenia z ponowieniem.
- PASS R-28: brak FAQ.
- PASS R-32: natywne pola i przyciski, jawne etykiety, focus 2 px, Tab oraz Escape w dialogu.
- PASS R-33: UI zapisano bezpośrednio w źródłach, bez skryptów przepisujących komponenty lub CSS.
- PASS R-34: dark mode wynika z briefu, bez przełącznika motywu.
- PASS R-35: działające serwery i build, przebieg nowych interakcji zapisany powyżej.
- PASS R-36: brak nowych obietnic zgodności, bezpieczeństwa lub wydajności; RLS ma testy integracyjne.
- PASS R-37: kierunek istnieje w `DESIGN.md`, nowe ekrany kontynuują dziennik treningów.

### 2. Purpose-Gate

- PASS R-01, R-07, R-13: brak gradientów, świecenia i dekoracyjnej siatki.
- PASS R-04, R-06: brak nowych ikon; systemowy sans i mocny nagłówek zgodne z zapisanym kierunkiem.
- PASS R-08, R-09: strzałki tylko przy powrocie, statusy jako tekst bez kapsuł.
- PASS R-10, R-12: płaskie sekcje, bez szkła i nowych cieni.
- PASS R-14: formularz i spis konsultacji mają różną rolę; odpowiedź ma porównanie danych w wierszach.
- PASS R-19, R-22: brak ilustracji i nowych animacji; istniejąca obsługa ograniczenia ruchu pozostaje w CSS.

### 3. Liveliness

- PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 wynikają z `DESIGN.md` i pozostają spójne z aplikacją.
- PASS: formularz prowadzi do przygotowania promptu; podgląd prowadzi do zatwierdzenia konkretnego wyniku.
- PASS: limonka oznacza główną akcję, linie i odstępy rozdzielają prompt, odpowiedź i propozycję.
- PASS: numeracja 01/02/03 rozwija motyw dziennika, a wiersze „Było / Propozycja” odpowiadają rzeczywistej zmianie danych.
- PASS: zastosowano istniejący Design Read; powody nowych decyzji zapisano w `DESIGN.md`.

### 4. Craftsmanship

- PASS C-1, R-31: zapisane powody numeracji, porównania i dwóch kolumn formularza.
- PASS C-2: kontrolki mają zaobserwowane wyniki opisane powyżej.
- PASS C-3, R-05: kompozycja wynika z ręcznego przepływu, bez sekcji marketingowych i kart funkcji.
- PASS C-4: sześć szerokości; widoczne kontrolki minimum 44 × 44 px; sprawdzone błędy, ponowienie i dialog z klawiatury.
- PASS C-5: brak wymyślonych twierdzeń; testowe dane są wyraźnie opisane.
- PASS R-11: istniejące promienie kontrolek 6 px i płaskie sekcje bez kapsuł.
- PASS R-15, R-16: konkretne nazwy czynności, bez haseł marketingowych.
- PASS R-20, R-30: numerowany dziennik i porównanie serii kontynuują własny motyw produktu.
- PASS R-21, R-29: dokładna paleta i podstawowy dark mode z briefu.

## Ograniczenia

Nie testowano zainstalowanej PWA ani klawiatury fizycznego iPhone'a. Przed zatwierdzeniem odpowiedź nie jest trwale zapisywana; odświeżenie ją usuwa, zachowując przygotowany kontekst na koncie. Konsultacje wymagają sieci. Zewnętrzny LLM wybiera i obsługuje użytkownik. Nie wykonano wdrożenia Vercel ani etapu 6.
