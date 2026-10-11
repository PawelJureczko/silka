# Weryfikacja layoutu, 11.10.2026

Zakres: zmiana prezentacji istniejących ekranów przy użyciu `antislop`, `antislop-ui` i `antislop-layoutmobile`, tryb `during`. Kierunek i powody decyzji są w `DESIGN.md`. Wcześniejsze zmiany etapu 4 pozostają w katalogu roboczym. Ta weryfikacja nie zastępuje testów RLS ani wydania PWA na iOS.

## Wykonane sprawdzenia

- Node 22: `npm run lint`, `npm run typecheck`, `npm test` (18/18), `npm run build`: sukces.
- Przeglądarka: szerokości 320, 390, 700, 850, 1000 i 1280 px. Start, plany, trening, postępy i formularz profilu: szerokość dokumentu równa viewportowi. Sprawdzono również edytor planu.
- Główne widoczne przyciski, linki, pola i rozwijane szczegóły: obszary co najmniej 44 × 44 px. Link pomijający nawigację jest ukryty do otrzymania focusu.
- Nawigacja dolna poniżej 1000 px, w nagłówku od 1000 px. Dwie kolumny od 700 px; akcje planu w trzeciej kolumnie od 1000 px.
- Kontrast tokenów: tekst główny/tło 19,06:1, tekst drugorzędny/tło 7,76:1, tekst drugorzędny/powierzchnia 6,91:1, tekst główny/interaktywne tło 14,27:1, tło/limonka 15,23:1. Wyłączone kontrolki mają odrębny stan.
- Tab przenosi focus do nawigacji, Enter otwiera Start, Escape zamyka dialogy. Focus ma obrys 2 px. Formularze mają 16 px; w CSS pozostaje obsługa ograniczenia ruchu.
- Po poprawce rejestracji hooków i synchronicznym utworzeniu `useAsyncData` w postępach: ponowne przejście Start → Postępy bez nowych ostrzeżeń i błędów konsoli.

## Kliknięcia i wyniki

| Element | Wynik |
| --- | --- |
| Logowanie, pokaż/ukryj hasło | Zmiana widoczności i wejście na lokalne konto. |
| Start, Plany, Postępy, Profil, nazwa aplikacji | Otwierają właściwe istniejące ekrany; sekcja planów obejmuje też podstrony. |
| Jednostka i Rozpocznij trening | Wybrana jednostka utworzyła lokalną sesję testową. |
| Edytuj plan | Otwiera istniejący edytor z danymi. |
| Nowy plan | Otwiera formularz bez zapisu. |
| Importuj kopię | Otwiera importer; niepełny JSON pokazuje czytelny błąd. |
| Katalog, wyszukiwanie | Fraza „przysiad” zwróciła pasujące ćwiczenia. |
| Archiwizuj | Otwiera dialog; Escape anuluje bez zmiany planu. |
| Moje plany / Archiwum | Zmieniają zakres; puste archiwum ma opis. |
| Powtórzenia i ciężar | Przyjęły 12 i `83,75`; wykonanie zapisało się na lokalnym koncie. |
| Oznacz wykonaną | Widoczny stan wykonania i uruchomiony odpoczynek. |
| +30 s / Zakończ odpoczynek | Wydłuża i usuwa timer. |
| + Dodaj serię / Pomiń | Dodana czwarta seria; pominięta seria ma tekst i kontrolkę przywrócenia. |
| Zaproponuj ciężar / Zobacz zastosowanie | Propozycja 85 kg, podgląd konkretnych serii; Escape anuluje. |
| Zakończ trening | Otwiera dialog; Escape anuluje. |
| Porzuć / Potwierdź porzucenie | Zamknęły sesję testową; nie zmieniły rekordu. |
| Wykres | Przełączenie z ciężaru na powtórzenia i z powrotem. |
| Wyniki sesji / Jak liczymy wyniki? / Tygodnie w liczbach | Rozwijają i zwijają prawdziwe dane oraz objaśnienia. |
| Status / Okres | Zmieniają zakres historii. |
| Dalej / Wstecz | Przechodzą między stronami historii. |
| Edytuj profil, cel tygodnia, strefa | Działające pola; Anuluj przywrócił zapisane 4 i Europe/Warsaw. |
| Wyloguj się | Powrót do logowania podczas zmiany lokalnych kont. |

## Delivery Gate

Raport dotyczy zmienionego layoutu i wymienionych przepływów. Dane użytkownika, w tym nazwy planów, pozostają nienaruszone. Istniejące tytuły kart przeglądarki nie były przedmiotem redakcji.

### 1. Hard Gate

- PASS R-02: nowe teksty widoków nie używają długiej pauzy; nazwy danych zachowane.
- PASS R-03: brak poziomego przewijania w sprawdzonych szerokościach; poprawiono zawijanie numeru planu.
- PASS R-17, R-18, R-38: metryki z bazy; zrzuty z wynikami używają wyłącznie lokalnych, oznaczonych danych testowych. Nie dodano fikcyjnej treści do kont w chmurze.
- PASS R-23: brak nowych grafik, zdjęć, ikon, fontów ani pozycji nawigacji; nazwa korzysta z istniejącego tekstu.
- PASS R-24, R-26: istniejące trasy i akcje; wyniki kliknięć powyżej.
- PASS R-25: paleta tekstów przekracza 4,5:1; liczby i etykiety uzupełniają kolor wykresów.
- PASS R-27: sprawdzone ładowanie, puste archiwum, puste postępy rzeczywistego konta oraz błąd importu. Zachowano błędy odczytu i ponowienia.
- PASS R-28: brak FAQ.
- PASS R-32: Tab, Enter, Escape i widoczny obrys focusu.
- PASS R-33: zmiany zapisane bezpośrednio w źródłach, bez skryptów przepisujących UI.
- PASS R-34: podstawowy dark mode wynika z briefu; brak przełącznika motywu.
- PASS R-35: uruchomiona aplikacja, build i zapisany przebieg kliknięć.
- PASS R-36: brak nowych deklaracji bezpieczeństwa, wydajności lub zgodności.
- PASS R-37: kierunek zadeklarowany przed zmianami, zapisany w `DESIGN.md`.

### 2. Purpose-Gate

- PASS R-01, R-07, R-13: brak gradientów, świecenia i dekoracyjnej siatki.
- PASS R-04, R-06: zachowane ikony funkcjonalne; systemowy font i mocne liczby mają zapisany cel.
- PASS R-08: usunięte strzałki z głównych przycisków; pozostają przy kierunkowej nawigacji.
- PASS R-09: usunięte dekoracyjne kapsuły i wskaźniki; etykieta aktywnego planu oznacza rzeczywisty stan.
- PASS R-10, R-12: nawigacja jest nieprzezroczysta; cień timera odróżnia przypięty element od treści.
- PASS R-14: start ma powierzchnię głównej akcji, plany spis, postępy wynik i wykres.
- PASS R-19, R-22: brak ilustracji i ciągłych animacji; interakcje respektują ograniczenie ruchu.

### 3. Liveliness

- PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 zapisane w kierunku.
- PASS: główne punkty uwagi to start sesji, numerowany spis i rekord ćwiczenia.
- PASS: odstępy oraz linie rozdzielają różne rodzaje treści; limonka wskazuje akcję, wynik i aktywną pozycję.
- PASS: motyw dziennika wynika z rzeczywistej kolejności, cyfr tablicowych i mocnej typografii; nie dodaje fikcyjnych elementów.
- PASS: Design Read przekazany przed implementacją.

### 4. Craftsmanship

- PASS C-1, R-31: decyzje mają konkretne powody w `DESIGN.md`.
- PASS C-2: brak dodanych martwych kontrolek; zapisany przebieg testów powyżej.
- PASS C-3, R-05: układ wynika z rozpoczęcia treningu, wyboru planu i porównania wyników.
- PASS C-4: testowane szerokości, focus, dialogi i stany; brak automatycznego ukrywania przepełnienia.
- PASS C-5: źródłem wyników jest baza, bez marketingowych statystyk.
- PASS R-11: kontrolki 6 px, serie 8 px, powierzchnie 12 px, bez wszechobecnych kapsuł.
- PASS R-15, R-16: przyciski nazywają konkretne czynności, bez marketingowych haseł.
- PASS R-20, R-30: motyw zapisu jednostek i serii, bez kopiowania wskazanego produktu referencyjnego.
- PASS R-21, R-29: paleta i dark mode pochodzą z uzgodnionego briefu.

## Granice weryfikacji

To testy w przeglądarce, nie na fizycznym iPhonie. Klawiatura ekranowa, safe area zainstalowanej PWA oraz sygnał timera przy zablokowanym ekranie nadal wymagają weryfikacji na urządzeniu. W tej zmianie nie dodano zależności, migracji ani nowych funkcji produktu. Testów bazy i Auth nie powtarzano dla zmian prezentacji.
